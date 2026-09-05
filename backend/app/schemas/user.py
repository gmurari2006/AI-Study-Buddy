import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UserProfileResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str | None = None
    academic_year: str | None = "3rd Year CSE"
    created_at: datetime
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class UserProfileUpdateRequest(BaseModel):
    full_name: str | None = None
    academic_year: str | None = None
