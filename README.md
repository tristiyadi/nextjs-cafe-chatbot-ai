# ☕ Kafe Nusantara: AI-Powered Cafe Ordering Platform

Kafe Nusantara is a modern, full-stack cafe ordering platform built with **Next.js 16** that combines a beautiful UI with an intelligent **AI Barista** chatbot. It features **semantic search** for the menu (not keyword matching) and a context-aware chatbot that understands natural language in Bahasa Indonesia.

> **Core Innovation:** When a customer types "minuman dingin yang manis" (cold sweet drink), the system understands the *meaning* and returns relevant items like "Kopi Gula Aren" and "Es Teh Manis" — even though those exact words don't appear in the query.

---

## 📑 Table of Contents

- [How It Works](#-how-it-works)
  - [Semantic Search in Menu](#1-semantic-search-in-menu)
  - [Chat with Contextual Menu Awareness](#2-chat-with-contextual-menu-awareness)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Setup Guide](#-step-by-step-setup-guide)
- [Application Access Points](#-application-access-points)
- [Vector Analysis & Monitoring](#-vector-analysis--monitoring)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Documentation](#-documentation)

---

## 🧠 How It Works

### 1. Semantic Search in Menu

The menu search bar uses **vector embeddings** instead of traditional keyword search. Here's the complete flow:

#### What is Semantic Search?

| Query | Keyword Search | Semantic Search |
|---|---|---|
| "yang segar" (refreshing) | ❌ No results | ✅ Es Teh Manis, Iced Latte |
| "minuman manis dingin" | ❌ No results | ✅ Kopi Gula Aren, Es Teh Manis |
| "snack renyah" (crunchy snack) | ❌ No results | ✅ Kentang Goreng Krispi |

Semantic search works by converting text into **384-dimensional numerical vectors** that represent meaning. Similar meanings produce similar vectors, enabling "fuzzy" conceptual matching.

#### Embedding Generation (Seed Time)

When menu items are seeded into the database, each item generates an embedding:

```
1. Construct embedding text:
   "passage: Kopi Gula Aren. Kopi susu klasik dengan pemanis gula aren alami yang segar. Kategori: kopi. Harga: Rp18000"

2. Send to Embedding Service (Multilingual-E5-Small via HF TEI):
   POST http://localhost:8001/v1/embeddings
   → Returns: [0.12, -0.45, 0.78, ...] (384 floats)

3. Store vector in TWO places:
   a) Qdrant vector DB (for fast similarity search)
   b) PostgreSQL embedding_vector column (for analysis/debugging)
```

> **Note:** The `passage:` prefix is required by the E5 model family. It tells the model this is a document to be indexed (vs. a query to search with).

#### Search Flow (Runtime)

When a user searches the menu:

```
User types: "kopi yang segar"
    │
    ▼
[1] API prepends "query: " prefix
    → "query: kopi yang segar"
    │
    ▼
[2] Embedding Service generates vector
    POST /v1/embeddings → [0.10, -0.42, 0.75, ...] (384d)
    │
    ▼
[3] Qdrant similarity search (cosine distance, top_k=5)
    → Returns ranked results with scores (0.0-1.0)
    → e.g., {id: "uuid-1", score: 0.92, payload: {name: "Kopi Gula Aren"}}
    │
    ▼
[4] Fetch full menu data from PostgreSQL by matched IDs
    → Preserves Qdrant ranking order
    │
    ▼
[5] Return complete menu item data to frontend
    (name, description, price, image, category, customizations)
```

**Key files:**
- [`src/app/api/search/route.ts`](./src/app/api/search/route.ts) — Search API endpoint (GET & POST)
- [`src/lib/embedding.ts`](./src/lib/embedding.ts) — Embedding generation client
- [`src/lib/qdrant.ts`](./src/lib/qdrant.ts) — Qdrant client (collection management, upsert, search)

---

### 2. Chat with Contextual Menu Awareness

The AI chatbot ("Kafi") combines **semantic search context** + **popular menu context** + **chat history** to generate relevant responses.

#### Complete Chat Flow

```
User: "Ada rekomendasi minuman dingin yang manis?"
    │
    ▼
[1] SESSION MANAGEMENT
    ├── If sessionId provided → validate in DB
    └── If no session → CREATE new chat_session
    │
    ▼
[2] SAVE USER MESSAGE
    INSERT INTO chat_message (session_id, role='user', content)
    │
    ▼
[3] LOAD CHAT HISTORY
    SELECT last 10 messages WHERE session_id = current
    (provides conversation continuity)
    │
    ▼
[4] SEMANTIC SEARCH FOR MENU CONTEXT
    ├── Embed user message: "query: Ada rekomendasi minuman dingin yang manis?"
    ├── Search Qdrant: top 5 similar menu items
    └── Format context:
        "Menu yang mungkin relevan:
         - Kopi Gula Aren: (Harga: Rp18000)
         - Es Teh Manis: (Harga: Rp8000)
         - Caffe Latte: (Harga: Rp25000)"
    │
    ▼
[5] FETCH POPULAR ITEMS
    SELECT * FROM menu_item WHERE is_popular = true LIMIT 5
    Format: "MENU POPULER KAMI: ..."
    │
    ▼
[6] BUILD LLM PROMPT
    ┌──────────────────────────────────────────┐
    │ SYSTEM: "Anda adalah Kafi, barista..."   │
    │ + Popular menu list                       │
    │ + Semantic search results                 │
    │ + Rules (Indonesian, format prices, etc.) │
    ├──────────────────────────────────────────┤
    │ HISTORY: last 10 messages                 │
    ├──────────────────────────────────────────┤
    │ USER: current message                     │
    └──────────────────────────────────────────┘
    │
    ▼
[7] LLM INFERENCE (Ollama / OpenAI)
    POST /v1/chat/completions
    model: "llama3.2:1b" | temperature: 0.6 | max_tokens: 500
    │
    ▼
[8] SAVE & RETURN
    INSERT assistant message → chat_message table
    Return: { text: "AI response", sessionId: "..." }
```

#### Why This Approach?

The chatbot doesn't just generate responses from its training data. It:
1. **Searches the actual menu database** for relevant items matching the user's intent
2. **Includes popular items** so it can recommend best-sellers
3. **Remembers conversation context** via chat history (last 10 messages)
4. **Follows strict rules** — only recommends items that exist, always includes prices

This means the AI response is **grounded in real data**, reducing hallucination.

**Key files:**
- [`src/app/api/chat/route.ts`](./src/app/api/chat/route.ts) — Chat API with semantic search integration
- [`src/lib/ai.ts`](./src/lib/ai.ts) — LLM client, prompt construction, popular items context
- [`src/lib/embedding.ts`](./src/lib/embedding.ts) — Embedding generation
- [`src/lib/qdrant.ts`](./src/lib/qdrant.ts) — Vector similarity search

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                          │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐ │
│  │  Chat UI  │  │  Menu UI  │  │  Kitchen  │  │  Admin   │ │
│  │ (AI Chat) │  │ (Search)  │  │ Dashboard │  │  Panel   │ │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └────┬─────┘ │
└────────┼──────────────┼──────────────┼──────────────┼────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌──────────────────────────────────────────────────────────────┐
│             NEXT.JS 16 API ROUTE HANDLERS                     │
│  /api/chat     /api/search    /api/orders    /api/menu       │
│  /api/auth/**  /api/chat/history              /api/menu/[id] │
└────┬──────────────┬──────────────┬──────────────┬────────────┘
     │              │              │              │
     ▼              ▼              ▼              ▼
┌──────────┐  ┌───────────┐  ┌────────────────┐  ┌──────────┐
│PostgreSQL│  │  Qdrant   │  │  HF TEI        │  │  Ollama  │
│   17     │  │ Vector DB │  │  Embedding     │  │  LLM     │
│(Drizzle) │  │ (port     │  │  Service       │  │ Llama    │
│          │  │  6333)    │  │  (port 8001)   │  │  3.2:1b  │
└──────────┘  └───────────┘  └────────────────┘  └──────────┘
     │              │              │
     │         Cosine         Multilingual
     │        Similarity      E5-Small
     │         Search         384-dim vectors
     │              │              │
     └──────────────┴──────────────┘
            Docker Compose
```

### Service Communication

| From | To | Protocol | Purpose |
|---|---|---|---|
| Next.js API | TEI (port 8001) | HTTP POST `/v1/embeddings` | Generate 384-dim vectors from text |
| Next.js API | Qdrant (port 6333) | HTTP (Qdrant REST) | Vector upsert & similarity search |
| Next.js API | Ollama (port 11434) | HTTP POST `/v1/chat/completions` | LLM inference (OpenAI-compatible) |
| Next.js API | PostgreSQL (port 5432) | TCP (pg driver) | CRUD operations via Drizzle ORM |

---

## 🚀 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Full-stack web framework |
| **Language** | TypeScript | Type-safe development |
| **Styling** | Tailwind CSS v4 + Shadcn/UI | UI components & styling |
| **State** | Zustand | Client state management |
| **ORM** | Drizzle ORM | Type-safe PostgreSQL queries |
| **Database** | PostgreSQL 17 | Relational data storage |
| **Vector DB** | Qdrant | Semantic similarity search |
| **Embedding** | intfloat/multilingual-e5-small | 384-dim multilingual vectors |
| **Embedding Host** | HF Text Embeddings Inference | High-perf embedding server |
| **LLM** | Llama 3.2:1b via Ollama | Local AI chat inference |
| **Auth** | Better Auth | Authentication & RBAC |
| **Containers** | Docker Compose | Service orchestration |

---

## 🛠️ Step-by-Step Setup Guide

### 1. Prerequisites

- **Node.js 20+** (v20.x or v22.x recommended)
- **Docker Desktop** (required for PostgreSQL, Qdrant, Embedding, and LLM services)
- **Git**

### 2. Clone and Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 3. Environment Configuration

Create a `.env` file in the project root:

```bash
# Database (PostgreSQL 17)
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=cafe_db
DATABASE_URL=postgres://postgres:password@127.0.0.1:5432/cafe_db

# Qdrant (Vector DB)
QDRANT_URL=http://localhost:6333

# AI Services
LLM_TYPE=ollama                    # Options: ollama, openai, mistral, qwen
EMBEDDING_TYPE=multilingual-e5     # Options: bge-m3, multilingual-e5
EMBEDDING_MODEL_ID=intfloat/multilingual-e5-small

# Local AI
LOCAL_LLM_URL=http://localhost:11434/v1
LOCAL_LLM_MODEL=llama3.2:1b
EMBEDDING_SERVICE_URL=http://localhost:8001

# OpenAI (Optional — only if LLM_TYPE=openai)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# Better Auth
BETTER_AUTH_SECRET=your-random-secret-key-12345
BETTER_AUTH_URL=http://localhost:3000
```

### 4. Start Infrastructure (Docker)

```bash
# Build and start all services (PostgreSQL, Qdrant, Embedding, LLM)
docker compose up -d --build

# Rebuild the LLM container
docker compose up -d --build llm
# Then set in .env:
LLM_TYPE=kafi
docker compose exec llm ollama create kafi -f /tmp/Modelfile

```

```bash
# Rebuild the LLM container
docker compose up -d --build llm

# Then set in .env:
LLM_TYPE=qwen
docker compose exec llm ollama create kafi-qwen -f /tmp/Modelfile.qwen
```

or manually:
```bash
docker compose build llm
docker compose up -d llm
```

Verify LLM models are available:
```bash
curl http://localhost:11434/api/tags
docker compose exec llm ollama list


```

### 5. Initialize Database

```bash
# Generate migration files from Drizzle schema
npm run db:generate

# Apply migrations to PostgreSQL
npm run db:migrate

# Seed menu data + generate AI embeddings + upsert to Qdrant
npm run seed
```

> **What the seed does:** Inserts categories, menu items, and users. For each menu item, it generates a 384-dim embedding vector via the TEI service and stores it in both PostgreSQL and Qdrant.

### 6. Launch Application

```bash
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** 🎉

---

## 🧭 Application Access Points

| Portal | URL | Description |
|---|---|---|
| **Customer Portal** | `/` | Landing page (responsive, iPad-optimized) |
| **Ordering** | `/order` | Split-view: AI Barista chat + Menu browsing with semantic search |
| **Cart** | `/order/cart` | Order summary, customizations, checkout |
| **Kitchen** | `/kitchen` | Real-time Kanban order board (dark mode) |
| **Admin** | `/admin/menu` | Menu CRUD with auto-embedding generation |

### Default Login Credentials

| Email | Password | Role |
|---|---|---|
| `admin@kafe.id` | `adminpassword123` | Admin |
| `kitchen@kafe.id` | `kitchenpassword123` | Kitchen |

---

## 🔍 Vector Analysis & Monitoring

### 1. Drizzle Studio (PostgreSQL)

View stored embedding vectors in the `menu_item` table:
```bash
npm run db:studio
```
Open the `menu_item` table → inspect the `embedding_vector` column.

### 2. Qdrant Dashboard

Visualize vector space and test similarity searches:
1. Open **[http://localhost:6333/dashboard](http://localhost:6333/dashboard)**
2. Select `menu_items` collection
3. Browse stored points or run vector searches

### 3. Qdrant API Examples

```
# List all collections
GET http://localhost:6333/collections

# Get collection info
GET http://localhost:6333/collections/menu_items

# Filter by category
POST http://localhost:6333/collections/menu_items/points/scroll
{
  "limit": 10,
  "filter": {
    "must": [{ "key": "category", "match": { "any": ["kopi", "teh"] } }]
  }
}

# Similarity search (requires a vector)
POST http://localhost:6333/collections/menu_items/points/search
{
  "vector": [0.12, -0.45, ...],
  "limit": 5,
  "filter": {
    "must": [{ "key": "is_available", "match": { "value": true } }]
  }
}
```

---

## 📁 Project Structure

```
cafe-chatbot/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth pages (login, register)
│   │   ├── (customer)/               # Customer pages (landing, order, cart)
│   │   ├── (kitchen)/                # Kitchen dashboard
│   │   ├── (admin)/                  # Admin panel (menu CRUD)
│   │   └── api/                      # API Route Handlers
│   │       ├── auth/[...all]/        # Better Auth catch-all
│   │       ├── chat/                 # Chat API (semantic search + LLM)
│   │       │   ├── route.ts          # POST: send message
│   │       │   └── history/          # GET: list/load sessions
│   │       ├── menu/                 # Menu CRUD + categories + popular
│   │       ├── orders/               # Order management + kitchen
│   │       └── search/               # Semantic search (embed → Qdrant)
│   │           └── route.ts          # GET/POST: semantic search
│   ├── components/                   # React Components
│   │   ├── ui/                       # Shadcn/UI base components
│   │   ├── chat/                     # Chat-specific components
│   │   ├── menu/                     # Menu cards, grid, search bar
│   │   ├── order/                    # Cart, kitchen order cards
│   │   └── layout/                   # Header, sidebar, navigation
│   ├── db/                           # Database Layer
│   │   ├── schema/                   # Drizzle table definitions
│   │   │   ├── auth.ts               # user, session, account
│   │   │   ├── menu.ts               # category, menu_item, customize_option
│   │   │   ├── order.ts              # order, order_item, item_customization
│   │   │   ├── chat.ts               # chat_session, chat_message
│   │   │   └── index.ts              # barrel export
│   │   ├── migrations/               # Auto-generated SQL migrations
│   │   ├── seed.ts                   # Seed data + embedding generation
│   │   └── index.ts                  # Drizzle client instance
│   ├── hooks/                        # Custom React Hooks (Zustand)
│   └── lib/                          # Service Clients
│       ├── ai.ts                     # LLM client + prompt construction
│       ├── embedding.ts              # TEI embedding generation
│       ├── qdrant.ts                 # Qdrant client (search, upsert)
│       ├── auth.ts                   # Better Auth server config
│       ├── auth-client.ts            # Client-side auth
│       └── utils.ts                  # Shared utilities
├── embedding-service/                # Python FastAPI sidecar (fallback)
│   ├── main.py                       # Embedding endpoint
│   ├── requirements.txt              # Python dependencies
│   └── Dockerfile                    # Container build
├── llm/                              # Custom Ollama with pre-baked models
│   └── Dockerfile                    # Builds Ollama + pulls models
├── docker-compose.yml                # Full infrastructure orchestration
├── drizzle.config.ts                 # Drizzle ORM settings
├── prd.md                            # Product Requirements Document
└── product_specification.md          # Detailed product specification
```

---

## 🔗 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `ALL` | `/api/auth/**` | Public | Better Auth (login, register, session) |
| `POST` | `/api/chat` | User | Chat message → semantic search → LLM response |
| `GET` | `/api/chat/history` | User | List user's chat sessions |
| `GET` | `/api/chat/history/[sessionId]` | User | Load messages for a session |
| `GET` | `/api/search?q=...` | Public | Semantic menu search (GET) |
| `POST` | `/api/search` | Public | Semantic menu search (POST) |
| `GET` | `/api/menu` | Public | List all menu items |
| `POST` | `/api/menu` | Admin | Create menu + auto-generate embedding |
| `PUT` | `/api/menu/[id]` | Admin | Update menu + re-generate embedding |
| `DELETE` | `/api/menu/[id]` | Admin | Delete menu + remove from Qdrant |
| `GET` | `/api/menu/categories` | Public | List categories |
| `GET` | `/api/menu/popular` | Public | Popular items |
| `POST` | `/api/orders` | User | Create order |
| `GET` | `/api/orders` | Kitchen | List orders |
| `PATCH` | `/api/orders/[id]/status` | Kitchen | Update order status |
| `GET` | `/api/orders/active` | Kitchen | Active orders for dashboard |

---

## 📖 Documentation

- 📋 **[Product Requirements (PRD)](./prd.md)** — Business requirements, system architecture, and semantic search specification
- 📄 **[Product Specification](./product_specification.md)** — Detailed technical specification with ERD, API details, and Mermaid diagrams

---

## Available Scripts

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run seed         # Seed database + generate embeddings
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Apply migrations
npm run db:studio    # Open Drizzle Studio (DB browser)
npm run db:all       # Generate + migrate + seed (all-in-one)
```