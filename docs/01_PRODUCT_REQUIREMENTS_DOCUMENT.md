# DOCUMENT 01 — Product Requirements Document (PRD)

## 1. Document Information
- **Project Name:** AI Study Buddy
- **Document Version:** 1.0.0
- **Authors:** Product & Technical Engineering Team
- **Target Audience:** Hackathon Evaluators, Engineers, Product Managers
- **Project Context:** 3rd-year CSE AI/ML Student Hackathon Project (Solo Developer, 14-day timeline)

---

## 2. Product Overview
**AI Study Buddy** is a context-aware, personalized AI-powered study companion designed for higher education students. Unlike generic chatbots, AI Study Buddy ingests student study materials (PDFs, lecture notes, textbooks) and combines Retrieval-Augmented Generation (RAG) with learning analytics to generate contextual QA, summaries, quizzes, flashcards, and adaptive study schedules.

---

## 3. Executive Summary
Students struggle with information overload, inefficient study methods, and generic AI tools that lack context or produce hallucinations. AI Study Buddy provides a single workspace where learning materials are grounded via vector retrieval, allowing instant, verifiable context-aware tutoring, automated self-assessment (quizzes/flashcards), weak topic identification, and dynamic study planning at zero monthly software cost ($0/mo free-tier stack).

---

## 4. Problem Statement
Computer Science and engineering students process hundreds of pages of technical notes and slides per course. Existing LLM chatbots (e.g., standard ChatGPT) lack access to specific course slides, hallucinate formulas, and do not track student learning progress over time.

---

## 5. Problem Analysis
| Root Cause | Impact on Student | System Solution |
|---|---|---|
| Information Overload | Spending 40%+ of study time finding relevant topics | Semantic Search & RAG Chunking (`AI-01`, `AI-02`) |
| Passive Reading | Low retention (<20% after 48 hours) | Auto-generated Quizzes (`AI-04`) & Flashcards (`AI-05`) |
| Lack of Personalization | Studying already mastered topics while neglecting weak spots | Topic Mastery Tracking (`FR-11`) & Recommendations (`AI-08`) |
| Exam Preparation Stress | Unstructured cramming before finals | Adaptive Study Schedule Generator (`AI-07`) |

---

## 6. Proposed Solution
A unified Web Application with:
1. **Document Management & Parsing:** Secure PDF/Note ingestion with vector embeddings.
2. **Context-Grounded AI Tutor:** RAG-driven Q&A citing exact source page numbers.
3. **Automated Assessment Suite:** Instant MCQ quiz and flashcard generation.
4. **Adaptive Learning Engine:** Automated weak-topic detection and custom study plans.

---

## 7. Product Vision
To empower every student with a 24/7 personal AI tutor that understands their exact course curriculum, adapts to their learning pace, and eliminates exam anxiety through structured, active learning.

---

## 8. Product Goals
- **Goal 1:** Achieve >90% grounding accuracy for user document queries (zero hallucinations on source material).
- **Goal 2:** Reduce exam preparation setup time from hours to under 3 minutes (instant summary/quiz generation).
- **Goal 3:** Deliver an end-to-end usable MVP within a 14-day sprint for hackathon demonstration.

---

## 9. Target Users
- Undergraduate Computer Science & Engineering (CSE) / STEM students.
- Hackathon judges and technical evaluators.
- Self-directed learners managing multiple dense subjects.

---

## 10. User Personas
### Persona A: Alex (3rd-Year CSE Student)
- **Background:** Taking 6 heavy courses (OS, DBMS, ML, Networks, Algo, WebDev).
- **Pain Point:** Has 500+ slides per subject; cannot quickly find specific formulas or concepts during revision.
- **Needs:** Upload PDFs, ask "Explain Page 14 of OS slides in simple terms", generate 10 practice MCQs.

### Persona B: Priya (Exam Crammer)
- **Background:** Exam is in 3 days; behind on 4 units of Database Systems.
- **Pain Point:** Doesn't know what topics to prioritize.
- **Needs:** Upload syllabus, get an adaptive 3-day study plan, practice flashcards on weak spots.

---

## 11. User Pain Points
1. Generic LLMs hallucinate non-existent concepts not covered in class.
2. Manual flashcard and quiz creation takes hours.
3. Difficulty tracking which specific sub-topics are mastered vs weak.
4. No clear guidance on how to allocate daily study hours before exams.

---

## 12. Product Scope
The system encompasses document ingestion, vector storage, RAG Q&A, active recall generation (quizzes/flashcards), adaptive study scheduling, topic mastery tracking, and a real-time progress dashboard.

---

## 13. MVP Scope (14-Day Sprint)
- User Authentication (Supabase Auth: Email/Password).
- Subject & Course Creation (`FR-02`).
- PDF Material Upload (<15MB per file) & Text Extraction (`FR-03`, `FR-04`).
- RAG-powered Chatbot with Citation (`FR-05`, `AI-03`).
- Instant Summary Generation (`FR-06`, `AI-06`).
- MCQ Quiz Generation & Interactive Taking (`FR-07`, `AI-04`).
- Digital Flashcard Deck Generation (`FR-08`, `AI-05`).
- Study Plan Generator (`FR-09`, `AI-07`).
- Basic Dashboard & Weak Topic Identifier (`FR-11`, `FR-15`).

---

## 14. Future Scope (Post-Hackathon)
- Multi-modal document ingestion (OCR for handwritten notes, audio lecture transcription).
- Collaborative group study rooms & leaderboard.
- Mobile Application (React Native).
- Spaced repetition algorithm (Anki SM-2 integration).

---

## 15. Core Features (Requirement ID Tagged)
- **Auth & Profile:** `FR-01`
- **Course Workspace:** `FR-02`
- **Document Pipeline:** `FR-03`, `FR-04`, `AI-01`, `AI-02`
- **AI Chat & Citation:** `FR-05`, `FR-13`, `AI-03`
- **Summarizer:** `FR-06`, `AI-06`
- **Quiz Engine:** `FR-07`, `AI-04`
- **Flashcard Engine:** `FR-08`, `AI-05`
- **Planner:** `FR-09`, `AI-07`
- **Analytics & Weak Topics:** `FR-10`, `FR-11`, `FR-12`, `AI-08`
- **Activity & Dashboard:** `FR-14`, `FR-15`
- **Notifications:** `FR-16`

---

## 16. Functional Requirements Matrix

| Requirement ID | Feature Name | Description | Priority |
|---|---|---|---|
| `FR-01` | Auth & Profile | Register, login, session JWT management, and user profile updates. | MUST |
| `FR-02` | Subject Management | Create, read, update, delete (CRUD) subjects and assigned courses. | MUST |
| `FR-03` | Material Ingestion | Upload PDF/text materials (up to 15MB) per subject. | MUST |
| `FR-04` | Doc Processing Status | Asynchronous text extraction, chunking, embedding, and status polling. | MUST |
| `FR-05` | Grounded Document QA | Chat interface answering user questions using RAG with document citations. | MUST |
| `FR-06` | Document Summarizer | Generate key points, executive summaries, and formula lists from materials. | MUST |
| `FR-07` | Quiz Engine | Generate 5–10 MCQ questions with instant scoring and explanations. | MUST |
| `FR-08` | Flashcard Deck Engine | Generate flashcard decks with flip animations and self-grade scoring. | MUST |
| `FR-09` | Study Plan Generator | Generate structured day-by-day study schedules based on exam dates. | MUST |
| `FR-10` | Session Progress Log | Track study duration, quiz scores, completed materials, and daily streaks. | MUST |
| `FR-11` | Weak Topic Detector | Calculate topic mastery scores (<60% = Weak) based on quiz performance. | MUST |
| `FR-12` | Smart Recommendation | Recommend specific documents or quizzes based on weak topics. | SHOULD |
| `FR-13` | AI Tutor Chat Toggle | Switch tutor mode between "Document Grounded" and "General Knowledge". | MUST |
| `FR-14` | Study Activity History | View past chat transcripts, completed quizzes, and generated decks. | MUST |
| `FR-15` | Student Dashboard | Overview card widgets: recent documents, mastery radar, upcoming plans. | MUST |
| `FR-16` | Study Reminders | In-app notification alerts for daily scheduled study sessions. | COULD |

---

## 17. Non-Functional Requirements Matrix

| Requirement ID | Category | Metric / Constraint |
|---|---|---|
| `NFR-01` | Latency (RAG QA) | RAG Q&A response first token < 2.5s; total completion < 5.0s. |
| `NFR-02` | Latency (Upload) | PDF parsing & vector embedding processing < 10s for a 20-page document. |
| `NFR-03` | Reliability | System availability > 99.0% during hackathon demo period. |
| `NFR-04` | Cost Constraint | 100% operational on $0/month free-tier stack (Gemini API, Supabase, Render, Vercel). |
| `NFR-05` | Scalability | Support 50 concurrent active demo users without database connection exhaustion. |
| `NFR-06` | Security | JWT authentication, row-level security (RLS) on user data, sanitized inputs. |
| `NFR-07` | Usability / UI | Responsive design, modern dark/light aesthetic, zero layout shift (CLS < 0.1). |
| `NFR-08` | Data Privacy | User uploaded documents isolated per user ID; no data cross-leakage. |

---

## 18. User Stories
- **US-01 (`FR-03`, `FR-04`):** As a student, I want to upload my Operating Systems PDF slides so that the AI can answer questions directly from my professor's material.
- **US-02 (`FR-05`, `AI-03`):** As a student, I want answer citations pointing to exact page numbers so I can verify the AI's explanation against my slides.
- **US-03 (`FR-07`, `AI-04`):** As a student, I want to auto-generate a 10-question MCQ quiz from Unit 2 notes so I can test my knowledge before the midterm.
- **US-04 (`FR-09`, `AI-07`):** As a student, I want to input my exam date (10 days away) and get a daily breakdown of topics to cover so I don't cram last minute.
- **US-05 (`FR-11`, `AI-08`):** As a student, I want the dashboard to highlight my weak topics so I know where to spend my revision time.

---

## 19. User Journey
1. **Onboarding:** Sign up -> Create Subject ("Database Management Systems") -> Upload `Unit1_RelationalAlgebra.pdf`.
2. **Ingestion & Study:** System processes PDF -> Student opens AI Tutor Chat -> Asks "What is division operator in Relational Algebra?".
3. **Grounding:** AI responds with explanation + snippet citation from `Unit1_RelationalAlgebra.pdf`, Page 12.
4. **Assessment:** Student clicks "Generate Quiz" -> Takes 5 MCQs -> Scores 3/5 -> System marks "Relational Division" as Weak Topic.
5. **Planning & Action:** System recommends target flashcards and adjusts Study Schedule -> Student reviews flashcards.

---

## 20. End-to-End Product Flow
```
[User Registration/Login]
        │
        ▼
[Create Subject / Select Course]
        │
        ▼
[Upload Study Material (PDF/Text)] ──► [Background Extraction, Chunking & Vector Embedding]
        │                                                     │
        ├─────────────────────────────────────────────────────┘
        ▼
[Interactive Study Hub]
   ├── 1. AI Tutor Q&A (RAG + Source Page Citation)
   ├── 2. Summary & Formula Sheet Generator
   ├── 3. Auto MCQ Quiz Generator & Taking Interface
   ├── 4. Interactive Flashcard Deck Review
   └── 5. Dynamic Study Schedule Planner
        │
        ▼
[Automated Evaluation & Scoring] ──► Updates Topic Mastery (<60% = Weak Topic)
        │
        ▼
[Dashboard Analytics & Recommendations]
```

---

## 21. AI Features Matrix

| AI Feature ID | Feature Name | Processing Pipeline | Target Model / Tech |
|---|---|---|---|
| `AI-01` | PDF Extraction & Hybrid Chunking | PyPDF extraction + Recursive Character Splitter (500 char chunk, 50 char overlap). | Python `pdfplumber`/`PyPDF2` |
| `AI-02` | Dense Vector Embedding | Generate 768-dim embeddings per chunk; store with HNSW index. | Google `text-embedding-004` / `pgvector` |
| `AI-03` | Context-Grounded RAG QA | Cosine search top-k (k=4) chunks -> Insert into System Prompt -> Stream Response. | Gemini 1.5 Flash API |
| `AI-04` | Structured Quiz Generator | Prompt LLM with chunk context -> Enforce strict Pydantic JSON schema output for MCQs. | Gemini 1.5 Flash (JSON Mode) |
| `AI-05` | Flashcard Deck Generator | Extract key terms & definitions -> Output JSON card deck array (Front/Back/Hint). | Gemini 1.5 Flash (JSON Mode) |
| `AI-06` | Multi-Level Summarizer | Hierarchical Map-Reduce summary over chunks -> Output Key Takeaways & Formula List. | Gemini 1.5 Flash |
| `AI-07` | Adaptive Study Schedule Generator | Input target exam date, weak topics, and daily available hours -> Output structured plan. | Gemini 1.5 Flash + Rule Heuristic |
| `AI-08` | Weak Topic & Recommendation Engine | Calculate moving average of quiz scores per topic tag; recommend low-score topics. | Rule-assisted Python Logic + LLM |

---

## 22–36. Detailed Feature Specifications

### 25. Document Upload Requirements (`FR-03`, `FR-04`, `AI-01`)
- **Purpose:** Allow users to upload PDF notes and slides for RAG indexing.
- **User:** Registered Student.
- **Input:** File upload (`.pdf`, `.txt`, max 15MB).
- **Processing:** Async API job -> PDF text extraction -> Metadata enrichment (page numbers) -> Chunking -> Vector embedding generation -> Store in `document_chunks` table (`pgvector`).
- **Output:** Processing status (`PENDING` -> `COMPLETED`), chunk count, ready confirmation.
- **Acceptance Criteria:** Uploading a 20-page PDF parses within 10s, creates embeddings, and updates status to `COMPLETED` without UI freeze.

### 26. Chat/Tutor Requirements (`FR-05`, `FR-13`, `AI-03`)
- **Purpose:** Interactive conversational assistant grounded in uploaded study material.
- **User:** Registered Student.
- **Input:** Natural language query, selected subject/document scope, tutor mode toggle.
- **Processing:** Embed query -> Vector search top-4 chunks -> Construct prompt with system instructions -> Call Gemini 1.5 Flash -> Stream answer with citation metadata.
- **Output:** Markdown answer text, collapsible source citation pills (Document Name, Page Number, Match Score).
- **Acceptance Criteria:** Query returns grounded response in <2.5s; citation pill when clicked displays exact source text excerpt.

### 27. Quiz Requirements (`FR-07`, `AI-04`)
- **Purpose:** Automated self-assessment from uploaded materials.
- **User:** Registered Student.
- **Input:** Document/Subject ID, desired question count (5 or 10), difficulty level.
- **Processing:** Fetch document chunks -> LLM structured JSON generation -> Create `quizzes` and `quiz_questions` records.
- **Output:** Interactive quiz UI with radio-button MCQs, instant submission, detailed explanation for wrong answers.
- **Acceptance Criteria:** Quiz generates valid 5 MCQs in <4s; submission instantly updates student's `topic_mastery` table.

### 28. Flashcard Requirements (`FR-08`, `AI-05`)
- **Purpose:** Rapid active-recall review deck.
- **User:** Registered Student.
- **Input:** Topic/Document selection.
- **Processing:** LLM extracts key terms/definitions into JSON array -> Insert into `flashcards` table.
- **Output:** Flip-card UI (Question/Term on Front, Answer/Definition on Back) with "Easy / Medium / Hard" self-assessment buttons.
- **Acceptance Criteria:** Flashcards flip smoothly; clicking self-assessment rating logs review timestamp and performance score.

### 29. Study Plan Requirements (`FR-09`, `AI-07`)
- **Purpose:** Generate a structured preparation schedule leading up to an exam.
- **User:** Registered Student.
- **Input:** Subject ID, Exam Date, Daily Study Hours capacity.
- **Processing:** Aggregate subject topics, current mastery scores, and days remaining -> Prompt LLM to produce day-by-day task checklist -> Store in `study_plans`.
- **Output:** Visual calendar / daily task list with completion checkboxes.
- **Acceptance Criteria:** Plan allocates extra revision sessions for topics flagged as weak (<60% mastery).

---

## 37. Success Metrics & Key Performance Indicators (KPIs)
1. **RAG Grounding Accuracy:** >90% of user queries produce accurate answers directly supported by document citations.
2. **Quiz Generation Speed:** <4 seconds for a 5-question MCQ generation.
3. **User Engagement:** Average study session length >20 minutes.
4. **Hackathon Score:** Zero runtime crashes, 100% demo scenario completion.

---

## 38. Acceptance Criteria Summary
- All 16 Functional Requirements (`FR-01` to `FR-16`) testable with explicit pass/fail logic.
- Zero paid API subscriptions required to run the full application suite.
- Clean responsive layout tested on 1920x1080 desktop and 375x667 mobile viewports.

---

## 39–41. Constraints, Assumptions & Risks
- **Constraint:** Solo developer with 14 days before hackathon presentation; strict zero-budget ($0) free-tier constraint.
- **Assumption:** User uploads valid, readable PDF documents (non-scanned or readable text PDFs).
- **Risk:** Gemini API rate limit hit during judge demo (15 requests/min limit).
- **Mitigation:** Implement aggressive local database caching (`query_cache` / vector cache) so demo questions hit local cache instantly (<100ms response).

---

## 42. Future Roadmap
- **Phase 1 (Days 1–14):** Core MVP launch for Hackathon (RAG Q&A, Quizzes, Flashcards, Study Plan, Dashboard).
- **Phase 2 (Month 1 post-demo):** Multi-modal OCR for handwritten lecture notes and diagram understanding.
- **Phase 3 (Month 3 post-demo):** Social study groups, peer quiz battles, and Anki SM-2 export integration.
