from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class FlashcardGenerateRequest(BaseModel):
    subject_id: UUID
    material_id: UUID | None = None
    total_cards: int = Field(default=5, ge=1, le=20)


class FlashcardItem(BaseModel):
    id: UUID
    deck_id: UUID
    front_text: str
    back_text: str
    difficulty_rating: Literal["EASY", "MEDIUM", "HARD"] = "MEDIUM"
    last_reviewed_at: datetime | None = None

    class Config:
        from_attributes = True


class FlashcardDeckResponse(BaseModel):
    deck_id: UUID
    title: str
    subject_id: UUID
    card_count: int
    created_at: datetime
    cards: list[FlashcardItem]

    class Config:
        from_attributes = True


class FlashcardDeckSummaryResponse(BaseModel):
    id: UUID
    subject_id: UUID
    title: str
    card_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class FlashcardReviewRequest(BaseModel):
    difficulty_rating: Literal["EASY", "MEDIUM", "HARD"]
