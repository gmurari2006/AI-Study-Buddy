# DOCUMENT 07 — Deployment & Demo Plan

## 1. Deployment Architecture
The production demo deployment for **AI Study Buddy** relies entirely on high-availability **free-tier cloud services**. This guarantees a total operational cost of **$0/month** while providing production-ready stability for hackathon evaluation and live judge demonstrations.

```
[Vercel Global CDN] ──► Host Frontend (Next.js 14 App Router)
                                │
                                ▼ (HTTPS / CORS Rest API)
[Render Free Web Service] ──► Host Backend (FastAPI Docker Container)
                                │
                                ├─► [Supabase PostgreSQL + pgvector] (Database)
                                ├─► [Supabase Storage Buckets] (PDF Storage)
                                └─► [Google Gemini 3.6 Flash API] (LLM & Embeddings)
```

---

## 2–3. Deployment Targets & Environment Configuration

| Service Layer | Provider | Free Tier Allocation / Limits | Configuration Details |
|---|---|---|---|
| **Frontend** | **Vercel** | Unlimited Bandwidth / 100GB | Next.js 14 SSR & Static Asset Hosting |
| **Backend API** | **Render** | 512 MB RAM / 0.1 CPU | Docker Web Service container |
| **Database & Vector** | **Supabase** | 500 MB DB / 50K Monthly Active Users | PostgreSQL 16 + `pgvector` HNSW |
| **File Storage** | **Supabase Storage** | 1 GB Storage / 2 GB Egress | Public/Private PDF Buckets |
| **AI LLM & Vector API**| **Google AI Studio** | 15 RPM / 1M TPM / 1,500 RPD | Gemini 3.6 Flash & gemini-embedding-001 |

### Production Environment Variables (`.env`)
```bash
# Backend Environment Configuration
ENVIRONMENT=production
PROJECT_NAME="AI Study Buddy"
API_V1_STR="/api/v1"

# Database Configuration (Supabase PostgreSQL)
DATABASE_URL="postgresql+asyncpg://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase Auth & Storage Configuration
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
SUPABASE_STORAGE_BUCKET="study-materials"

# External AI Provider Configuration
GEMINI_API_KEY="AIzaSyB..."
EMBEDDING_MODEL_NAME="models/gemini-embedding-001"
EMBEDDING_DIMENSIONALITY=768
LLM_MODEL_NAME="gemini-3.6-flash"

# Security & CORS Settings
CORS_ORIGINS='["https://ai-study-buddy.vercel.app","http://localhost:3000"]'
JWT_SECRET_KEY="super-secret-jwt-key"
```

---

## 4. Docker Containerization Strategy

### Backend Dockerfile (`Dockerfile`)
```dockerfile
# Multi-stage lightweight Python Dockerfile
FROM python:3.11-slim as builder

WORKDIR /app

# Install system dependencies for C extensions and PDF parsing
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 8–9. CI/CD & Git Branching Strategy
- **Version Control:** GitHub Repository (`ai-study-buddy`).
- **Branching Workflow:**
  - `main` — Production demo branch; triggers automatic build & deployment to Vercel and Render via GitHub Webhooks.
  - `dev` — Integration branch for day-to-day feature development.
  - `feature/*` — Feature branches (e.g., `feature/rag-citation`, `feature/quiz-json`).
- **Automated Workflow (GitHub Actions):** On pull-request to `main`, execute `pytest` test suite and lint checks before allowing merge.

---

## 13–14. Demo Environment & Pre-Populated Dataset Checklist

> [!IMPORTANT]
> **Pre-Populated Demo Dataset Setup:**
> To guarantee zero delays and instant responses during the 3-minute hackathon judge evaluation, pre-load the system with the following demo user and materials:

- **Demo Account:** `demo.student@aistudybuddy.com` / `Hackathon2026!`
- **Pre-Loaded Subject:** *Database Management Systems (CS302)*
- **Pre-Loaded Study Material:** `DBMS_Unit1_RelationalAlgebra.pdf` (18 Pages, Status: `COMPLETED`, 42 Embeddings Indexed).
- **Pre-Generated Assessment:** 1 Quiz ("Relational Algebra MCQs"), 1 Deck ("DBMS Core Terms"), 1 Weak Topic Flagged ("Relational Division").

---

## 15–16. 3-Minute Hackathon Demo Script & Presentation Flow

```
[0:00 - 0:30] PROBLEM STATEMENT
"Students spend 40% of their study time sifting through massive lecture slides, cramming 
inefficiently, and getting inaccurate answers from standard AI chatbots."

[0:30 - 1:15] SOLUTION & RAG CITATION DEMO
"Meet AI Study Buddy. Here's our DBMS course. I've uploaded our professor's 18-page PDF. 
Let's ask: 'What is the division operator in relational algebra?'
Notice the response — it's not generic AI knowledge. It gives a precise grounded explanation 
AND displays an interactive citation pill pointing to Page 12 of our PDF slides."

[1:15 - 2:00] AUTOMATED ACTIVE RECALL & WEAK TOPIC DETECTION
"With one click, AI Study Buddy auto-generates a 5-question MCQ practice quiz from our PDF. 
Let's submit it. I scored 3/5. The system automatically recalculates my Topic Mastery using 
an Exponential Moving Average formula, flagging 'Relational Division' as a Weak Topic on my dashboard."

[2:00 - 2:30] ADAPTIVE STUDY PLANNER
"Finally, I input my exam date — 10 days away. The AI generates a customized day-by-day study schedule, 
automatically allocating extra revision sessions for my weak topic."

[2:30 - 3:00] ARCHITECTURE & $0 COST IMPACT
"Built with Next.js, FastAPI, PostgreSQL pgvector, and Gemini 3.6 Flash. 
Fully production-ready operating at $0/month cost. Thank you!"
```

---

## 17. Expected Judge Q&A Preparation

| Expected Judge Question | Architectural Answer & Technical Justification |
|---|---|
| **"How do you prevent the AI from hallucinating answers?"** | "We enforce strict RAG context grounding with cosine vector search over `pgvector`. Our system prompt explicitly instructs Gemini 3.6 Flash to state 'Context not found' if similarity scores fall below 0.65." |
| **"What happens if you hit the Gemini API rate limit during a live demo?"** | "We built an in-memory TTL response cache in FastAPI and pre-warmed our vector database with our demo PDF embeddings, ensuring demo queries hit local cache in <50ms." |
| **"Why choose pgvector instead of Pinecone or Qdrant?"** | "By using `pgvector` natively within PostgreSQL, we keep our database architecture in a single instance, maintaining zero financial cost and supporting transactional consistency across users, quizzes, and embeddings." |
| **"How do you calculate weak topics?"** | "Instead of trusting raw LLM guesses, we calculate an Exponential Moving Average (EMA) score on quiz attempts ($\alpha=0.35$). Any score $<0.60$ programmatically flags the topic as WEAK." |
