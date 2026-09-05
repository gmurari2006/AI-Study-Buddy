import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ConversationCreateRequest(BaseModel):
    subject_id: uuid.UUID
    title: str | None = Field(default="Study Session", max_length=255)


class ConversationResponse(BaseModel):
    id: uuid.UUID
    subject_id: uuid.UUID
    user_id: uuid.UUID
    title: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CitationItem(BaseModel):
    material_id: uuid.UUID
    file_name: str
    page_number: int
    snippet: str
    similarity_score: float


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_type: str  # 'user' or 'assistant'
    content: str
    citations: list[dict[str, Any]] | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatQueryRequest(BaseModel):
    subject_id: uuid.UUID
    conversation_id: uuid.UUID
    query: str = Field(..., min_length=1)
    grounded_mode: bool = True
