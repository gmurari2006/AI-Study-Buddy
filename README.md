# AI Study Buddy — Project Documentation Suite (v4 Patch)

Welcome to the central single source of truth for **AI Study Buddy** — a context-aware, personalized AI study companion designed for CSE/STEM students.

---

## 1. Documentation Index & File Map

| File Name | Document Title | Primary Contents & Focus |
|---|---|---|
| [`01_PRODUCT_REQUIREMENTS_DOCUMENT.md`](file:///C:/Users/tinku/.gemini/antigravity-ide/scratch/AI-STUDY-BUDDY-DOCUMENTATION/01_PRODUCT_REQUIREMENTS_DOCUMENT.md) | Product Requirements Document (PRD) | 42 required PRD sections, problem analysis, user stories, functional requirements (`FR-01`..`FR-16`), non-functional requirements (`NFR-01`..`NFR-08`), and AI feature map (`AI-01`..`AI-08`). |
| [`02_SYSTEM_ARCHITECTURE_AND_TECHNICAL_DESIGN.md`](file:///C:/Users/tinku/.gemini/antigravity-ide/scratch/AI-STUDY-BUDDY-DOCUMENTATION/02_SYSTEM_ARCHITECTURE_AND_TECHNICAL_DESIGN.md) | System Architecture & Technical Design | System topology, Mermaid architecture & sequence diagrams, decoupled Next.js + FastAPI design, RAG pipeline, and technology trade-off matrix. |
| [`03_DATABASE_SCHEMA_AND_ERD.md`](file:///C:/Users/tinku/.gemini/antigravity-ide/scratch/AI-STUDY-BUDDY-DOCUMENTATION/03_DATABASE_SCHEMA_AND_ERD.md) | Database Schema & ERD | Hybrid relational-vector database model, PostgreSQL + `pgvector` HNSW index specification, Mermaid ERD, executable SQL DDL script, and `notifications` table. |
| [`04_AI_ML_TECHNICAL_SPECIFICATION.md`](file:///C:/Users/tinku/.gemini/antigravity-ide/scratch/AI-STUDY-BUDDY-DOCUMENTATION/04_AI_ML_TECHNICAL_SPECIFICATION.md) | AI/ML Technical Specification | RAG pipeline, chunking parameters, Google Gemini 3.6 Flash prompt templates, JSON schema mode enforcement, weak topic Exponential Moving Average formula, and $0 cost breakdown. |
| [`05_API_SPECIFICATION.md`](file:///C:/Users/tinku/.gemini/antigravity-ide/scratch/AI-STUDY-BUDDY-DOCUMENTATION/05_API_SPECIFICATION.md) | API Specification | 17 REST API endpoint modules (including Notifications and detailed Analytics & Mastery endpoints), Pydantic request/response JSON schemas, error response standards, and requirement traceability tags. |
| [`06_TESTING_AND_EVALUATION_PLAN.md`](file:///C:/Users/tinku/.gemini/antigravity-ide/scratch/AI-STUDY-BUDDY-DOCUMENTATION/06_TESTING_AND_EVALUATION_PLAN.md) | Testing & Evaluation Plan | Multi-tier testing strategy, Ragas AI evaluation metrics, comprehensive test case matrix (`TC-*` including `TC-SUM-01`, `TC-NOTIF-01`, `TC-REL-01`, `TC-UI-01`), and edge-case handling. |
| [`07_DEPLOYMENT_AND_DEMO_PLAN.md`](file:///C:/Users/tinku/.gemini/antigravity-ide/scratch/AI-STUDY-BUDDY-DOCUMENTATION/07_DEPLOYMENT_AND_DEMO_PLAN.md) | Deployment & Demo Plan | Free-tier hosting strategy (Vercel + Render + Supabase), backend Dockerfile, pre-populated demo data checklist, 3-minute hackathon pitch script, and judge Q&A prep. |
| [`08_TRACEABILITY_MATRIX.md`](file:///C:/Users/tinku/.gemini/antigravity-ide/scratch/AI-STUDY-BUDDY-DOCUMENTATION/08_TRACEABILITY_MATRIX.md) | Requirement Traceability Matrix | Complete matrix linking every requirement ID (`FR-01`..`16`, `NFR-01`..`08`, `AI-01`..`08`) across architecture components, database tables, API endpoints, AI components, and test case IDs. |

---

## 2. Document Relationships & Workflow

```
[01_PRD (Requirements FR-01..16, AI-01..08, NFR-01..08)]
       │
       ├───────────────────────────────┬───────────────────────────────┐
       ▼                               ▼                               ▼
[02_ARCHITECTURE]              [03_DATABASE_SCHEMA]            [04_AI_ML_SPEC]
(System Design & Data Flow)    (PostgreSQL DDL & pgvector)     (RAG & Gemini 3.6 Flash Engine)
       │                               │                               │
       └───────────────────────────────┼───────────────────────────────┘
                                       ▼
                             [05_API_SPECIFICATION]
                             (FastAPI Endpoint Schemas)
                                       │
                       ┌───────────────┴───────────────┐
                       ▼                               ▼
             [06_TESTING_PLAN]               [07_DEPLOYMENT_PLAN]
             (Test Matrix & Ragas)           (Free-Tier Hosting & Demo Script)
                                       │
                                       ▼
                         [08_TRACEABILITY_MATRIX]
                         (Cross-Document Verification)
```

---

## 3. Consolidated Assumptions Log (Updated v4)

The following **11 core technical and operational assumptions** were made across the documentation suite:

1. **Team Size & Timeline Assumption:** Developed by a **solo 3rd-year CSE AI/ML student** within a **14-day sprint** leading to a live hackathon demonstration.
2. **Financial Cost Constraint ($0/mo):** 100% of services run on free-tier allocations (Google AI Studio Gemini API, Supabase Free Tier, Render Free Web Service, Vercel Free Tier).
3. **Frontend Framework:** **Next.js 14 App Router** (TypeScript, Tailwind CSS, Lucide React icons) selected for rapid UI development and seamless Vercel deployment.
4. **Backend Framework:** **Python 3.11+ FastAPI** selected for native async support, automated OpenAPI docs generation, and seamless integration with Python PDF/ML tooling.
5. **Database & Vector Engine:** **PostgreSQL 16 with `pgvector`** extension hosted on Supabase Free Tier chosen over standalone vector databases (e.g., Pinecone) to eliminate multi-service overhead and operate within a single free instance.
6. **AI/LLM Provider Choice (v4 Correction):** **Google Gemini 3.6 Flash API** selected as the active Flash-tier model. (Note: Previous choices `gemini-1.5-flash` and `gemini-2.5-flash` were deprecated/shut down). Features a 1,000,000 token context window, strict JSON schema output mode, fast sub-2s latency, and a generous free tier (15 RPM / 1M TPM / 1,500 RPD).
7. **Embedding Model Choice (v4 Correction):** **Google `gemini-embedding-001`** selected as the active embedding model on the Gemini Developer API. (Note: `text-embedding-005` was invalid as it is a Vertex AI Enterprise-only model returning 404 NOT_FOUND on the Gemini Developer API). Configured with Matryoshka Representation Learning `output_dimensionality=768` to produce 768-dimensional float vectors, maintaining exact 100% compatibility with the existing PostgreSQL `document_chunks.embedding VECTOR(768)` column and HNSW index with zero database schema changes.
8. **Document Storage & Limits:** **Supabase Storage** configured for PDF uploads with a max file size limit of **15MB** per file and text extraction via `pdfplumber`.
9. **Authentication Strategy:** **Supabase Auth** issuing RSA-signed JWT tokens verified statelessly by the FastAPI backend middleware.
10. **Weak Topic Identification Algorithm:** Calculated using an **Exponential Moving Average (EMA, $\alpha=0.35$)** on quiz attempt scores rather than pure LLM heuristic guessing, guaranteeing mathematical consistency.
11. **Recommendation vs. Notification Data Design:**
    - **Smart Recommendation (`FR-12`):** Implemented via dynamic rule-assisted SQL queries over `topic_mastery` and `study_materials` rather than a dedicated table to avoid unnecessary database schema bloat for MVP scope.
    - **Notifications (`FR-16`):** Built using a dedicated `notifications` table (`id`, `user_id`, `title`, `message`, `notification_type`, `is_read`, `link_url`, `created_at`) because tracking persistent read/unread state across sessions is essential for user alerts and study reminders.

---

## 4. Cross-Document Consistency Guarantee
All seven documents and the traceability matrix have been verified for consistency:
- Every feature in PRD (`FR-*`, `AI-*`, `NFR-*`) has a matching API endpoint, database table, AI pipeline, and test case ID.
- No database table exists without a corresponding API model and business requirement.
- SQL DDL, API JSON schemas, and Mermaid diagrams are ready for immediate implementation.
