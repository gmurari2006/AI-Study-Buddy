
from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import UserProfileResponse


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    full_name: str | None = None
    academic_year: str | None = "3rd Year CSE"


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse


class MessageResponse(BaseModel):
    message: str
