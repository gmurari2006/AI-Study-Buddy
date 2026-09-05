import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentUploadResponse(BaseModel):
    material_id: uuid.UUID
    file_name: str
    status: str
    message: str


class DocumentStatusResponse(BaseModel):
    material_id: uuid.UUID
    status: str  # PENDING, PROCESSING, COMPLETED, FAILED
    page_count: int
    chunks_created: int
    error_message: str | None = None


class StudyMaterialResponse(BaseModel):
    id: uuid.UUID
    subject_id: uuid.UUID
    file_name: str
    storage_path: str
    file_size_bytes: int
    page_count: int
    status: str
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class DocumentChunkResponse(BaseModel):
    id: uuid.UUID
    material_id: uuid.UUID
    subject_id: uuid.UUID
    chunk_index: int
    chunk_text: str
    page_number: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
