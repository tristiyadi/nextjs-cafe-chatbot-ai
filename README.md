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
Create a `.env` file in the root directory. You can copy the template below:

```bash
# Database (PostgreSQL)
DATABASE_USER=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=cafe_db
DATABASE_URL=postgres://postgres:password@localhost:5432/cafe_db

# Qdrant (Vector DB)
QDRANT_URL=http://localhost:6333

# AI Services
LOCAL_LLM_API_KEY=ollama
LOCAL_LLM_URL=http://localhost:11434/v1
LOCAL_LLM_MODEL=llama3.2:1b
EMBEDDING_SERVICE_URL=http://localhost:8001

# Better Auth
BETTER_AUTH_SECRET=your-random-secret-key-12345
BETTER_AUTH_URL=http://localhost:3000
```

### 4. Lift the Infrastructure (Docker)
We use Docker to run the database, vector store, and AI services. This ensures a consistent environment for everyone.

```bash
# Start all background services
docker compose up -d db qdrant embedding llm llm-init
```

> [!NOTE]
> The `llm-init` service will automatically download the `llama3.2:1b` model once the LLM service is ready. This might take a few minutes depending on your internet speed.

### 5. Initialize the Database
Once the database container is healthy, you need to set up the tables and initial data.

```bash
# 1. Generate the migration files
npm run db:generate

# 2. Apply migrations to your Postgres container
npm run db:migrate

# 3. Seed the database with sample menu items and AI embeddings
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

## 🚀 Key Technologies

*   **Next.js 15**: Core framework with App Router and Server Components.
*   **Drizzle ORM**: Type-safe database interactions with PostgreSQL.
*   **Qdrant**: High-performance vector database for semantic menu search.
*   **FastAPI + e5-small**: Specialized Python service for generating Indonesian-optimized embeddings.
*   **Ollama**: Local execution of Llama 3 models for private, fast AI chat.
*   **Better Auth**: Secure, modern authentication with role-based access.

---

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Docker Compose (Full Stack)

To run everything containerized:

```bash
docker compose up --build
```

## Access Points

| URL | Description |
|---|---|
| `http://localhost:3000` | Customer Portal (Landing + Order) |
| `http://localhost:3000/login` | Login |
| `http://localhost:3000/register` | Register |
| `http://localhost:3000/order` | Chat + Menu (Split View) |
| `http://localhost:3000/order/cart` | Order Cart |
| `http://localhost:3000/order/track` | Order Tracking |
| `http://localhost:3000/kitchen` | Kitchen Dashboard |
| `http://localhost:3000/admin/menu` | Admin Menu Management |

## NPM Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run seed` | Seed database with sample data + embeddings |
| `npm run db:generate` | Generate Drizzle migrations from schema |
| `npm run db:migrate` | Apply migrations to database |
| `npm run db:studio` | Open Drizzle Studio (visual DB browser) |

## Project Structure

```
cafe-chatbot/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login, Register pages
│   │   ├── (customer)/      # Landing, Order, Cart, Track
│   │   ├── admin/           # Admin menu management
│   │   ├── kitchen/         # Kitchen dashboard
│   │   └── api/             # API Route Handlers
│   ├── components/
│   │   ├── ui/              # Shadcn components
│   │   ├── order/           # ChatBox, MenuDisplay
│   │   └── layout/          # Navbar
│   ├── db/
│   │   ├── schema/          # Drizzle ORM schema + relations
│   │   ├── migrations/      # Generated SQL migrations
│   │   └── seed.ts          # Database seeder
│   ├── hooks/               # useCart (Zustand)
│   └── lib/                 # Auth, AI, Qdrant, Embedding clients
├── embedding-service/       # Python FastAPI + Multilingual-E5-Small (intfloat)
├── docker-compose.yml
├── Dockerfile
└── drizzle.config.ts
```


## 📖 Project Documentation

Detailed information is available in the dedicated specification files:
*   📄 **[Product Specification](./product_specification.md)** — Core features and data models.
*   📋 **[Implementation Plan](./implementation_plan.md)** — Architectural roadmap and building blocks.