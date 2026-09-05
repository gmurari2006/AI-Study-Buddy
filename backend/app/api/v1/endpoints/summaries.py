from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import UserProfile
from app.schemas.summary import (
    SummaryGenerateRequest,
    SummaryResponse,
)
from app.services.summary_service import SummaryService

router = APIRouter()


@router.post(
    "/generate",
    response_model=SummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate summary and formula sheet for study material",
)
async def generate_summary(
    payload: SummaryGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> SummaryResponse:
    return await SummaryService.generate_summary(db, current_user, payload)
