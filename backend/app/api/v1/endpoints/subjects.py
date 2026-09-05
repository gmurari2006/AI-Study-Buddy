import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import UserProfile
from app.schemas.auth import MessageResponse
from app.schemas.subject import SubjectCreateRequest, SubjectResponse, SubjectUpdateRequest
from app.services.subject_service import SubjectService

router = APIRouter()


@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
async def create_subject(
    request: SubjectCreateRequest,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await SubjectService.create_subject(db, current_user, request)


@router.get("", response_model=list[SubjectResponse])
async def list_subjects(
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await SubjectService.get_user_subjects(db, current_user)


@router.get("/{subject_id}", response_model=SubjectResponse)
async def get_subject(
    subject_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await SubjectService.get_subject_by_id(db, current_user, subject_id)


@router.put("/{subject_id}", response_model=SubjectResponse)
async def update_subject(
    subject_id: uuid.UUID,
    request: SubjectUpdateRequest,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await SubjectService.update_subject(db, current_user, subject_id, request)


@router.delete("/{subject_id}", response_model=MessageResponse)
async def delete_subject(
    subject_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await SubjectService.delete_subject(db, current_user, subject_id)
    return MessageResponse(message="Subject deleted successfully")
