import uuid

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document_chunk import DocumentChunk
from app.models.study_material import StudyMaterial
from app.models.subject import Subject
from app.models.user import UserProfile
from app.schemas.study_material import DocumentStatusResponse, DocumentUploadResponse
from app.services.chunking_service import ChunkingService
from app.services.embedding_service import EmbeddingService
from app.services.pdf_service import PDFService
from app.services.storage_service import StorageService

MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15MB


class DocumentProcessingService:
    @classmethod
    async def validate_subject_ownership(
        cls, db: AsyncSession, current_user: UserProfile, subject_id: uuid.UUID
    ) -> Subject:
        result = await db.execute(
            select(Subject).where(
                Subject.id == subject_id,
                Subject.user_id == current_user.id,
            )
        )
        subj = result.scalars().first()
        if not subj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subject not found or access denied.",
            )
        return subj

    @classmethod
    async def upload_and_process_pdf(
        cls,
        db: AsyncSession,
        current_user: UserProfile,
        subject_id: uuid.UUID,
        file: UploadFile,
    ) -> DocumentUploadResponse:
        # 1. Validate subject ownership
        await cls.validate_subject_ownership(db, current_user, subject_id)

        # 2. Validate file extension and MIME type
        filename = file.filename or "file.pdf"
        if not filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files (.pdf) are allowed.",
            )

        file_bytes = await file.read()
        if len(file_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds maximum limit of 15MB.",
            )

        # 3. Create initial StudyMaterial record
        material_id = uuid.uuid4()
        storage_path = StorageService.save_file(
            subject_id, material_id, filename, file_bytes
        )

        study_material = StudyMaterial(
            id=material_id,
            subject_id=subject_id,
            file_name=filename,
            storage_path=storage_path,
            file_size_bytes=len(file_bytes),
            page_count=0,
            status="PROCESSING",
        )
        db.add(study_material)
        await db.commit()
        await db.refresh(study_material)

        # 4. Process PDF text extraction, chunking, and embeddings
        try:
            pages = PDFService.extract_text_from_pdf(file_bytes)
            if not pages:
                study_material.status = "FAILED"
                study_material.error_message = (
                    "Failed to extract readable text from PDF."
                )
                await db.commit()
                return DocumentUploadResponse(
                    material_id=material_id,
                    file_name=filename,
                    status="FAILED",
                    message="Document uploaded but text extraction failed.",
                )

            # Chunk pages
            chunks = ChunkingService.chunk_pages(pages)

            # Generate embeddings and create chunk records
            for chunk_data in chunks:
                chunk_text = chunk_data["chunk_text"]
                embedding_vector = await EmbeddingService.generate_embedding(chunk_text)

                doc_chunk = DocumentChunk(
                    material_id=material_id,
                    subject_id=subject_id,
                    chunk_index=chunk_data["chunk_index"],
                    chunk_text=chunk_text,
                    page_number=chunk_data["page_number"],
                    embedding=embedding_vector,
                )
                db.add(doc_chunk)

            study_material.page_count = len(pages)
            study_material.status = "COMPLETED"
            study_material.error_message = None
            await db.commit()

            return DocumentUploadResponse(
                material_id=material_id,
                file_name=filename,
                status="COMPLETED",
                message="File uploaded and processed successfully.",
            )
        except Exception as e:  # noqa: BLE001
            study_material.status = "FAILED"
            study_material.error_message = str(e)
            await db.commit()

            return DocumentUploadResponse(
                material_id=material_id,
                file_name=filename,
                status="FAILED",
                message=f"Processing failed: {e!s}",
            )

    @classmethod
    async def get_document_status(
        cls, db: AsyncSession, current_user: UserProfile, material_id: uuid.UUID
    ) -> DocumentStatusResponse:
        result = await db.execute(
            select(StudyMaterial)
            .join(Subject)
            .where(
                StudyMaterial.id == material_id,
                Subject.user_id == current_user.id,
            )
        )
        mat = result.scalars().first()
        if not mat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Study material not found.",
            )

        chunks_res = await db.execute(
            select(DocumentChunk).where(DocumentChunk.material_id == material_id)
        )
        chunk_count = len(chunks_res.scalars().all())

        return DocumentStatusResponse(
            material_id=mat.id,
            status=mat.status,
            page_count=mat.page_count,
            chunks_created=chunk_count,
            error_message=mat.error_message,
        )

    @classmethod
    async def list_subject_materials(
        cls, db: AsyncSession, current_user: UserProfile, subject_id: uuid.UUID
    ) -> list[StudyMaterial]:
        await cls.validate_subject_ownership(db, current_user, subject_id)
        result = await db.execute(
            select(StudyMaterial)
            .where(StudyMaterial.subject_id == subject_id)
            .order_by(StudyMaterial.created_at.desc())
        )
        return list(result.scalars().all())

    @classmethod
    async def get_material_chunks(
        cls, db: AsyncSession, current_user: UserProfile, material_id: uuid.UUID
    ) -> list[DocumentChunk]:
        # Validate owner access
        await cls.get_document_status(db, current_user, material_id)
        result = await db.execute(
            select(DocumentChunk)
            .where(DocumentChunk.material_id == material_id)
            .order_by(DocumentChunk.chunk_index.asc())
        )
        return list(result.scalars().all())

    @classmethod
    async def delete_material(
        cls, db: AsyncSession, current_user: UserProfile, material_id: uuid.UUID
    ) -> None:
        result = await db.execute(
            select(StudyMaterial)
            .join(Subject)
            .where(
                StudyMaterial.id == material_id,
                Subject.user_id == current_user.id,
            )
        )
        mat = result.scalars().first()
        if not mat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Study material not found.",
            )

        StorageService.delete_file(mat.storage_path)
        await db.delete(mat)
        await db.commit()
