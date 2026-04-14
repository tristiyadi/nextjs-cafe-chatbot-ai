# 🧠 LLM Optimization & Fine-Tuning Guide

## Kafe Nusantara — Complete Guide for Model Customization & Production Deployment

---

## Table of Contents

1. [Loading Pre-Trained Models & Datasets](#1-loading-pre-trained-models--datasets)
2. [Fine-Tuning LLMs for Specific Tasks](#2-fine-tuning-llms-for-specific-tasks)
3. [Optimizing LLM Deployment in Production](#3-optimizing-llm-deployment-in-production)
4. [Performance Optimization](#4-performance-optimization)

---

## 1. Loading Pre-Trained Models & Datasets

### 1.1 Current Architecture

The project uses **two** pre-trained models:

| Model | Purpose | Format | Host |
|---|---|---|---|
| **intfloat/multilingual-e5-small** | Embedding (384-dim vectors) | HuggingFace Transformers | HF TEI Docker |
| **llama3.2:1b** (or kafi/mistral/qwen) | Chat inference | GGUF (quantized) | Ollama Docker |

### 1.2 How Pre-Trained Models are Loaded

**Embedding Model (TEI):**
```bash
# In docker-compose.yml, the TEI container auto-downloads on first start:
command: --model-id intfloat/multilingual-e5-small --port 80
# Model is cached in the tei_cache volume
```

**LLM Models (Ollama):**
```dockerfile
# In llm/Dockerfile, models are pre-pulled during build:
RUN ollama pull llama3.2:1b
RUN ollama create kafi -f /tmp/Modelfile
```

### 1.3 Switching to Different Pre-Trained Models

**Embedding — Swap to a different model:**
```bash
# .env — just change the model ID
EMBEDDING_MODEL_ID=intfloat/multilingual-e5-base    # 768-dim (better accuracy)
EMBEDDING_MODEL_ID=BAAI/bge-m3                       # 1024-dim (best accuracy)
EMBEDDING_MODEL_ID=intfloat/multilingual-e5-large    # 1024-dim (best multilingual)
```
> The codebase auto-detects vector dimensions in `src/lib/qdrant.ts`.

**LLM — Swap to a different model:**
```bash
# .env
LLM_TYPE=ollama
LOCAL_LLM_MODEL=llama3.2:3b      # Larger, more accurate
LOCAL_LLM_MODEL=gemma2:2b        # Google's model
LOCAL_LLM_MODEL=phi3:mini        # Microsoft's model
```

### 1.4 Training/Fine-Tuning Dataset Generation

The project generates fine-tuning datasets from real cafe data. See `scripts/generate-training-data.ts` for the implementation that:

1. Exports all menu items from PostgreSQL
2. Generates Q&A pairs in Indonesian
3. Creates conversation-style training data
4. Outputs in JSONL format compatible with fine-tuning tools

---

## 2. Fine-Tuning LLMs for Specific Tasks

### 2.1 Why Fine-Tune?

| Approach | Pros | Cons |
|---|---|---|
| **System Prompt Only** (current) | Quick, no training needed | Limited persona depth, uses tokens |
| **Modelfile (current)** | Baked-in persona, no token waste | Still base model knowledge |
| **Fine-Tuning** | Deep domain knowledge, better Indonesian, smaller prompts | Requires GPU, training time |

### 2.2 Fine-Tuning Pipeline

```
[1] Generate Dataset  →  [2] Fine-Tune with Unsloth  →  [3] Export to GGUF  →  [4] Import to Ollama
    (cafe Q&A pairs)       (LoRA on Llama 3.2)             (quantized)           (custom model)
```

### 2.3 Step-by-Step Fine-Tuning

**Step 1: Generate training data** (`npm run generate:training-data`)

**Step 2: Fine-tune with Unsloth in Docker** (see `scripts/fine-tune/README.md`)
- Uses `docker-compose.finetune.yml` for fully isolated GPU training.
- Automatically handles QLoRA (4-bit quantized LoRA) for memory efficiency.
- Trains on cafe-specific Q&A pairs.
- Skrip `train.py` otomatis menggabungkan LoRA dan mengekspor model ke format GGUF.

**Step 3: Export & Import**
```bash
# Run the Dockerized training process
docker compose -f docker-compose.finetune.yml up --build

# Import the newly generated model into Ollama
ollama create kafi-ft -f scripts/fine-tune/output/Modelfile.finetuned
```

---

## 3. Optimizing LLM Deployment in Production

### 3.1 Docker Production Optimizations

See `docker-compose.prod.yml` for production-ready configuration with:
- GPU passthrough (NVIDIA CUDA)
- Memory limits and reservations
- Connection pooling for PostgreSQL
- Optimized TEI settings (max batch, tokenization)
- Health checks with proper intervals
- Resource constraints

### 3.2 Response Caching

See `src/lib/ai-cache.ts` for the LRU cache implementation that:
- Caches LLM responses by content hash
- Configurable TTL (default: 5 minutes)
- Configurable max entries (default: 100)
- Cache key includes: model name + message + search context
- Dramatically reduces duplicate inference calls

### 3.3 Embedding Caching

See `src/lib/embedding.ts` for batch processing + caching:
- LRU cache for embedding vectors (default: 500 entries, 10 min TTL)
- Batch processing with configurable batch size
- Retry logic with exponential backoff
- Connection health checks

---

## 4. Performance Optimization

### 4.1 Quantization Levels

| Quantization | Size | Speed | Quality | Recommended For |
|---|---|---|---|---|
| `Q4_0` | Smallest | Fastest | Lowest | Testing/dev |
| `Q4_K_M` | Small | Fast | Good | **Production (default)** |
| `Q5_K_M` | Medium | Medium | Better | Production (more RAM) |
| `Q8_0` | Large | Slow | Best | Quality-critical |
| `F16` | Largest | Slowest | Original | Research/comparison |

### 4.2 Hardware Acceleration

**GPU (NVIDIA CUDA):**
```yaml
# docker-compose.prod.yml
services:
  llm:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
  embedding:
    image: ghcr.io/huggingface/text-embeddings-inference:1.7  # GPU version (not cpu)
```

**CPU Optimization:**
```yaml
# For CPU-only deployments, set thread count
environment:
  - OLLAMA_NUM_THREADS=4        # Match CPU cores
  - OMP_NUM_THREADS=4
```

### 4.3 Batch Size Optimization

See `src/lib/embedding.ts` for the batch embedding implementation:
- `EMBEDDING_BATCH_SIZE` env var (default: 32)
- Automatically chunks large arrays
- Parallel batch processing for seed operations

### 4.4 Model Warmup

See `src/lib/model-warmup.ts` for the warmup implementation:
- Pre-loads models into memory on server start
- Validates model availability
- Measures and logs inference latency
- Detects GPU availability

---

## Quick Reference: Environment Variables

```bash
# === Model Selection ===
LLM_TYPE=kafi                    # ollama | kafi | mistral | qwen | openai
LOCAL_LLM_MODEL=llama3.2:1b     # Base Ollama model
EMBEDDING_MODEL_ID=intfloat/multilingual-e5-small

# === Performance Tuning ===
EMBEDDING_BATCH_SIZE=32          # Batch size for embedding generation
OLLAMA_NUM_THREADS=4             # CPU threads for Ollama
LLM_NUM_CTX=4096                 # Context window size
LLM_CACHE_TTL=300000             # Response cache TTL (ms)
LLM_CACHE_MAX=100                # Max cached responses

# === Production ===
NODE_ENV=production
OLLAMA_KEEP_ALIVE=5m             # Keep model loaded in memory
```
