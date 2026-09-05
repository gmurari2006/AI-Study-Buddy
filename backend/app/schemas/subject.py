import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SubjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str | None = Field(None, max_length=50)
    color_code: str | None = Field("#4F46E5", max_length=20)


class SubjectUpdateRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    code: str | None = Field(None, max_length=50)
    color_code: str | None = Field(None, max_length=20)


class SubjectResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    code: str | None = None
    color_code: str | None = "#4F46E5"
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
