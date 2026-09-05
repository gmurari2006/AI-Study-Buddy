import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class QuizGenerateRequest(BaseModel):
    subject_id: uuid.UUID = Field(..., description="ID of the subject to generate quiz for")
    total_questions: int = Field(default=5, ge=1, le=10, description="Total questions to generate (1-10)")
    topic_filter: str | None = Field(default=None, description="Optional topic filter")

    model_config = ConfigDict(from_attributes=True)


class QuizQuestionItem(BaseModel):
    id: uuid.UUID
    question_text: str
    options: list[str]
    topic_tag: str

    model_config = ConfigDict(from_attributes=True)


class QuizResponse(BaseModel):
    quiz_id: uuid.UUID
    title: str
    total_questions: int
    questions: list[QuizQuestionItem]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class QuizSummaryResponse(BaseModel):
    id: uuid.UUID
    subject_id: uuid.UUID
    title: str
    total_questions: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class QuestionAnswerSubmission(BaseModel):
    question_id: uuid.UUID
    selected_option_index: int = Field(..., ge=0, le=3)


class QuizSubmitRequest(BaseModel):
    answers: list[QuestionAnswerSubmission]


class QuestionResultItem(BaseModel):
    question_id: uuid.UUID
    question_text: str
    options: list[str]
    selected_option_index: int
    correct_option_index: int
    is_correct: bool
    explanation: str
    topic_tag: str


class QuizSubmitResponse(BaseModel):
    quiz_id: uuid.UUID
    score_achieved: int
    total_score: int
    percentage_score: float
    feedback: str
    question_results: list[QuestionResultItem]
