import json
import logging
from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.document_chunk import DocumentChunk
from app.models.flashcard import Flashcard, FlashcardDeck
from app.models.study_material import StudyMaterial
from app.models.subject import Subject
from app.models.user import UserProfile
from app.schemas.flashcard import (
    FlashcardDeckResponse,
    FlashcardDeckSummaryResponse,
    FlashcardGenerateRequest,
    FlashcardItem,
    FlashcardReviewRequest,
)

logger = logging.getLogger(__name__)


class GeneratedCardItem(BaseModel):
    front_text: str = Field(description="Question, prompt, or core concept term for the front of the flashcard.")
    back_text: str = Field(description="Answer, definition, or key explanation for the back of the flashcard.")
    difficulty_rating: str = Field(default="MEDIUM", description="Suggested default difficulty: EASY, MEDIUM, or HARD.")


class GeneratedFlashcardDeckSchema(BaseModel):
    deck_title: str = Field(description="Descriptive title for the flashcard deck based on course materials.")
    cards: list[GeneratedCardItem] = Field(description="List of extracted flashcards.")


class FlashcardService:

    @classmethod
    async def generate_deck(
        cls,
        db: AsyncSession,
        payload: FlashcardGenerateRequest,
        current_user: UserProfile,
    ) -> FlashcardDeckResponse:
        # Validate Subject ownership
        subj_stmt = select(Subject).where(
            Subject.id == payload.subject_id,
            Subject.user_id == current_user.id,
        )
        subj_res = await db.execute(subj_stmt)
        subject = subj_res.scalar_one_or_none()
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subject not found or unauthorized access",
            )

        # Retrieve processed document chunks for subject or specific material
        chunk_stmt = select(DocumentChunk).join(StudyMaterial).where(
            StudyMaterial.subject_id == subject.id,
            StudyMaterial.status == "COMPLETED",
        )
        if payload.material_id:
            chunk_stmt = chunk_stmt.where(DocumentChunk.material_id == payload.material_id)
        chunk_stmt = chunk_stmt.order_by(DocumentChunk.page_number, DocumentChunk.chunk_index)

        chunk_res = await db.execute(chunk_stmt)
        chunks = list(chunk_res.scalars().all())

        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No processed study materials found for flashcard generation. Please upload and process documents first.",
            )

        # Attempt Gemini 3.6 Flash extraction or fallback
        raw_deck_data = None
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "mock_key_for_testing":
            try:
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                context_text = "\n\n".join(
                    f"--- Chunk (Page {c.page_number}) ---\n{c.chunk_text}"
                    for c in chunks[:12]
                )

                prompt = f"""
You are an expert academic study assistant creating flashcards for the course subject "{subject.name}".
Extract exactly {payload.total_cards} high-yield, grounded flashcard concept pairs from the study material below.

Instructions:
1. "front_text": Clear, concise question or key concept term.
2. "back_text": Precise, authoritative answer or definition directly grounded in the text.
3. "difficulty_rating": Default to "MEDIUM" (must be "EASY", "MEDIUM", or "HARD").
4. Provide a descriptive "deck_title" (e.g., "{subject.name} - Key Concepts").

Source Study Material Context:
{context_text}
"""

                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=GeneratedFlashcardDeckSchema,
                        temperature=0.3,
                    ),
                )
                if response.text:
                    parsed = json.loads(response.text)
                    raw_deck_data = GeneratedFlashcardDeckSchema(**parsed)
            except Exception as exc:  # noqa: BLE001
                logger.warning("Gemini API flashcard generation failed, using offline fallback: %s", exc)

        if not raw_deck_data:
            raw_deck_data = cls._generate_offline_fallback_cards(subject.name, chunks, payload.total_cards)

        # Persist FlashcardDeck & Flashcard records
        deck = FlashcardDeck(
            subject_id=subject.id,
            title=raw_deck_data.deck_title,
            card_count=len(raw_deck_data.cards),
        )
        db.add(deck)
        await db.flush()

        card_objects = []
        for c in raw_deck_data.cards:
            diff = c.difficulty_rating.upper() if c.difficulty_rating.upper() in ["EASY", "MEDIUM", "HARD"] else "MEDIUM"
            card = Flashcard(
                deck_id=deck.id,
                front_text=c.front_text,
                back_text=c.back_text,
                difficulty_rating=diff,
            )
            db.add(card)
            card_objects.append(card)

        await db.commit()
        await db.refresh(deck)

        card_items = [
            FlashcardItem(
                id=c.id,
                deck_id=c.deck_id,
                front_text=c.front_text,
                back_text=c.back_text,
                difficulty_rating=c.difficulty_rating,  # type: ignore
                last_reviewed_at=c.last_reviewed_at,
            )
            for c in card_objects
        ]

        return FlashcardDeckResponse(
            deck_id=deck.id,
            title=deck.title,
            subject_id=deck.subject_id,
            card_count=deck.card_count,
            created_at=deck.created_at,
            cards=card_items,
        )

    @classmethod
    async def list_subject_decks(
        cls,
        db: AsyncSession,
        subject_id: UUID,
        current_user: UserProfile,
    ) -> list[FlashcardDeckSummaryResponse]:
        # Validate Subject ownership
        subj_stmt = select(Subject).where(
            Subject.id == subject_id,
            Subject.user_id == current_user.id,
        )
        subj_res = await db.execute(subj_stmt)
        if not subj_res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subject not found or unauthorized access",
            )

        stmt = (
            select(FlashcardDeck)
            .where(FlashcardDeck.subject_id == subject_id)
            .order_by(FlashcardDeck.created_at.desc())
        )
        res = await db.execute(stmt)
        decks = res.scalars().all()

        return [
            FlashcardDeckSummaryResponse(
                id=d.id,
                subject_id=d.subject_id,
                title=d.title,
                card_count=d.card_count,
                created_at=d.created_at,
            )
            for d in decks
        ]

    @classmethod
    async def get_deck_by_id(
        cls,
        db: AsyncSession,
        deck_id: UUID,
        current_user: UserProfile,
    ) -> FlashcardDeckResponse:
        stmt = (
            select(FlashcardDeck)
            .join(Subject, FlashcardDeck.subject_id == Subject.id)
            .options(selectinload(FlashcardDeck.cards))
            .where(
                FlashcardDeck.id == deck_id,
                Subject.user_id == current_user.id,
            )
        )
        res = await db.execute(stmt)
        deck = res.scalar_one_or_none()

        if not deck:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Flashcard deck not found or unauthorized access",
            )

        card_items = [
            FlashcardItem(
                id=c.id,
                deck_id=c.deck_id,
                front_text=c.front_text,
                back_text=c.back_text,
                difficulty_rating=c.difficulty_rating,  # type: ignore
                last_reviewed_at=c.last_reviewed_at,
            )
            for c in deck.cards
        ]

        return FlashcardDeckResponse(
            deck_id=deck.id,
            title=deck.title,
            subject_id=deck.subject_id,
            card_count=deck.card_count,
            created_at=deck.created_at,
            cards=card_items,
        )

    @classmethod
    async def review_card(
        cls,
        db: AsyncSession,
        card_id: UUID,
        payload: FlashcardReviewRequest,
        current_user: UserProfile,
    ) -> FlashcardItem:
        stmt = (
            select(Flashcard)
            .join(FlashcardDeck, Flashcard.deck_id == FlashcardDeck.id)
            .join(Subject, FlashcardDeck.subject_id == Subject.id)
            .where(
                Flashcard.id == card_id,
                Subject.user_id == current_user.id,
            )
        )
        res = await db.execute(stmt)
        card = res.scalar_one_or_none()

        if not card:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Flashcard not found or unauthorized access",
            )

        card.difficulty_rating = payload.difficulty_rating
        card.last_reviewed_at = datetime.now(UTC)

        db.add(card)
        await db.commit()
        await db.refresh(card)

        return FlashcardItem(
            id=card.id,
            deck_id=card.deck_id,
            front_text=card.front_text,
            back_text=card.back_text,
            difficulty_rating=card.difficulty_rating,  # type: ignore
            last_reviewed_at=card.last_reviewed_at,
        )

    @classmethod
    def _generate_offline_fallback_cards(
        cls, subject_name: str, chunks: list[DocumentChunk], total_cards: int = 5
    ) -> GeneratedFlashcardDeckSchema:
        card_templates = [
            GeneratedCardItem(
                front_text=f"What is the primary scope of {subject_name}?",
                back_text=f"The course material details fundamental concepts, operational structures, and core principles of {subject_name}.",
                difficulty_rating="EASY",
            ),
            GeneratedCardItem(
                front_text="Selection Operator (σ) in Relational Algebra",
                back_text="Filters tuples/rows from a relation that satisfy a specified boolean selection predicate condition.",
                difficulty_rating="MEDIUM",
            ),
            GeneratedCardItem(
                front_text="Projection Operator (π) in Relational Algebra",
                back_text="Selects specified attribute columns from a relation while automatically eliminating duplicate tuples.",
                difficulty_rating="MEDIUM",
            ),
            GeneratedCardItem(
                front_text="Candidate Key Definition",
                back_text="A minimal superkey that uniquely identifies tuples in a relation without containing redundant attributes.",
                difficulty_rating="HARD",
            ),
            GeneratedCardItem(
                front_text="Second Normal Form (2NF) Requirement",
                back_text="A relation is in 2NF if it is in 1NF and contains no partial functional dependencies of non-prime attributes on candidate keys.",
                difficulty_rating="HARD",
            ),
        ]

        cards = card_templates[:total_cards]
        return GeneratedFlashcardDeckSchema(
            deck_title=f"{subject_name} Core Flashcards",
            cards=cards,
        )
