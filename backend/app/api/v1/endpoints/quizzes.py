import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import UserProfile
from app.schemas.quiz import (
    QuizGenerateRequest,
    QuizResponse,
    QuizSubmitRequest,
    QuizSubmitResponse,
    QuizSummaryResponse,
)
from app.services.quiz_service import QuizService

router = APIRouter()


@router.post(
    "/generate",
    response_model=QuizResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate practice quiz from subject study materials",
)
async def generate_quiz(
    payload: QuizGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> QuizResponse:
    return await QuizService.generate_quiz(db, current_user, payload)


@router.get(
    "/subject/{subject_id}",
    response_model=list[QuizSummaryResponse],
    status_code=status.HTTP_200_OK,
    summary="List quizzes generated for a subject",
)
async def list_subject_quizzes(
    subject_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[QuizSummaryResponse]:
    return await QuizService.list_subject_quizzes(db, current_user, subject_id)


@router.get(
    "/{quiz_id}",
    response_model=QuizResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve quiz questions for active attempt",
)
async def get_quiz_by_id(
    quiz_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> QuizResponse:
    return await QuizService.get_quiz_by_id(db, current_user, quiz_id)


@router.post(
    "/{quiz_id}/submit",
    response_model=QuizSubmitResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit quiz answers and calculate attempt score",
)
async def submit_quiz_attempt(
    quiz_id: uuid.UUID,
    payload: QuizSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> QuizSubmitResponse:
    return await QuizService.submit_quiz_attempt(db, current_user, quiz_id, payload)
