import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.subject import Subject
from app.models.user import UserProfile
from app.schemas.subject import SubjectCreateRequest, SubjectUpdateRequest


class SubjectService:
    @staticmethod
    async def create_subject(
        db: AsyncSession, current_user: UserProfile, request: SubjectCreateRequest
    ) -> Subject:
        clean_name = request.name.strip()
        if not clean_name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Subject name cannot be empty",
            )

        new_subject = Subject(
            user_id=current_user.id,
            name=clean_name,
            code=request.code.strip() if request.code else None,
            color_code=request.color_code or "#4F46E5",
        )
        db.add(new_subject)
        await db.commit()
        await db.refresh(new_subject)
        return new_subject

    @staticmethod
    async def get_user_subjects(
        db: AsyncSession, current_user: UserProfile
    ) -> list[Subject]:
        result = await db.execute(
            select(Subject)
            .where(Subject.user_id == current_user.id)
            .order_by(Subject.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_subject_by_id(
        db: AsyncSession, current_user: UserProfile, subject_id: uuid.UUID
    ) -> Subject:
        result = await db.execute(
            select(Subject).where(
                Subject.id == subject_id,
                Subject.user_id == current_user.id,
            )
        )
        subject = result.scalars().first()
        if not subject:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subject not found",
            )
        return subject

    @staticmethod
    async def update_subject(
        db: AsyncSession,
        current_user: UserProfile,
        subject_id: uuid.UUID,
        request: SubjectUpdateRequest,
    ) -> Subject:
        subject = await SubjectService.get_subject_by_id(db, current_user, subject_id)

        if request.name is not None:
            clean_name = request.name.strip()
            if not clean_name:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail="Subject name cannot be empty",
                )
            subject.name = clean_name

        if request.code is not None:
            subject.code = request.code.strip() if request.code else None

        if request.color_code is not None:
            subject.color_code = request.color_code

        await db.commit()
        await db.refresh(subject)
        return subject

    @staticmethod
    async def delete_subject(
        db: AsyncSession, current_user: UserProfile, subject_id: uuid.UUID
    ) -> None:
        subject = await SubjectService.get_subject_by_id(db, current_user, subject_id)
        await db.delete(subject)
        await db.commit()
