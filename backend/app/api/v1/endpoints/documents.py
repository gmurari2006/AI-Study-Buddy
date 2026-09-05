import uuid

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import UserProfile
from app.schemas.auth import MessageResponse
from app.schemas.study_material import (
    DocumentChunkResponse,
    DocumentStatusResponse,
    DocumentUploadResponse,
    StudyMaterialResponse,
)
from app.services.document_processing_service import DocumentProcessingService

router = APIRouter()


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def upload_document(
    subject_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await DocumentProcessingService.upload_and_process_pdf(
        db, current_user, subject_id, file
    )


@router.get("/subject/{subject_id}", response_model=list[StudyMaterialResponse])
async def list_documents(
    subject_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await DocumentProcessingService.list_subject_materials(
        db, current_user, subject_id
    )


@router.get("/{material_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(
    material_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await DocumentProcessingService.get_document_status(
        db, current_user, material_id
    )


@router.get("/{material_id}/chunks", response_model=list[DocumentChunkResponse])
async def get_document_chunks(
    material_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await DocumentProcessingService.get_material_chunks(
        db, current_user, material_id
    )


@router.delete("/{material_id}", response_model=MessageResponse)
async def delete_document(
    material_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await DocumentProcessingService.delete_material(db, current_user, material_id)
    return MessageResponse(message="Document deleted successfully")
