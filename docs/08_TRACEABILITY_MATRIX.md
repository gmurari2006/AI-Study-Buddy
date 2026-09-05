# DOCUMENT 08 — Requirement Traceability Matrix

## Requirement Traceability Matrix (RTM)

This matrix maps every functional requirement (`FR-*`), non-functional requirement (`NFR-*`), and AI feature (`AI-*`) across all system design documents to ensure complete architectural coverage, zero orphaned entities, and verifiable test traceability.

| Requirement ID | Feature Name | Architecture Component | DB Table(s) | API Endpoint(s) | AI/ML Component | Test ID(s) |
|---|---|---|---|---|---|---|
| `FR-01` | Auth & User Profile | Supabase Auth & FastAPI Auth Middleware | `user_profiles` | `GET /users/me` | N/A (Standard Auth) | `TC-AUTH-01`, `TC-AUTH-02` |
| `FR-02` | Subject & Course CRUD | FastAPI Backend Service | `subjects` | `POST /subjects`, `GET /subjects` | N/A (Relational CRUD) | `TC-DOC-01` |
| `FR-03` | Study Material Ingestion | Supabase Storage & Background Pipeline | `study_materials` | `POST /documents/upload` | `AI-01` (PDF Extraction) | `TC-DOC-01`, `TC-DOC-02` |
| `FR-04` | Doc Processing Status | FastAPI Async Worker | `document_chunks` | `GET /documents/{id}/status` | `AI-01`, `AI-02` (Chunk & Embed) | `TC-DOC-01` |
| `FR-05` | Grounded Document QA | RAG Retrieval Engine | `conversations`, `messages`, `document_chunks` | `POST /chat/query` | `AI-03` (RAG Gemini 3.6 Q&A) | `TC-RAG-01`, `TC-RAG-02` |
| `FR-06` | Document Summarizer | Assessment & Study Generator | `study_materials`, `document_chunks` | `POST /summaries/generate` | `AI-06` (Map-Reduce Summary) | `TC-SUM-01` |
| `FR-07` | Quiz Engine | Assessment & Study Generator | `quizzes`, `quiz_questions`, `quiz_attempts` | `POST /quizzes/generate`, `POST /quizzes/{id}/submit` | `AI-04` (Structured MCQ Prompt) | `TC-QUIZ-01`, `TC-QUIZ-02` |
| `FR-08` | Flashcard Deck Engine | Assessment & Study Generator | `flashcard_decks`, `flashcards` | `POST /flashcards/generate` | `AI-05` (Flashcard Concept Extractor) | `TC-CARD-01` |
| `FR-09` | Study Schedule Planner | Analytics & Mastery Engine | `study_plans`, `study_tasks` | `POST /planner/generate` | `AI-07` (Adaptive Schedule Prompt) | `TC-PLAN-01` |
| `FR-10` | Session Progress Logging| Analytics & Mastery Engine | `study_sessions`, `quiz_attempts` | `GET /analytics/sessions` | `AI-08` (Study Analytics) | `TC-QUIZ-02` |
| `FR-11` | Weak Topic Detector | Analytics & Mastery Engine | `topic_mastery` | `GET /analytics/weak-topics` | `AI-08` (Exponential Moving Avg) | `TC-QUIZ-02` |
| `FR-12` | Smart Recommendation | Analytics & Mastery Engine | `topic_mastery`, `study_materials` | `GET /analytics/recommendations` | `AI-08` (Rule-assisted Recommender)| `TC-PLAN-01` |
| `FR-13` | AI Tutor Chat Toggle | RAG Retrieval Engine | `conversations`, `messages` | `POST /chat/query` | `AI-03` (General vs Grounded Prompt)| `TC-RAG-01`, `TC-RAG-02` |
| `FR-14` | Study Activity History | FastAPI Backend Service | `conversations`, `quiz_attempts` | `GET /chat/history` | N/A (Relational Query) | `TC-RAG-01` |
| `FR-15` | Student Dashboard | Next.js Client & Backend Aggregator | `subjects`, `study_materials`, `topic_mastery` | `GET /dashboard/summary` | `AI-08` (Aggregated Mastery Stats) | `TC-PERF-01` |
| `FR-16` | Notification & Alerts | Notification Service | `notifications` | `GET /notifications`, `PATCH /notifications/{id}/read` | N/A (Alert Dispatcher) | `TC-NOTIF-01` |
| `NFR-01` | RAG Latency (<2.5s) | RAG Retrieval Engine | `document_chunks` (HNSW Index) | `POST /chat/query` | `AI-02`, `AI-03` (Optimized Vector Search)| `TC-PERF-01` |
| `NFR-02` | Upload Latency (<10s) | Document Processing Pipeline | `study_materials`, `document_chunks` | `POST /documents/upload` | `AI-01`, `AI-02` (Async Extraction Pipeline)| `TC-DOC-01` |
| `NFR-03` | Reliability (>99.0%) | FastAPI Backend Gateway | All Tables | All Endpoints | Resilience & Retries | `TC-REL-01` |
| `NFR-04` | $0/mo Cost Constraint | Full Stack Infrastructure | All Tables (Supabase Free) | All Endpoints | Gemini 3.6 Flash Free Tier | `TC-PERF-02` |
| `NFR-05` | Scalability (50 User) | FastAPI Async & DB Pool | All Tables (PostgreSQL Pool) | All Endpoints | Async Connection Pool | `TC-PERF-02` |
| `NFR-06` | Security & RLS | Supabase Auth & FastAPI | `user_profiles`, `subjects` | All Authenticated Endpoints | N/A (RSA JWT Validation) | `TC-AUTH-02`, `TC-SEC-01` |
| `NFR-07` | Usability & UI (CLS<0.1)| Next.js Web Client | N/A (Frontend Responsive Layout)| Client Pages | Responsive Web Design | `TC-UI-01` |
| `NFR-08` | Data Privacy | Supabase RLS & FastAPI | `subjects`, `document_chunks` | `POST /chat/query` | Grounded Scope Isolation | `TC-SEC-01` |
| `AI-01` | Hybrid Chunking | Background Worker | `document_chunks` | `POST /documents/upload` | Recursive Character Splitter | `TC-DOC-01` |
| `AI-02` | Dense Embeddings | RAG Engine | `document_chunks` | `POST /documents/upload` | gemini-embedding-001 (MRL 768d)| `TC-DOC-01` |
| `AI-03` | Grounded RAG QA | RAG Engine | `document_chunks`, `messages` | `POST /chat/query` | Gemini 3.6 Flash Grounded Prompt | `TC-RAG-01`, `TC-RAG-02` |
| `AI-04` | Structured Quiz Gen | Assessment Generator | `quizzes`, `quiz_questions` | `POST /quizzes/generate` | Gemini JSON Schema Enforcement | `TC-QUIZ-01` |
| `AI-05` | Flashcard Deck Gen | Assessment Generator | `flashcards` | `POST /flashcards/generate` | Gemini JSON Schema Enforcement | `TC-CARD-01` |
| `AI-06` | Doc Summarizer | Assessment Generator | `study_materials` | `POST /summaries/generate` | Hierarchical Map-Reduce Prompt | `TC-SUM-01` |
| `AI-07` | Study Schedule Planner | Analytics Engine | `study_plans`, `study_tasks` | `POST /planner/generate` | Adaptive Schedule Prompt | `TC-PLAN-01` |
| `AI-08` | Weak Topic Detector | Analytics Engine | `topic_mastery` | `GET /analytics/weak-topics` | EMA Formula + Rule Engine | `TC-QUIZ-02` |
