# ☕ Kafe Nusantara: AI-Powered Cafe Experience

Kafe Nusantara is a modern, premium cafe ordering platform that combines a beautiful user interface with an **AI Barista**. It features high-performance semantic search for the menu and an intelligent chatbot for personalized recommendations.

---

## 🛠️ Step-by-Step Setup Guide

Follow these steps precisely to get the project running on your local machine.

### 1. Prerequisites
Ensure you have the following installed:
*   **Node.js 20+** (Recommended: v20.x or v22.x)
*   **Docker Desktop** (Essential for DB, Vector Search, and AI services)
*   **Git**

### 2. Clone and Install Dependencies
Open your terminal in the project directory and run:

```bash
# Install NPM packages
npm install --legacy-peer-deps
```

### 3. Environment Configuration
Create a `.env` file in the root directory. You can use the values below as a template:

```bash
# Database (PostgreSQL 17)
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=cafe_db
DATABASE_URL=postgres://postgres:password@127.0.0.1:5432/cafe_db

# Qdrant (Vector DB)
QDRANT_URL=http://localhost:6333

# AI Services Choice
# LLM_TYPE: openai, ollama, mistral, qwen
LLM_TYPE=ollama
# EMBEDDING_TYPE: bge-m3, multilingual-e5
EMBEDDING_TYPE=multilingual-e5
# Mapping EMBEDDING_TYPE to Model ID for docker-compose build
EMBEDDING_MODEL_ID=intfloat/multilingual-e5-small

# Local AI Configuration
LOCAL_LLM_URL=http://localhost:11434/v1
LOCAL_LLM_MODEL=llama3.2:1b
EMBEDDING_SERVICE_URL=http://localhost:8001

# OpenAI Configuration (Optional)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# Better Auth
BETTER_AUTH_SECRET=your-random-secret-key-12345
BETTER_AUTH_URL=http://localhost:3000
```

### 4. Lift the Infrastructure (Docker)
We use Docker to run the database (Postgres 17), vector store (Qdrant), and specialized AI engines.

```bash
# 1. Build and start services
# Note: the LLM build will pre-download Llama, Mistral, and Qwen models.
docker compose up -d --build
```

for check model installed in ollama:
```bash
curl http://localhost:11434/api/tags
docker compose exec llm ollama list
```

### 5. Initialize the Database
Once the database container is healthy, you need to set up the tables and initial data.

```bash
# 1. Generate the migration files
npm run db:generate

# 2. Apply migrations to your Postgres container
npm run db:migrate

# 3. Seed the database (Populates menu + Generates AI Embeddings)
npm run seed
```

### 6. Launch the Application
Start the Next.js development server:

```bash
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** to experience the app!

---

## 🧭 Application Access Points

| Portal | URL | Description |
|---|---|---|
| **Customer Portal** | `/` | Responsive landing page and iPad-optimized experience. |
| **Ordering Area** | `/order` | Split-view workspace with the AI Barista and Menu. |
| **Kitchen Dashboard** | `/kitchen` | Real-time order management for staff (Modern Dark Mode). |
| **Admin Control** | `/admin/menu` | Full management of cafe categories and menu items. |

---

## 🔍 Vector Analysis & Monitoring

You can monitor and analyze the AI embedding data through the following tools:

### 1. Postgres Vector Storage (via Drizzle Studio)
We store the raw embedding vectors in the `menu_item` table for analysis. You can view them by running:
```bash
npm run db:studio
```
Open the `menu_item` table to see the `embedding_vector` field populated with numerical arrays.

### 2. Qdrant Vector Dashboard
To visualize how the AI "sees" your menu items in the vector space and test similarity search:
1.  Open your browser and go to **[http://localhost:6333/dashboard](http://localhost:6333/dashboard)**.
2.  Select the `menu_items` collection.
3.  You can browse stored points or test searches using vectors.
### 3. how to query quadrant

```
// List all collections
GET collections

// Get collection info
GET collections/menu_items

// List points in a collection, using filter
POST collections/menu_items/points/scroll
{
  "limit": 10,
  "filter": {
    "must": [
      {
        "key": "category",
        "match": {
          "any": ["teh", "kopi", "caffe"]
        }
      }
    ]
  }
}

POST collections/menu_items/points/search
{
  "vector": [],
  "limit": 5,
  "filter": {
    "must": [
      {
        "key": "is_available",
        "match": { "value": true }
      }
    ]
  }
}
```
---

## 🚀 Key Technologies

*   **Next.js 15**: Core framework with App Router and Server Components.
*   **PostgreSQL 17**: Robust relational database for core business logic.
*   **Drizzle ORM**: Type-safe database interactions.
*   **Qdrant**: High-performance vector database for semantic menu search.
*   **FastAPI + FlagEmbedding**: Specialized Python service for BGE-M3/E5 embeddings.
*   **Ollama (Pre-built)**: Custom Docker service with pre-baked Llama, Mistral, and Qwen models.
*   **Better Auth**: Secure, modern authentication with role-based access.

---

## Project Structure

```
cafe-chatbot/
├── src/
│   ├── app/                 # Next.js App Router (Auth, Customer, Admin, Kitchen)
│   ├── components/          # React Components (UI, Order, Layout)
│   ├── db/                  # Drizzle Schema, Migrations, and Seeder
│   ├── hooks/               # Custom React Hooks (Zustand)
│   └── lib/                 # Service Clients (AI, Qdrant, Embedding, Auth)
├── llm/                     # Custom Ollama Dockerfile with pre-baked models
├── embedding-service/       # Python FastAPI Embedding Engine
├── docker-compose.yml       # Full-stack orchestration
├── Dockerfile               # Production Next.js Dockerfile
└── drizzle.config.ts        # Drizzle ORM Configuration
```

---

<!-- ## 📖 Project Documentation

Detailed information is available in the dedicated specification files:
*   📄 **[Product Specification](./product_specification.md)** — Core features and data models.
*   📋 **[Implementation Plan](./implementation_plan.md)** — Architectural roadmap and building blocks. -->