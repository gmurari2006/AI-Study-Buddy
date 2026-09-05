# DOCUMENT 06 — Testing & Evaluation Plan

## 1. Testing Strategy
The quality assurance strategy for **AI Study Buddy** follows a multi-tiered approach ensuring functional reliability, API security, RAG retrieval accuracy, and system performance within the 14-day hackathon sprint timeline. Automated unit and API integration tests are built using `pytest` for the FastAPI backend and `Playwright` for frontend end-to-end user flows.

---

## 2–14. Testing Levels & Domain Coverage

```
               /  E2E UI Tests (Playwright)  \
              /-------------------------------\
             /   AI & RAG Benchmarking (Ragas) \
            /-----------------------------------\
           /   Integration & API Tests (pytest)  \
          /---------------------------------------\
         / Unit Tests (Python pytest / Jest React) \
```

### Key Domain Testing Coverage:
- **Authentication (`FR-01`):** Verify JWT token validity, expiration handling, and Row Level Security isolation between user accounts.
- **File Ingestion (`FR-03`, `FR-04`):** Test PDF extraction edge cases (scanned documents, large 15MB files, empty pages).
- **RAG & Citation Grounding (`AI-02`, `AI-03`):** Benchmark retrieval accuracy (Cosine Similarity Top-k) and citation page precision.
- **Summarizer Engine (`FR-06`, `AI-06`):** Benchmark document map-reduce summary generation and formula cheat sheet extraction.
- **LLM Schema Enforcement (`AI-04`, `AI-05`):** Validate JSON response parsing for quiz and flashcard endpoints.
- **Mastery Analytics (`FR-11`, `AI-08`):** Verify score calculation using the Exponential Moving Average formula.
- **Notifications (`FR-16`):** Validate pending alert fetching and mark-as-read status updates.

---

## 15. AI Evaluation & RAG Metrics Framework

| Evaluation Metric | Target Threshold | Evaluation Method / Tool | Operational Definition |
|---|---|---|---|
| **Retrieval Precision @ k=4** | $\ge 85\%$ | Manual Ground Truth Dataset (20 Queries) | Ratio of retrieved chunks relevant to prompt context. |
| **Context Recall** | $\ge 80\%$ | Benchmark Query Suite | Ratio of required ground-truth facts retrieved in top-k chunks. |
| **Faithfulness Score (Ragas)** | $\ge 90\%$ | Automated Ragas Evaluation Framework | Percentage of claims in answer derived *strictly* from retrieved chunks. |
| **Answer Relevance** | $\ge 88\%$ | Embedding Cosine Distance (Query vs Answer) | Semantic closeness of generated answer to user query intent. |
| **JSON Schema Adherence** | $100\%$ | Pydantic Parser Validation | Zero JSON syntax parsing errors on quiz/flashcard outputs. |
| **End-to-End Latency** | $< 2.5\text{s}$ (First Token) | FastAPI Middleware Stopwatch Logging | Elapsed time from query POST to response stream initiation. |

---

## 19. Comprehensive Test Case Matrix

| Test ID | Requirement ID | Test Scenario | Input Data | Expected Result | Pass / Fail Criteria |
|---|---|---|---|---|---|
| `TC-AUTH-01` | `FR-01` | User registration with valid email & password. | Email: `test@student.edu`, Pass: `Secure123!` | Account created; JWT returned; HTTP 201. | JWT token is valid & decodes user ID. |
| `TC-AUTH-02` | `FR-01`, `NFR-06` | Access subject endpoint without Bearer JWT. | Header: `Authorization: None` | HTTP 401 Unauthorized error response. | Response status = 401. |
| `TC-DOC-01` | `FR-03`, `FR-04`, `NFR-02` | Upload 10-page valid PDF document. | File: `DBMS_Unit1.pdf` (2.4 MB) | Upload accepted; Status transitions `PENDING` -> `COMPLETED` in <10s. | `document_chunks` table contains >20 rows with non-null 768-dim embeddings. |
| `TC-DOC-02` | `FR-03` | Upload unsupported file type. | File: `notes.docx` | HTTP 400 Bad Request error. | Status = 400 with message "Only PDF files allowed". |
| `TC-DOC-03` | `FR-03` | Upload file exceeding size limit. | File: `large_book.pdf` (18.5 MB) | HTTP 400 Payload Too Large. | Upload rejected before backend storage. |
| `TC-RAG-01` | `FR-05`, `AI-03` | Grounded question answering with relevant PDF. | Query: "What is B+ Tree degree?" (DBMS subject) | Markdown answer containing inline page citation pill. | Citation pill displays exact file name & page number; no hallucinated facts. |
| `TC-RAG-02` | `FR-05`, `AI-03` | Ask question not present in uploaded PDF. | Query: "What is Quantum Physics?" (DBMS subject) | Fallback answer: "I could not find a direct answer in your uploaded materials." | System avoids hallucination and states lack of context. |
| `TC-SUM-01` | `FR-06`, `AI-06` | Document summary & formula sheet generation. | MaterialID: `DBMS_Unit1.pdf` | Executive summary, key takeaways, & formula index returned in <5s. | Summary text compresses document to ~15% length; valid LaTeX formulas. |
| `TC-QUIZ-01` | `FR-07`, `AI-04` | Generate 5-question MCQ practice quiz. | SubjectID, `total_questions=5` | Valid JSON response with 5 MCQs, options, correct index, & explanations. | All 5 questions parse cleanly into Pydantic schema without error. |
| `TC-QUIZ-02` | `FR-07`, `FR-11` | Submit quiz answers and verify topic mastery update. | 4/5 answers correct on "Relational Algebra" | Quiz score 80%; `topic_mastery` score recalculated via EMA formula. | `mastery_score` increases; status flag updated to `MASTERED`. |
| `TC-CARD-01` | `FR-08`, `AI-05` | Generate digital flashcards deck. | SubjectID, MaterialID | Array of card objects with `front_text`, `back_text`, and `difficulty_rating`. | Deck created with >5 card pairs. |
| `TC-PLAN-01` | `FR-09`, `AI-07` | Generate adaptive study schedule for 10-day timeline. | Exam Date: +10 days, SubjectID | Daily task checklist allocated across 10 days, prioritizing weak topics. | Weak topics scheduled on Days 1–3; review on Day 9–10. |
| `TC-NOTIF-01`| `FR-16` | Fetch pending notifications & mark as read. | User JWT, NotificationID | Returns list of unread alerts; PATCH sets `is_read = true`. | Status 200 OK; `unread_count` decrements by 1. |
| `TC-PERF-01` | `NFR-01` | Benchmark RAG Q&A response latency. | 10 concurrent chat query requests | Average response start time < 2.5 seconds. | 95th percentile latency < 3.5s. |
| `TC-PERF-02` | `NFR-05` | Database connection stress test. | 50 concurrent API ping requests | DB handles requests cleanly without connection pool exhaustion. | Zero HTTP 500 errors; pool size managed cleanly. |
| `TC-REL-01` | `NFR-03` | API availability & error resilience test. | 100 sequential requests over 10 minutes | >99.0% successful responses (HTTP 200/201). | Graceful API degradation during simulated model rate limits. |
| `TC-UI-01` | `NFR-07` | Responsive UI layout & CLS benchmarking. | Desktop (1080p) & Mobile (375px) viewports | Responsive rendering; Zero layout shifts (CLS < 0.1). | All widgets accessible without horizontal scrolling on mobile. |
| `TC-SEC-01` | `NFR-08`, `NFR-06` | Attempt cross-user document data retrieval. | User A token querying User B document ID | HTTP 403 Forbidden or empty RAG search result. | RLS & `subject_id` isolation prevents data leakage. |

---

## 16. Edge Cases & Handling
1. **Empty PDF Pages:** Pages containing only images/diagrams without OCR text -> Ingestion engine flags page as `[NO_TEXT_EXTRACTED]` without breaking chunking pipeline.
2. **Special LaTeX Formula Characters:** Questions containing `$`, `\`, `_` -> Escaped properly in Pydantic serialization to avoid breaking frontend KaTeX rendering.
3. **API Rate Limit (Gemini 429):** Tested by mocking HTTP 429 response -> Backend executes exponential backoff retry up to 3 attempts before returning graceful cached response.
