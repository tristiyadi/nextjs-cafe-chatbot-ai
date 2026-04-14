# 🧠 Step-by-Step Fine-Tuning Guide (Kafe Nusantara)

Fine-tuning allows **Kafi** (the AI Barista) to learn your specific menu items, the Indonesian cafe culture, and the exact ordering format (tags like `[ORDER:...]`) directly into its "brain" instead of just relying on a system prompt.

---

## Phase 1: Data Preparation 🛠️

Fine-tuning requires a "Dataset" (a list of thousands of conversation examples). We automate this using your live menu database.

1.  **Command**: `npm run generate:training-data`
2.  **What it does**: 
    - Queries all categories and menu items from PostgreSQL.
    - Uses templates to generate **1,000+ synthetic conversations** (e.g., "What coffee is sweet?" -> "Try Kopi Gula Aren (Rp18.000) [ORDER:...]").
    - Saves the output to `scripts/fine-tune/data/cafe-training-data.jsonl`.
    - **Format**: It uses the **ShareGPT** or **Instruction** format, compatible with Unsloth.

---

## Phase 2: The Training (Unsloth + QLoRA) 🚀

We use **Unsloth**, the fastest engine for fine-tuning small models, and **QLoRA** (4-bit quantization) to allow training on a consumer GPU.

1.  **Command**: `docker compose -f docker-compose.finetune.yml up --build` (which automatically runs `scripts/fine-tune/train.py` in an isolated GPU container)
2.  **Steps**:
    - **Load Base Model**: It downloads `llama-3.2-1b-instruct` or `qwen2.5-1.5b`.
    - **Add LoRA Adapters**: It adds small "trainable layers" to the model. We only train these small layers (~1-5% of the model), which is much faster.
    - **Tokenization**: It converts the text dataset into numbers (tokens).
    - **Training Loop**: The model reads the data, makes a guess, checks the "correct" answer from the dataset, and adjusts its internal weights.

---

## Phase 3: Export to GGUF 📦

Once training is done, the script AUTOMATICALLY converts the "LoRA Weights" back into a format that **Ollama** can understand.

1.  **Merging & Quantization**: The script automatically merges the new "learned" layers and compresses the model to 4-bit (GGUF format).
2.  **Output**: The model is saved to `scripts/fine-tune/output/kafi-finetuned/unsloth.Q4_K_M.gguf`.
3.  **Modelfile**: A ready-to-use Modelfile is automatically generated at `scripts/fine-tune/output/Modelfile.finetuned`.

---

## Phase 4: Deployment to Ollama ☕

Now that your custom "brain" file is ready, you can deploy it to local Ollama.

1.  **Import to Ollama**:
    ```bash
    ollama create kafi-ft -f scripts/fine-tune/output/Modelfile.finetuned
    ```
2.  **Switch in Application**:
    Update your `.env` file to instruct the application to use the newly fine-tuned model:

    ```env
    LOCAL_LLM_MODEL=kafi-ft
    ```
---

## ⚠️ Requirements for Training
- **Hardware**: A GPU with at least **8GB VRAM** (NVIDIA RTX 3060 or better).
- **Environment**: We use Docker Compose for full isolation! On Windows, ensure Docker Desktop uses the **WSL2** backend.
- **Time**: For 1,000 examples on a 1B model, it usually takes ~15-30 minutes.

---

### Tips for Better Results:
- **More Data**: If Kafi still hallucinates, increase the `NUM_SAMPLES` in `scripts/generate-training-data.ts`.
- **Diversity**: Add more variety to the synthetic templates (slang, typos, etc.).
