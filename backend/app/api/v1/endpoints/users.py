from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import UserProfile
from app.schemas.user import UserProfileResponse, UserProfileUpdateRequest
from app.services.auth_service import AuthService

router = APIRouter()


@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(current_user: UserProfile = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserProfileResponse)
async def update_current_user_profile(
    request: UserProfileUpdateRequest,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await AuthService.update_profile(db, current_user, request)
