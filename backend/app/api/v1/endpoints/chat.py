import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import UserProfile
from app.schemas.auth import MessageResponse
from app.schemas.chat import (
    ChatMessageResponse,
    ChatQueryRequest,
    ConversationCreateRequest,
    ConversationResponse,
)
from app.services.chat_service import ChatService

router = APIRouter()


@router.post(
    "/conversations",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_conversation(
    request: ConversationCreateRequest,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ChatService.create_conversation(db, current_user, request)


@router.get(
    "/conversations/{subject_id}",
    response_model=list[ConversationResponse],
)
async def list_conversations(
    subject_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ChatService.list_conversations(db, current_user, subject_id)


@router.get(
    "/messages/{conversation_id}",
    response_model=list[ChatMessageResponse],
)
async def get_messages(
    conversation_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ChatService.get_messages(db, current_user, conversation_id)


@router.post("/query", response_model=ChatMessageResponse)
async def query_ai_tutor(
    request: ChatQueryRequest,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await ChatService.execute_query(db, current_user, request)


@router.delete("/conversations/{conversation_id}", response_model=MessageResponse)
async def delete_conversation(
    conversation_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await ChatService.delete_conversation(db, current_user, conversation_id)
    return MessageResponse(message="Conversation deleted successfully")
