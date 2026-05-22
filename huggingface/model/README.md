---
language:
  - id
license: llama3.2
library_name: transformers
tags:
  - llama
  - llama-3.2
  - gguf
  - q4_k_m
  - unsloth
  - qlora
  - fine-tuned
  - cafe
  - chatbot
  - barista
  - indonesian
  - bahasa-indonesia
model_name: kafi-barista-llama3.2-1b-gguf
base_model: meta-llama/Llama-3.2-1B-Instruct
pipeline_tag: text-generation
datasets:
  - custom
---

# ☕ Kafi — AI Barista (Llama 3.2-1B Fine-Tuned GGUF)

**Kafi** is a fine-tuned version of [Meta Llama 3.2-1B-Instruct](https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct) designed to be an AI barista for **Kafe Nusantara**, a modern Indonesian cafe. The model understands natural language in Bahasa Indonesia and can recommend menu items, explain dishes, and process orders.

## Model Details

| Property | Value |
|----------|-------|
| **Base Model** | `meta-llama/Llama-3.2-1B-Instruct` |
| **Fine-Tuning Method** | QLoRA (4-bit) via [Unsloth](https://github.com/unslothai/unsloth) |
| **LoRA Rank** | 32 |
| **LoRA Alpha** | 32 |
| **Quantization** | Q4_K_M (GGUF) |
| **Max Context** | 2048 tokens |
| **Language** | Indonesian (Bahasa Indonesia) |
| **File Size** | ~808 MB |
| **Training Epochs** | 5 |
| **Training Dataset** | 1,000+ synthetic cafe conversations |

## Intended Use

This model is designed to:
- ☕ **Recommend menu items** based on customer preferences (e.g., "minuman dingin yang manis")
- 📋 **Explain menu details** (ingredients, price in Rupiah format)
- 🛒 **Process orders** using `[ORDER:item_name]` tags
- 💬 **Chat naturally** in Bahasa Indonesia with a friendly barista persona

### Limitations
- Only knows menu items from the Kafe Nusantara dataset — will not hallucinate items outside the menu if given proper context
- Designed for cafe-specific conversations only
- Best used with RAG (Retrieval-Augmented Generation) to inject current menu data

## How to Use

### With Ollama (Recommended)

1. **Download the GGUF file** from this repository:
   ```bash
   # Using huggingface-cli
   huggingface-cli download <YOUR_USERNAME>/kafi-barista-llama3.2-1b-gguf unsloth.Q4_K_M.gguf --local-dir ./models

   # Or using wget
   wget https://huggingface.co/<YOUR_USERNAME>/kafi-barista-llama3.2-1b-gguf/resolve/main/unsloth.Q4_K_M.gguf
   ```

2. **Create a Modelfile** (included in this repo):
   ```
   FROM ./unsloth.Q4_K_M.gguf

   PARAMETER temperature 0.1
   PARAMETER top_p 0.85
   PARAMETER top_k 30
   PARAMETER num_ctx 3072
   PARAMETER stop "<|eot_id|>"

   SYSTEM """
   Anda adalah Kafi, barista virtual di Kafe Nusantara.
   Jawab HANYA berdasarkan DAFTAR MENU yang diberikan.
   DILARANG mengarang menu yang tidak ada di daftar.
   Gunakan Bahasa Indonesia santai dan ramah.
   Sertakan [ORDER:Nama Menu] jika pelanggan memesan.
   """
   ```

3. **Import to Ollama:**
   ```bash
   ollama create kafi -f Modelfile
   ollama run kafi
   ```

### With llama.cpp

```bash
./main -m unsloth.Q4_K_M.gguf \
  --temp 0.1 \
  --top-p 0.85 \
  --ctx-size 3072 \
  -p "Hai Kafi, rekomendasikan kopi yang enak dong!"
```

## Training Data

The model was fine-tuned on **1,000+ synthetic conversations** generated from a real cafe menu database. The dataset follows the **Alpaca instruction format**:

```json
{
  "instruction": "Anda adalah Kafi, barista virtual Kafe Nusantara. Jawab pertanyaan pelanggan berdasarkan menu yang tersedia.",
  "input": "Ada rekomendasi kopi yang manis?",
  "output": "Tentu Kak! ☕ Untuk kopi manis, saya rekomendasikan:\n- ⭐ Kopi Gula Aren (Rp18.000): Kopi susu klasik dengan gula aren alami\n- Caffe Mocha (Rp28.000): Perpaduan espresso dan cokelat yang creamy"
}
```

Training data files:
- `cafe-training-data.jsonl` — Alpaca-format training examples
- `cafe-training-chat.jsonl` — ShareGPT-format chat examples

## Training Procedure

```
Framework:    Unsloth + QLoRA (4-bit quantization)
Base:         unsloth/Llama-3.2-1B-Instruct (pre-quantized)
LoRA Config:  rank=32, alpha=32, dropout=0.0
Targets:      q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj
Optimizer:    AdamW 8-bit
LR:           1e-4 (cosine scheduler)
Batch Size:   16 (4 × 4 gradient accumulation)
Epochs:       5
Precision:    bf16 / fp16 (auto-detected)
```

## Project Context

This model is part of the [Kafe Nusantara](https://github.com/tristiyadi/nextjs-cafe-order-chatbot-ai) project — a full-stack AI-powered cafe ordering platform featuring:
- 🧠 **Semantic search** (vector embeddings via Qdrant + multilingual-e5-small)
- 💬 **RAG-powered chatbot** (menu context injected into each conversation)
- 🍽️ **Full ordering system** with kitchen dashboard
- 🔐 **Role-based auth** (customer, kitchen staff, admin)

## License

This model is derived from Meta Llama 3.2-1B-Instruct and is subject to the [Llama 3.2 Community License Agreement](https://ai.meta.com/llama/license/).

## Citation

```bibtex
@misc{kafi-barista-2025,
  title={Kafi: AI Barista for Kafe Nusantara},
  author={Tristiyadi},
  year={2025},
  note={Fine-tuned Llama 3.2-1B-Instruct with QLoRA via Unsloth}
}
```
