# DOCUMENT 05 — API Specification

## 1. API Architecture & Standards
The **AI Study Buddy API** is built as a RESTful web service using **Python FastAPI**. It communicates over HTTPS using standard JSON payloads, HTTP status codes, and JSON Web Token (JWT) Bearer authentication issued by Supabase Auth.

- **Base URL:** `https://api.aistudybuddy.demo/api/v1`
- **Authentication Header:** `Authorization: Bearer <supabase_jwt_token>`
- **Content-Type:** `application/json` (except file upload endpoints which use `multipart/form-data`)

---

## 2. API Endpoint Modules Overview

| Module Name | Base Path | Description | Implemented Requirements |
|---|---|---|---|
| **Auth & User** | `/auth`, `/users` | Token verification and profile management. | `FR-01` |
| **Subjects & Courses** | `/subjects` | CRUD operations for subjects and topics. | `FR-02` |
| **Study Materials** | `/documents` | PDF upload, text extraction, & processing status. | `FR-03`, `FR-04`, `AI-01`, `AI-02` |
| **AI Chat & RAG** | `/chat` | RAG Q&A streaming and conversation history. | `FR-05`, `FR-13`, `AI-03`, `FR-14` |
| **Summarizer** | `/summaries` | Generate document & topic summaries. | `FR-06`, `AI-06` |
| **Quiz Engine** | `/quizzes` | MCQ quiz generation, taking, & scoring. | `FR-07`, `AI-04` |
| **Flashcard Decks** | `/flashcards` | Flashcard generation & deck review logging. | `FR-08`, `AI-05` |
| **Study Planner** | `/planner` | Adaptive study schedule generation & tasks. | `FR-09`, `AI-07` |
| **Notifications** | `/notifications` | User alerts, study reminders, & read status. | `FR-16` |
| **Analytics & Mastery** | `/analytics` | Progress tracking, weak topic identification, & recommendations. | `FR-10`, `FR-11`, `FR-12`, `AI-08` |
| **Dashboard** | `/dashboard` | Aggregated widgets and activity summary. | `FR-15` |

---

## 3. Detailed Endpoint Specifications

### 3.1 Authentication & User Module (`FR-01`)

#### GET `/users/me`
- **Purpose:** Fetch current authenticated user profile metadata.
- **Auth Required:** Yes (Bearer JWT)
- **Response `200 OK`:**
```json
{
  "id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  "email": "alex.cse@university.edu",
  "full_name": "Alex Student",
  "academic_year": "3rd Year CSE",
  "created_at": "2026-09-01T10:00:00Z"
}
```

---

### 3.2 Subjects Module (`FR-02`)

#### POST `/subjects`
- **Purpose:** Create a new study subject/course.
- **Auth Required:** Yes
- **Request Body:**
```json
{
  "name": "Database Management Systems",
  "code": "CS302",
  "color_code": "#4F46E5"
}
```
- **Response `201 Created`:**
```json
{
  "id": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
  "name": "Database Management Systems",
  "code": "CS302",
  "color_code": "#4F46E5",
  "created_at": "2026-09-05T12:00:00Z"
}
```

---

### 3.3 Study Materials & Document Processing Module (`FR-03`, `FR-04`, `AI-01`, `AI-02`)

#### POST `/documents/upload`
- **Purpose:** Upload PDF study material for processing.
- **Auth Required:** Yes
- **Content-Type:** `multipart/form-data`
- **Form Data Parameters:**
  - `subject_id` (UUID, required): Target subject ID.
  - `file` (File Binary, required): PDF file (max 15MB).
- **Response `202 Accepted`:**
```json
{
  "material_id": "f8d7c6b5-a432-10fe-dcba-9876543210fe",
  "file_name": "Unit1_RelationalAlgebra.pdf",
  "status": "PROCESSING",
  "message": "File uploaded successfully. Ingestion pipeline initiated."
}
```

#### GET `/documents/{material_id}/status`
- **Purpose:** Poll document ingestion & embedding status.
- **Auth Required:** Yes
- **Response `200 OK`:**
```json
{
  "material_id": "f8d7c6b5-a432-10fe-dcba-9876543210fe",
  "status": "COMPLETED",
  "page_count": 18,
  "chunks_created": 42,
  "error_message": null
}
```

---

### 3.4 AI Chat & RAG Grounded QA Module (`FR-05`, `FR-13`, `AI-03`)

#### POST `/chat/query`
- **Purpose:** Submit a question to the AI tutor with document grounding.
- **Auth Required:** Yes
- **Request Body:**
```json
{
  "subject_id": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
  "conversation_id": "e9f8e7d6-c5b4-a321-0fed-cba987654321",
  "query": "What is the difference between primary key and candidate key?",
  "grounded_mode": true
}
```
- **Response `200 OK` (Server-Sent Events / Stream or Standard JSON):**
```json
{
  "message_id": "m1112223-3344-5566-7788-9900aabbccdd",
  "content": "A Candidate Key is a column or set of columns that can uniquely identify a row in a table. A Primary Key is a specific candidate key chosen by the database designer as the principal identifier.\n\nSource: [Unit1_RelationalAlgebra.pdf, Page 8]",
  "sender_type": "assistant",
  "citations": [
    {
      "file_name": "Unit1_RelationalAlgebra.pdf",
      "page_number": 8,
      "snippet": "Candidate key is a minimal superkey. Primary key is selected from candidate keys.",
      "similarity_score": 0.89
    }
  ]
}
```

---

### 3.5 Summarizer Module (`FR-06`, `AI-06`)

#### POST `/summaries/generate`
- **Purpose:** Generate summary and formula sheet for a document.
- **Auth Required:** Yes
- **Request Body:**
```json
{
  "material_id": "f8d7c6b5-a432-10fe-dcba-9876543210fe",
  "summary_type": "KEY_POINTS_AND_FORMULAS"
}
```
- **Response `200 OK`:**
```json
{
  "material_id": "f8d7c6b5-a432-10fe-dcba-9876543210fe",
  "executive_summary": "This document covers relational database concepts, relational algebra operators, and key constraints.",
  "key_takeaways": [
    "Selection ($\sigma$) filters rows based on a predicate.",
    "Projection ($\pi$) selects specific columns.",
    "Join ($\bowtie$) combines related tuples from two relations."
  ],
  "formula_index": [
    "$\sigma_{condition}(Relation)$",
    "$\pi_{attributes}(Relation)$"
  ]
}
```

---

### 3.6 Quiz Engine Module (`FR-07`, `AI-04`)

#### POST `/quizzes/generate`
- **Purpose:** Auto-generate an MCQ practice quiz from subject materials.
- **Auth Required:** Yes
- **Request Body:**
```json
{
  "subject_id": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
  "total_questions": 5,
  "topic_filter": "Relational Algebra"
}
```
- **Response `201 Created`:**
```json
{
  "quiz_id": "q9988776-6554-4332-2110-ffeeddccbbaa",
  "title": "Relational Algebra Practice Quiz",
  "total_questions": 5,
  "questions": [
    {
      "id": "q1-uuid",
      "question_text": "Which relational algebra operator is used to select rows matching a condition?",
      "options": ["Projection (π)", "Selection (σ)", "Cartesian Product (×)", "Join (⋈)"],
      "topic_tag": "Relational Algebra"
    }
  ]
}
```

#### POST `/quizzes/{quiz_id}/submit`
- **Purpose:** Submit quiz responses and calculate mastery scores.
- **Auth Required:** Yes
- **Request Body:**
```json
{
  "answers": [
    {"question_id": "q1-uuid", "selected_option_index": 1}
  ]
}
```
- **Response `200 OK`:**
```json
{
  "quiz_id": "q9988776-6554-4332-2110-ffeeddccbbaa",
  "score_achieved": 5,
  "total_score": 5,
  "percentage_score": 100.0,
  "feedback": "Outstanding! You demonstrated full mastery of Relational Algebra operators.",
  "mastery_updates": [
    {"topic_name": "Relational Algebra", "new_mastery_score": 0.85, "status": "MASTERED"}
  ]
}
```

---

### 3.7 Notifications Module (`FR-16`)

#### GET `/notifications`
- **Purpose:** List user alerts, study reminders, and weak-topic notifications.
- **Auth Required:** Yes
- **Query Parameters:**
  - `unread_only` (boolean, optional, default: false): Filter by unread status.
- **Response `200 OK`:**
```json
{
  "total_count": 2,
  "unread_count": 1,
  "notifications": [
    {
      "id": "n1002003-0040-0500-0600-070008000900",
      "title": "Study Reminder: DBMS Midterm Exam",
      "message": "You have scheduled 2 hours to review Relational Division today.",
      "notification_type": "REMINDER",
      "is_read": false,
      "link_url": "/planner",
      "created_at": "2026-09-05T08:00:00Z"
    }
  ]
}
```

#### PATCH `/notifications/{notification_id}/read`
- **Purpose:** Mark a specific notification as read.
- **Auth Required:** Yes
- **Response `200 OK`:**
```json
{
  "id": "n1002003-0040-0500-0600-070008000900",
  "is_read": true,
  "updated_at": "2026-09-05T12:00:00Z"
}
```

---

### 3.8 Analytics & Mastery Module (`FR-10`, `FR-11`, `FR-12`, `AI-08`)

#### GET `/analytics/sessions`
- **Purpose:** Fetch historical study session logs, total study time, and activity breakdown.
- **Auth Required:** Yes
- **Query Parameters:**
  - `subject_id` (UUID, optional): Filter sessions by specific subject.
  - `days` (integer, optional, default: 7): Number of past days to include.
- **Response `200 OK`:**
```json
{
  "total_study_minutes": 340,
  "total_sessions": 12,
  "daily_streak_days": 5,
  "activity_breakdown": {
    "RAG_CHAT": 150,
    "QUIZ": 90,
    "FLASHCARDS": 60,
    "SUMMARY": 40
  },
  "sessions": [
    {
      "id": "s1122-uuid",
      "subject_name": "Database Management Systems",
      "activity_type": "QUIZ",
      "duration_minutes": 25,
      "created_at": "2026-09-05T11:00:00Z"
    }
  ]
}
```

#### GET `/analytics/weak-topics`
- **Purpose:** Retrieve list of topics flagged as WEAK (`mastery_score < 0.60`) computed via Exponential Moving Average.
- **Auth Required:** Yes
- **Query Parameters:**
  - `subject_id` (UUID, optional): Filter by subject ID.
- **Response `200 OK`:**
```json
{
  "weak_topic_count": 2,
  "weak_topics": [
    {
      "id": "tm1-uuid",
      "subject_id": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "subject_name": "Database Management Systems",
      "topic_name": "Relational Division",
      "mastery_score": 0.45,
      "status_flag": "WEAK",
      "last_updated": "2026-09-04T18:00:00Z"
    },
    {
      "id": "tm2-uuid",
      "subject_id": "c9a8b7c6-d5e4-3f2a-1b0c-9d8e7f6a5b4c",
      "subject_name": "Operating Systems",
      "topic_name": "Banker's Algorithm",
      "mastery_score": 0.52,
      "status_flag": "WEAK",
      "last_updated": "2026-09-03T14:30:00Z"
    }
  ]
}
```

#### GET `/analytics/recommendations`
- **Purpose:** Fetch personalized study recommendations based on weak topics and upcoming exam deadlines.
- **Auth Required:** Yes
- **Response `200 OK`:**
```json
{
  "recommendations": [
    {
      "id": "rec-1",
      "type": "PRACTICE_QUIZ",
      "title": "Practice Quiz: Relational Division",
      "description": "Your mastery score in Relational Division is 45%. Solve 5 practice MCQs to improve.",
      "target_url": "/quizzes?topic=RelationalDivision",
      "priority": "HIGH"
    },
    {
      "id": "rec-2",
      "type": "DOCUMENT_REVIEW",
      "title": "Review Slide 14: Banker's Algorithm",
      "description": "Examine Unit 3 OS slides to clarify deadlock avoidance concepts.",
      "target_url": "/tutor?subject=OS&page=14",
      "priority": "MEDIUM"
    }
  ]
}
```

---

### 3.9 Study Planner & Dashboard Modules (`FR-09`, `FR-15`, `AI-07`)

#### POST `/planner/generate`
- **Purpose:** Generate an adaptive day-by-day exam preparation schedule.
- **Auth Required:** Yes
- **Request Body:**
```json
{
  "subject_id": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
  "exam_name": "DBMS Midterm Exam",
  "target_exam_date": "2026-09-15",
  "daily_hours_allocated": 2.0
}
```
- **Response `201 Created`:**
```json
{
  "plan_id": "p1122334-4556-6778-8990-aabbccddeeff",
  "exam_name": "DBMS Midterm Exam",
  "days_remaining": 10,
  "tasks": [
    {
      "id": "t1-uuid",
      "scheduled_date": "2026-09-06",
      "topic_title": "Review Weak Topic: Relational Division",
      "task_description": "Read Unit 1 slides Page 12-14 and solve 5 flashcards.",
      "is_completed": false
    }
  ]
}
```

#### GET `/dashboard/summary`
- **Purpose:** Fetch aggregated stats, weak topics, and active tasks for landing dashboard.
- **Auth Required:** Yes
- **Response `200 OK`:**
```json
{
  "total_subjects": 4,
  "total_documents_uploaded": 12,
  "study_streak_days": 5,
  "weak_topics": [
    {"subject_name": "DBMS", "topic_name": "Relational Division", "mastery_score": 0.45},
    {"subject_name": "Operating Systems", "topic_name": "Banker's Algorithm", "mastery_score": 0.52}
  ],
  "upcoming_tasks": [
    {"task_id": "t1-uuid", "subject_name": "DBMS", "title": "Review Relational Division", "due_date": "2026-09-06"}
  ]
}
```

---

## 4. Error Responses & Format Standard
All API endpoints return errors following standard RFC 7807 JSON error structure:

```json
{
  "error_code": "RESOURCE_NOT_FOUND",
  "message": "Subject with ID 'c1a2b3c4...' was not found or does not belong to the user.",
  "status_code": 404,
  "timestamp": "2026-09-05T12:30:00Z"
}
```

| HTTP Status Code | Meaning | Example Trigger |
|---|---|---|
| `400 Bad Request` | Invalid payload or unsupported file type | Uploading a `.docx` file instead of `.pdf` |
| `401 Unauthorized` | Missing or invalid Bearer JWT | Token expired or missing header |
| `403 Forbidden` | Accessing resource owned by another user | Fetching another student's document |
| `404 Not Found` | Entity ID does not exist | Invalid `subject_id` |
| `429 Too Many Requests` | Gemini API rate limit hit | >15 requests/minute limit reached |
| `500 Internal Error` | Unhandled backend exception | Database connection drop |
