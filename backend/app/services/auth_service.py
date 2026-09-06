from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import UserProfile
from app.schemas.auth import TokenResponse, UserGoogleAuthRequest, UserLoginRequest, UserRegisterRequest
from app.schemas.user import UserProfileUpdateRequest


class AuthService:
    @staticmethod
    async def register_user(db: AsyncSession, request: UserRegisterRequest) -> TokenResponse:
        # Check existing user
        result = await db.execute(select(UserProfile).where(UserProfile.email == request.email.lower()))
        existing_user = result.scalars().first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered",
            )

        hashed_pw = hash_password(request.password)
        new_user = UserProfile(
            email=request.email.lower(),
            full_name=request.full_name,
            academic_year=request.academic_year or "3rd Year CSE",
            password_hash=hashed_pw,
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        access_token = create_access_token(subject=new_user.id)
        return TokenResponse(access_token=access_token, token_type="bearer", user=new_user)

    @staticmethod
    async def authenticate_user(db: AsyncSession, request: UserLoginRequest) -> TokenResponse:
        result = await db.execute(select(UserProfile).where(UserProfile.email == request.email.lower()))
        user = result.scalars().first()

        if not user or not user.password_hash or not verify_password(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = create_access_token(subject=user.id)
        return TokenResponse(access_token=access_token, token_type="bearer", user=user)

    @staticmethod
    async def google_auth(db: AsyncSession, request: UserGoogleAuthRequest) -> TokenResponse:
        email_clean = request.email.lower()
        result = await db.execute(select(UserProfile).where(UserProfile.email == email_clean))
        user = result.scalars().first()

        if not user:
            user = UserProfile(
                email=email_clean,
                full_name=request.full_name or "Google User",
                academic_year="3rd Year CSE",
                password_hash="",
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        access_token = create_access_token(subject=user.id)
        return TokenResponse(access_token=access_token, token_type="bearer", user=user)

    @staticmethod
    async def update_profile(
        db: AsyncSession, current_user: UserProfile, request: UserProfileUpdateRequest
    ) -> UserProfile:
        if request.full_name is not None:
            current_user.full_name = request.full_name
        if request.academic_year is not None:
            current_user.academic_year = request.academic_year

        await db.commit()
        await db.refresh(current_user)
        return current_user
