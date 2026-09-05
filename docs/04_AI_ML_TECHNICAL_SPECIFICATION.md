# DOCUMENT 04 — AI/ML Technical Specification

## 1. AI/ML Overview
This document specifies the Artificial Intelligence and Machine Learning architecture powering **AI Study Buddy**. The system relies on a hybrid pipeline combining dense vector Retrieval-Augmented Generation (RAG), Pydantic JSON-constrained LLM generation, and rule-assisted moving-average learning analytics.

---

## 2–3. AI Feature Map & Pipeline Architecture

| AI Feature ID | Feature Name | Algorithm / Model | Input Data | Output Data | Evaluation Metric |
|---|---|---|---|---|---|
| `AI-01` | Text Extraction & Chunking | PyPDF + Recursive Character Splitter | Raw PDF file | 500-char text chunks with page metadata | Chunking Integrity (no mid-word cuts) |
| `AI-02` | Vector Embedding | Google `gemini-embedding-001` (768-dim via MRL) | Text chunks / Queries | 768-dimensional float array | Cosine Retrieval Precision @ k=4 |
| `AI-03` | Grounded RAG Q&A | Gemini 3.6 Flash + Context Injection | Query + Top-4 Chunks | Grounded markdown answer with page citations | Grounding Faithfulness Score (>90%) |
| `AI-04` | Quiz Generation | Gemini 3.6 Flash (Structured JSON Mode) | Document Chunks | 5 MCQs (Questions, Options, Correct, Explanation) | Schema Compliance (100% valid JSON) |
| `AI-05` | Flashcard Generator | Gemini 3.6 Flash (Structured JSON Mode) | Key concept text | Card pairs Array (Front, Back, Hint) | Term Extraction Accuracy (>85%) |
| `AI-06` | Document Summarizer | Hierarchical Map-Reduce Prompting | Document Chunks | Executive summary + Formula Cheat Sheet | Compression Ratio (~15% of original size) |
| `AI-07` | Study Schedule Planner | Prompt-engineered LLM + Calendar Logic | Exam Date + Weak Topics | Day-by-day task checklist array | Schedule Feasibility Rate |
| `AI-08` | Weak Topic & Rec Engine | Exponential Moving Average + Rule Engine | Quiz score history | Mastery Score (0–1.0) & Targeted Recommendations | Precision of Weak Topic Identification |

---

## 4–7. Model Selection & Strategy
- **LLM Choice:** **Google Gemini 3.6 Flash** API via `google-generativeai` SDK.
  - *Reasoning:* Sub-2s response latency, 1,000,000 token context window, native support for JSON schema enforcement via `response_mime_type="application/json"`, and generous free tier (15 RPM / 1,000,000 TPM / 1,500 RPD).
- **Embedding Model:** **Google `gemini-embedding-001`** (Matryoshka Representation Learning configured to 768 dimensions).
  - *Matryoshka Representation Learning (MRL) Configuration:* While `gemini-embedding-001` defaults to 3072 dimensions, it natively supports MRL vector truncation. All embedding API requests specify `output_dimensionality=768` to produce 768-dimensional float vectors. This maintains 100% compatibility with the existing PostgreSQL `document_chunks.embedding VECTOR(768)` column and HNSW vector index without requiring any database schema changes.
- **Vector Search Engine:** **`pgvector`** with HNSW (Hierarchical Navigable Small World) index using Cosine Distance (`<=>`).

---

## 8–15. RAG Pipeline & Document Processing Engine

```
[Raw PDF Document]
       │
       ▼  (pdfplumber / PyPDF)
[Clean Extracted Text per Page]
       │
       ▼  (RecursiveCharacterTextSplitter: chunk_size=500, overlap=50)
[Normalized Text Chunks + Page Number Metadata]
       │
       ▼  (Google gemini-embedding-001 API Batch Embedding with output_dimensionality=768)
[768-Dimensional Vector Embeddings]
       │
       ▼  (PostgreSQL pgvector Insert into document_chunks)
[HNSW Vector Indexing]
```

### Retrieval Strategy
1. **Query Embedding:** User question embedded via `gemini-embedding-001` (specifying `output_dimensionality=768`).
2. **Similarity Query:** Execute PostgreSQL vector search query:
   ```sql
   SELECT id, material_id, page_number, chunk_text, 
          1 - (embedding <=> :query_vector) AS similarity_score
   FROM document_chunks
   WHERE subject_id = :subject_id
   ORDER BY embedding <=> :query_vector ASC
   LIMIT 4;
   ```
3. **Threshold Filtering:** Filter out chunks with `similarity_score < 0.65` to avoid injecting noise into the LLM prompt context.

---

## 16–20. Prompt Engineering & Context Grounding Templates

### Context Grounding System Prompt (`AI-03`)
```text
SYSTEM PROMPT:
You are AI Study Buddy, an expert, encouraging academic tutor. 
Your job is to answer the student's question based strictly on the provided Context Chunks extracted from their uploaded study material.

RULES:
1. Base your answer ONLY on the provided Context Chunks. Do not hallucinate external facts.
2. If the context does not contain enough information to answer the question, state: "I could not find a direct answer in your uploaded materials."
3. Include inline page citations in your response using the format [Doc: {file_name}, Page: {page_number}].
4. Format mathematical equations using LaTeX inline ($E=mc^2$) or block format.

CONTEXT CHUNKS:
---
[Chunk 1 - Doc: Operating_Systems.pdf | Page 14]
Process synchronization is the task of coordinating the execution of processes such that no two processes can have access to the same shared data and resources simultaneously.

[Chunk 2 - Doc: Operating_Systems.pdf | Page 15]
A Critical Section is a code segment that accesses shared variables or resources. Semaphore is a synchronization tool.
---

USER QUESTION: {user_query}

GROUNDED ANSWER:
```

---

## 21. Quiz Generation Specification (`AI-04`)
- **JSON Schema Output Enforcement:**
```json
{
  "type": "object",
  "properties": {
    "quiz_title": {"type": "string"},
    "questions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "question_text": {"type": "string"},
          "options": {
            "type": "array",
            "items": {"type": "string"},
            "minItems": 4,
            "maxItems": 4
          },
          "correct_option_index": {"type": "integer", "minimum": 0, "maximum": 3},
          "explanation": {"type": "string"},
          "topic_tag": {"type": "string"}
        },
        "required": ["question_text", "options", "correct_option_index", "explanation", "topic_tag"]
      }
    }
  },
  "required": ["quiz_title", "questions"]
}
```

---

## 22–24. Flashcards, Summaries & Study Plan Specifications (`AI-05`, `AI-06`, `AI-07`)
- **Flashcards (`AI-05`):** LLM extracts key terms and generates Front/Back key concept pairs with a difficulty hint.
- **Summarizer (`AI-06`):** Map-Reduce approach over all chunks for a document to construct an Executive Overview, Key Bullet Takeaways, and a Formula/Definition Index.
- **Study Planner (`AI-07`):** Takes `days_until_exam`, `subject_topics`, and `weak_topics` -> Prompts Gemini to return a day-by-day study schedule array prioritizing weak topics first.

---

## 25–28. Weak Topic Detection & Personalization Engine (`AI-08`)
- **Algorithmic Approach:** Uses an **Exponential Moving Average (EMA)** on quiz performance rather than pure LLM logic to guarantee mathematical consistency and zero hallucinations:
  $$\text{Mastery}_{new} = \alpha \cdot \text{Score}_{quiz} + (1 - \alpha) \cdot \text{Mastery}_{old}$$
  *(where smoothing factor $\alpha = 0.35$)*
- **Mastery Threshold Classification:**
  - `Mastery < 0.60` -> **WEAK TOPIC** (Flagged red on dashboard, injected into study plan priority).
  - `0.60 <= Mastery < 0.80` -> **NEUTRAL TOPIC**.
  - `Mastery >= 0.80` -> **MASTERED TOPIC**.

---

## 30–32. Model Evaluation & Quality Metrics
- **Retrieval Precision @ k=4:** $\ge 85\%$ (percentage of retrieved chunks relevant to prompt).
- **Answer Faithfulness (Ragas Metric):** $\ge 90\%$ (percentage of claims in LLM output verifiable against source chunks).
- **JSON Output Validity:** $100\%$ schema adherence (guaranteed via Gemini JSON mode).
- **Latency Requirement:** RAG response start token $< 2.5\text{s}$, total response completion $< 5.0\text{s}$.

---

## 33. Cost & Free-Tier Budget Analysis

| AI Component | API Call / Operation | Estimated Monthly Usage (Demo) | Cost per Unit | Total Monthly Cost |
|---|---|---|---|---|
| **Gemini 3.6 Flash (LLM)** | Q&A, Quizzes, Summaries | ~500 API calls | $0.00 (Free Tier: 15 RPM / 1M TPM / 1500 RPD) | **$0.00** |
| **Google gemini-embedding-001** | Document Chunk Embeddings | ~2,000 chunks embedded | $0.00 (Free Tier: 1,500 RPM / 1M TPM) | **$0.00** |
| **Vector Storage (pgvector)** | HNSW Vector Searches | ~1,000 queries | Hosted on Supabase Free Tier | **$0.00** |
| **Total Estimated Cost** | — | — | — | **$0.00 / month** |

---

## 34–35. Privacy & AI Failure Handling
- **Data Isolation:** Every RAG vector search query explicitly includes `WHERE subject_id IN (SELECT id FROM subjects WHERE user_id = :current_user_id)` to prevent cross-user document leakage.
- **API Failure Fallback:** If Gemini API fails or encounters HTTP 429 rate limit:
  1. Retry with exponential backoff (1s, 2s).
  2. Fall back to in-memory cached responses for common demo queries.
  3. Display a graceful UI alert: *"AI Study Buddy is experiencing high demand. Retrying in a moment..."*
