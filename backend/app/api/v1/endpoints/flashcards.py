from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.auth import get_current_user
from app.db.session import get_db
from app.models.user import UserProfile
from app.schemas.flashcard import (
    FlashcardDeckResponse,
    FlashcardDeckSummaryResponse,
    FlashcardGenerateRequest,
    FlashcardItem,
    FlashcardReviewRequest,
)
from app.services.flashcard_service import FlashcardService

router = APIRouter()


@router.post(
    "/generate",
    response_model=FlashcardDeckResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a grounded AI flashcard deck for a subject",
)
async def generate_flashcard_deck(
    payload: FlashcardGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> FlashcardDeckResponse:
    return await FlashcardService.generate_deck(
        db=db,
        payload=payload,
        current_user=current_user,
    )


@router.get(
    "/subject/{subject_id}",
    response_model=list[FlashcardDeckSummaryResponse],
    summary="List all flashcard decks for a subject",
)
async def list_subject_flashcard_decks(
    subject_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[FlashcardDeckSummaryResponse]:
    return await FlashcardService.list_subject_decks(
        db=db,
        subject_id=subject_id,
        current_user=current_user,
    )


@router.get(
    "/deck/{deck_id}",
    response_model=FlashcardDeckResponse,
    summary="Get flashcard deck details and all card items",
)
async def get_flashcard_deck(
    deck_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> FlashcardDeckResponse:
    return await FlashcardService.get_deck_by_id(
        db=db,
        deck_id=deck_id,
        current_user=current_user,
    )


@router.post(
    "/card/{card_id}/review",
    response_model=FlashcardItem,
    summary="Log self-grade review rating for a flashcard",
)
async def review_flashcard(
    card_id: UUID,
    payload: FlashcardReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> FlashcardItem:
    return await FlashcardService.review_card(
        db=db,
        card_id=card_id,
        payload=payload,
        current_user=current_user,
    )
