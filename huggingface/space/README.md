---
title: Kafe Nusantara - AI Barista
emoji: ☕
colorFrom: yellow
colorTo: gray
sdk: docker
app_port: 3000
pinned: false
license: mit
tags:
  - cafe
  - chatbot
  - ai-barista
  - indonesian
  - nextjs
  - semantic-search
  - ollama
  - qdrant
  - rag
short_description: AI-powered cafe ordering with semantic search & RAG chatbot
---

# ☕ Kafe Nusantara — AI-Powered Cafe Ordering Platform

A modern, full-stack cafe ordering platform built with **Next.js 16** featuring an intelligent **AI Barista** chatbot (Kafi) and **semantic search** for the menu.

## ✨ Features

- 🧠 **Semantic Menu Search** — Find menu items by meaning, not just keywords (powered by vector embeddings)
- 💬 **RAG-Powered AI Chatbot** — Kafi the barista uses your actual menu data for grounded responses
- 🛒 **Full Ordering System** — Cart, checkout, and kitchen dashboard
- 🔐 **Role-Based Auth** — Customer, kitchen staff, and admin roles
- 🇮🇩 **Bahasa Indonesia** — Native Indonesian language support

## 🏗️ Architecture

| Service | Technology | Purpose |
|---------|-----------|---------|
| Web App | Next.js 16 + TypeScript | Full-stack framework |
| Database | PostgreSQL 17 | Relational data |
| Vector DB | Qdrant | Semantic similarity search |
| Embeddings | multilingual-e5-small (HF TEI) | 384-dim multilingual vectors |
| LLM | Llama 3.2-1B via Ollama | Local AI chat inference |
| Auth | Better Auth | Authentication & RBAC |

## 🚀 Run Locally

```bash
# 1. Clone the repo
git clone https://huggingface.co/spaces/<YOUR_USERNAME>/kafe-nusantara
cd kafe-nusantara

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Copy environment config
cp .env.example .env

# 4. Start infrastructure (PostgreSQL, Qdrant, Embedding, LLM)
docker compose up -d --build

# 5. Initialize database
npm run db:all

# 6. Start the app
npm run dev
```

Visit **http://localhost:3000** 🎉

## 🤖 AI Model

The fine-tuned Kafi model is available separately:
👉 [kafi-barista-llama3.2-1b-gguf](https://huggingface.co/<YOUR_USERNAME>/kafi-barista-llama3.2-1b-gguf)

## 📖 Documentation

- See the full [README](https://github.com/tristiyadi/nextjs-cafe-order-chatbot-ai) for detailed setup and architecture docs
- [Fine-Tuning Guide](./docs/fine-tuning-guide.md) — How the Kafi model was trained
- [LLM Optimization Guide](./docs/llm-optimization-guide.md) — Production LLM tuning

## License

MIT License (application code) | Llama 3.2 Community License (AI model)
