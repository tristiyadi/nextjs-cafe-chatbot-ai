<#
.SYNOPSIS
    Deploy Kafe Nusantara app to Hugging Face Spaces.

.DESCRIPTION
    This script copies the Next.js application and necessary files
    to a Hugging Face Space repository and pushes via Git.

.PARAMETER HfSpaceName
    Your Hugging Face Space in format "username/space-name"
    Example: "tristiyadi/kafe-nusantara"

.PARAMETER HfModelRepo
    Your Hugging Face model repo name (for linking in docs).
    Example: "tristiyadi/kafi-barista-llama3.2-1b-gguf"

.EXAMPLE
    .\deploy_space_to_hf.ps1 -HfSpaceName "tristiyadi/kafe-nusantara" -HfModelRepo "tristiyadi/kafi-barista-llama3.2-1b-gguf"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$HfSpaceName,

    [Parameter(Mandatory=$false)]
    [string]$HfModelRepo,

    [Parameter(Mandatory=$false)]
    [string]$HfToken
)

if (-not $HfToken -and $env:HF_TOKEN) {
    $HfToken = $env:HF_TOKEN
}

$ErrorActionPreference = "Stop"

# ── Paths ──────────────────────────────────────────────────────
$PROJECT_ROOT = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$HF_SPACE_DIR = $PSScriptRoot
$DEPLOY_DIR = Join-Path $PROJECT_ROOT "hf-space-deploy"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " Deploying App to Hugging Face Spaces" -ForegroundColor Cyan
Write-Host " Space: $HfSpaceName" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# ── Step 1: Check prerequisites ──────────────────────────────
Write-Host "`n[1/8] Checking prerequisites..." -ForegroundColor Yellow

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git is not installed."
    exit 1
}

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
            Write-Host "  Not logged in via CLI. Run 'huggingface-cli login' or supply -HfToken." -ForegroundColor Yellow
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

# ── Step 2: Clone or create the HF Space repo ───────────────
Write-Host "`n[2/8] Setting up HF Space repo..." -ForegroundColor Yellow

if (Test-Path $DEPLOY_DIR) {
    Remove-Item -Recurse -Force $DEPLOY_DIR
}

$repoParts = $HfSpaceName.Split("/")
$username = $repoParts[0]
$spaceName = $repoParts[1]

# Build remote URLs
$cloneUrl = "https://huggingface.co/spaces/$HfSpaceName"
if ($HfToken) {
    $cloneUrl = "https://oauth2:$HfToken@huggingface.co/spaces/$HfSpaceName"
}

Write-Host "  Cloning repository..." -ForegroundColor Yellow
$oldPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"

git clone $cloneUrl $DEPLOY_DIR
if ($LASTEXITCODE -ne 0) {
    if ($hasCli) {
        Write-Host "  Space doesn't exist. Creating with Docker SDK..." -ForegroundColor Yellow
        huggingface-cli repo create $spaceName --type space --space_sdk docker
        git clone $cloneUrl $DEPLOY_DIR
    } else {
        $ErrorActionPreference = $oldPreference
        Write-Error "  Failed to clone. The Space '$HfSpaceName' may not exist, or authentication failed.`n  Please ensure you have created the Space manually at https://huggingface.co/new-space with the Docker SDK.`n  If you provided a token, ensure it is a WRITE token."
        exit 1
    }
}
$ErrorActionPreference = $oldPreference

Set-Location $DEPLOY_DIR
git lfs install

# ── Step 3: Copy Space-specific files ────────────────────────
Write-Host "`n[3/8] Copying Space config files..." -ForegroundColor Yellow

# Copy README (with username replacement)
$readmeContent = Get-Content (Join-Path $HF_SPACE_DIR "README.md") -Raw
$readmeContent = $readmeContent -replace "<YOUR_USERNAME>", $username
Set-Content -Path (Join-Path $DEPLOY_DIR "README.md") -Value $readmeContent -NoNewline

# Copy Dockerfile
Copy-Item (Join-Path $HF_SPACE_DIR "Dockerfile") -Destination (Join-Path $DEPLOY_DIR "Dockerfile") -Force

Write-Host "  Space config copied" -ForegroundColor Green

# ── Step 4: Copy source code ────────────────────────────────
Write-Host "`n[4/8] Copying source code..." -ForegroundColor Yellow

# Copy package files
Copy-Item (Join-Path $PROJECT_ROOT "package.json") -Destination (Join-Path $DEPLOY_DIR "package.json") -Force
Copy-Item (Join-Path $PROJECT_ROOT "package-lock.json") -Destination (Join-Path $DEPLOY_DIR "package-lock.json") -Force
Copy-Item (Join-Path $PROJECT_ROOT "tsconfig.json") -Destination (Join-Path $DEPLOY_DIR "tsconfig.json") -Force
Copy-Item (Join-Path $PROJECT_ROOT "next.config.ts") -Destination (Join-Path $DEPLOY_DIR "next.config.ts") -Force
Copy-Item (Join-Path $PROJECT_ROOT "postcss.config.mjs") -Destination (Join-Path $DEPLOY_DIR "postcss.config.mjs") -Force
Copy-Item (Join-Path $PROJECT_ROOT "drizzle.config.ts") -Destination (Join-Path $DEPLOY_DIR "drizzle.config.ts") -Force
Copy-Item (Join-Path $PROJECT_ROOT "eslint.config.mjs") -Destination (Join-Path $DEPLOY_DIR "eslint.config.mjs") -Force

if (Test-Path (Join-Path $PROJECT_ROOT "components.json")) {
    Copy-Item (Join-Path $PROJECT_ROOT "components.json") -Destination (Join-Path $DEPLOY_DIR "components.json") -Force
}

Write-Host "  Config files copied" -ForegroundColor Green

# ── Step 5: Copy src directory ──────────────────────────────
Write-Host "`n[5/8] Copying src directory..." -ForegroundColor Yellow

$srcDest = Join-Path $DEPLOY_DIR "src"
if (Test-Path $srcDest) { Remove-Item -Recurse -Force $srcDest }
Copy-Item (Join-Path $PROJECT_ROOT "src") -Destination $srcDest -Recurse

# Remove __pycache__ directories
Get-ChildItem -Path $srcDest -Recurse -Directory -Filter "__pycache__" -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force

Write-Host "  Source code copied" -ForegroundColor Green

# ── Step 6: Copy public assets ──────────────────────────────
Write-Host "`n[6/8] Copying public assets..." -ForegroundColor Yellow

$publicSrc = Join-Path $PROJECT_ROOT "public"
$publicDest = Join-Path $DEPLOY_DIR "public"
if (Test-Path $publicSrc) {
    if (Test-Path $publicDest) { Remove-Item -Recurse -Force $publicDest }
    Copy-Item $publicSrc -Destination $publicDest -Recurse
    Write-Host "  Public assets copied" -ForegroundColor Green
} else {
    Write-Host "  No public directory found, skipping" -ForegroundColor Gray
}

# Copy .env.example
if (Test-Path (Join-Path $PROJECT_ROOT ".env.example")) {
    Copy-Item (Join-Path $PROJECT_ROOT ".env.example") -Destination (Join-Path $DEPLOY_DIR ".env.example") -Force
}

# ── Step 7: Commit ──────────────────────────────────────────
Write-Host "`n[7/8] Committing changes..." -ForegroundColor Yellow
Set-Location $DEPLOY_DIR

# Create .gitignore for the space
@"
node_modules/
.next/
.env
*.log
__pycache__/
"@ | Set-Content -Path (Join-Path $DEPLOY_DIR ".gitignore")

git add -A
git status
git commit -m "Deploy Kafe Nusantara AI-Powered Cafe to HF Spaces"
Write-Host "  Committed" -ForegroundColor Green

# ── Step 8: Push to HF ──────────────────────────────────────
Write-Host "`n[8/8] Pushing to Hugging Face..." -ForegroundColor Yellow
git push origin main

Write-Host "`n============================================" -ForegroundColor Green
Write-Host " Space deployment complete!" -ForegroundColor Green
Write-Host " View your Space at:" -ForegroundColor Green
Write-Host " https://huggingface.co/spaces/$HfSpaceName" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Green

if ($HfModelRepo) {
    Write-Host "`nLinked model repo:" -ForegroundColor Yellow
    Write-Host "  https://huggingface.co/$HfModelRepo" -ForegroundColor Cyan
}

# Clean up token from git remote config to prevent leaving it on disk
if ($HfToken) {
    git remote set-url origin "https://huggingface.co/spaces/$HfSpaceName"
}

# Return to original directory
Set-Location $PROJECT_ROOT
