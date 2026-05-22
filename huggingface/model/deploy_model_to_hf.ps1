<#
.SYNOPSIS
    Deploy fine-tuned Kafi GGUF model to Hugging Face Model Hub.

.DESCRIPTION
    This script uploads the fine-tuned GGUF model, training data,
    model card, and Modelfile to a Hugging Face model repository.

.PARAMETER HfRepoName
    Your Hugging Face model repo in format "username/model-name"
    Example: "tristiyadi/kafi-barista-llama3.2-1b-gguf"

.PARAMETER SkipTrainingData
    If set, skips uploading the training data JSONL files.

.EXAMPLE
    .\deploy_model_to_hf.ps1 -HfRepoName "tristiyadi/kafi-barista-llama3.2-1b-gguf"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$HfRepoName,

    [Parameter(Mandatory=$false)]
    [switch]$SkipTrainingData,

    [Parameter(Mandatory=$false)]
    [string]$HfToken
)

if (-not $HfToken -and $env:HF_TOKEN) {
    $HfToken = $env:HF_TOKEN
}

$ErrorActionPreference = "Stop"

# ── Paths ──────────────────────────────────────────────────────
$PROJECT_ROOT = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$HF_MODEL_DIR = $PSScriptRoot
$FINE_TUNE_OUTPUT = Join-Path $PROJECT_ROOT "scripts\fine-tune\output"
$FINE_TUNE_DATA = Join-Path $PROJECT_ROOT "scripts\fine-tune\data"
$TRAIN_SCRIPT = Join-Path $PROJECT_ROOT "scripts\fine-tune\train.py"
$DEPLOY_DIR = Join-Path $PROJECT_ROOT "hf-model-deploy"

$GGUF_FILE = Join-Path $FINE_TUNE_OUTPUT "unsloth.Q4_K_M.gguf"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Deploying Model to Hugging Face Hub" -ForegroundColor Cyan
Write-Host " Repo: $HfRepoName" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# ── Step 1: Check prerequisites ──────────────────────────────
Write-Host "`n[1/7] Checking prerequisites..." -ForegroundColor Yellow

# Check git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git is not installed. Please install Git first."
    exit 1
}

# Check git-lfs
$lfsCheck = git lfs version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Git LFS is not installed. Install with: git lfs install"
    exit 1
}
Write-Host "  Git LFS: $lfsCheck" -ForegroundColor Green

# Check huggingface-cli
$hasCli = $false
if (Get-Command huggingface-cli -ErrorAction SilentlyContinue) {
    $hasCli = $true
} else {
    Write-Host "  huggingface-cli not found. Using pure Git deployment." -ForegroundColor Yellow
}

# Verify HF login or token
if ($hasCli) {
    $whoami = huggingface-cli whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        if ($HfToken) {
            Write-Host "  Not logged in via CLI, but HfToken was provided. Using Git token auth." -ForegroundColor Yellow
        } else {
            Write-Host "  You are not logged in to Hugging Face via CLI. Run 'huggingface-cli login' or supply -HfToken." -ForegroundColor Yellow
        }
    } else {
        Write-Host "  Logged in as: $whoami" -ForegroundColor Green
    }
} else {
    if (-not $HfToken) {
        Write-Host "  WARNING: huggingface-cli is not installed, and no HF Token was provided." -ForegroundColor Yellow
        Write-Host "  Git will prompt you for your Hugging Face credentials during clone/push." -ForegroundColor Yellow
        Write-Host "  (Use your Hugging Face Write Token as the password)" -ForegroundColor Yellow
    }
}

# Check GGUF file exists
if (-not (Test-Path $GGUF_FILE)) {
    Write-Error "GGUF file not found at: $GGUF_FILE"
    Write-Host "  Run the fine-tuning pipeline first:" -ForegroundColor Yellow
    Write-Host "  docker compose -f docker-compose.finetune.yml up --build" -ForegroundColor Yellow
    exit 1
}
$ggufSize = [math]::Round((Get-Item $GGUF_FILE).Length / 1MB, 1)
Write-Host "  GGUF file found: $ggufSize MB" -ForegroundColor Green

Write-Host "  All prerequisites OK" -ForegroundColor Green

# ── Step 2: Create or clone the HF model repo ───────────────
Write-Host "`n[2/7] Setting up HF model repo..." -ForegroundColor Yellow

if (Test-Path $DEPLOY_DIR) {
    Write-Host "  Removing existing deploy directory..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $DEPLOY_DIR
}

# Parse username and repo name
$repoParts = $HfRepoName.Split("/")
$username = $repoParts[0]
$repoName = $repoParts[1]

# Build remote URLs
$cloneUrl = "https://huggingface.co/$HfRepoName"
if ($HfToken) {
    $cloneUrl = "https://oauth2:$HfToken@huggingface.co/$HfRepoName"
}

# Try to clone (if repo exists)
Write-Host "  Cloning repo: $HfRepoName" -ForegroundColor Yellow
$oldPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"

git clone $cloneUrl $DEPLOY_DIR
if ($LASTEXITCODE -ne 0) {
    if ($hasCli) {
        Write-Host "  Repo doesn't exist yet. Creating..." -ForegroundColor Yellow
        huggingface-cli repo create $repoName --type model
        git clone $cloneUrl $DEPLOY_DIR
    } else {
        $ErrorActionPreference = $oldPreference
        Write-Error "  Failed to clone. The model repository '$HfRepoName' may not exist, or authentication failed.`n  Please ensure you have created the repository manually at https://huggingface.co/new (Select Model type).`n  If you provided a token, ensure it is a WRITE token."
        exit 1
    }
}
$ErrorActionPreference = $oldPreference

Set-Location $DEPLOY_DIR
git lfs install

# ── Step 3: Copy model card and config ───────────────────────
Write-Host "`n[3/7] Copying model card and config files..." -ForegroundColor Yellow

# Copy README.md (model card)
$readmeContent = Get-Content (Join-Path $HF_MODEL_DIR "README.md") -Raw
# Replace placeholder username with actual username
$readmeContent = $readmeContent -replace "<YOUR_USERNAME>", $username
Set-Content -Path (Join-Path $DEPLOY_DIR "README.md") -Value $readmeContent -NoNewline

# Copy Modelfile
Copy-Item (Join-Path $HF_MODEL_DIR "Modelfile") -Destination (Join-Path $DEPLOY_DIR "Modelfile") -Force

# Copy .gitattributes
Copy-Item (Join-Path $HF_MODEL_DIR ".gitattributes") -Destination (Join-Path $DEPLOY_DIR ".gitattributes") -Force

Write-Host "  Config files copied" -ForegroundColor Green

# ── Step 4: Copy GGUF model file ────────────────────────────
Write-Host "`n[4/7] Copying GGUF model ($ggufSize MB)..." -ForegroundColor Yellow
Write-Host "  This may take a moment..." -ForegroundColor Gray
Copy-Item $GGUF_FILE -Destination (Join-Path $DEPLOY_DIR "unsloth.Q4_K_M.gguf") -Force
Write-Host "  GGUF model copied" -ForegroundColor Green

# ── Step 5: Copy training data & scripts (optional) ─────────
Write-Host "`n[5/7] Copying training data..." -ForegroundColor Yellow

if ($SkipTrainingData) {
    Write-Host "  Skipping training data (--SkipTrainingData flag set)" -ForegroundColor Gray
} else {
    # Create training_data directory
    $trainDataDest = Join-Path $DEPLOY_DIR "training_data"
    if (-not (Test-Path $trainDataDest)) {
        New-Item -ItemType Directory -Path $trainDataDest | Out-Null
    }

    # Copy training data files
    $trainFiles = @(
        "cafe-training-data.jsonl",
        "cafe-training-chat.jsonl"
    )
    foreach ($file in $trainFiles) {
        $srcFile = Join-Path $FINE_TUNE_DATA $file
        if (Test-Path $srcFile) {
            $sizeMB = [math]::Round((Get-Item $srcFile).Length / 1KB, 1)
            Write-Host "  Copying $file ($sizeMB KB)..." -ForegroundColor Gray
            Copy-Item $srcFile -Destination (Join-Path $trainDataDest $file) -Force
        } else {
            Write-Host "  WARNING: $file not found, skipping" -ForegroundColor Red
        }
    }

    # Copy training script
    if (Test-Path $TRAIN_SCRIPT) {
        Copy-Item $TRAIN_SCRIPT -Destination (Join-Path $trainDataDest "train.py") -Force
        Write-Host "  Training script copied" -ForegroundColor Gray
    }

    Write-Host "  Training data copied" -ForegroundColor Green
}

# ── Step 6: Commit ──────────────────────────────────────────
Write-Host "`n[6/7] Committing changes..." -ForegroundColor Yellow
Set-Location $DEPLOY_DIR
git add -A
git status
$commitMsg = "Upload Kafi fine-tuned GGUF model (Llama 3.2-1B + QLoRA)"
git commit -m $commitMsg
Write-Host "  Committed" -ForegroundColor Green

# ── Step 7: Push to HF ──────────────────────────────────────
Write-Host "`n[7/7] Pushing to Hugging Face..." -ForegroundColor Yellow
Write-Host "  Uploading ~$ggufSize MB via Git LFS..." -ForegroundColor Gray
Write-Host "  This may take several minutes depending on your connection..." -ForegroundColor Gray
git push origin main

Write-Host "`n============================================" -ForegroundColor Green
Write-Host " Model upload complete!" -ForegroundColor Green
Write-Host " View your model at:" -ForegroundColor Green
Write-Host " https://huggingface.co/$HfRepoName" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Users can now download and use your model:" -ForegroundColor Yellow
Write-Host "  huggingface-cli download $HfRepoName unsloth.Q4_K_M.gguf --local-dir ./models" -ForegroundColor Gray
Write-Host "  ollama create kafi -f Modelfile" -ForegroundColor Gray

# Clean up token from git remote config to prevent leaving it on disk
if ($HfToken) {
    git remote set-url origin "https://huggingface.co/$HfRepoName"
}

# Return to original directory
Set-Location $PROJECT_ROOT
