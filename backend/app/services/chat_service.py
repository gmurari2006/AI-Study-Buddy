import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.models.message import Message
from app.models.subject import Subject
from app.models.user import UserProfile
from app.schemas.chat import (
    ChatMessageResponse,
    ChatQueryRequest,
    ConversationCreateRequest,
)
from app.services.embedding_service import EmbeddingService
from app.services.rag_service import RAGService


class ChatService:
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
    async def validate_conversation_ownership(
        cls, db: AsyncSession, current_user: UserProfile, conversation_id: uuid.UUID
    ) -> Conversation:
        result = await db.execute(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == current_user.id,
            )
        )
        conv = result.scalars().first()
        if not conv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found or access denied.",
            )
        return conv

    @classmethod
    async def create_conversation(
        cls,
        db: AsyncSession,
        current_user: UserProfile,
        request: ConversationCreateRequest,
    ) -> Conversation:
        await cls.validate_subject_ownership(db, current_user, request.subject_id)

        conv = Conversation(
            subject_id=request.subject_id,
            user_id=current_user.id,
            title=request.title.strip() if request.title else "Study Session",
        )
        db.add(conv)
        await db.commit()
        await db.refresh(conv)
        return conv

    @classmethod
    async def list_conversations(
        cls, db: AsyncSession, current_user: UserProfile, subject_id: uuid.UUID
    ) -> list[Conversation]:
        await cls.validate_subject_ownership(db, current_user, subject_id)

        result = await db.execute(
            select(Conversation)
            .where(
                Conversation.subject_id == subject_id,
                Conversation.user_id == current_user.id,
            )
            .order_by(Conversation.created_at.desc())
        )
        return list(result.scalars().all())

    @classmethod
    async def get_messages(
        cls, db: AsyncSession, current_user: UserProfile, conversation_id: uuid.UUID
    ) -> list[Message]:
        await cls.validate_conversation_ownership(db, current_user, conversation_id)

        result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
        )
        return list(result.scalars().all())

    @classmethod
    async def execute_query(
        cls,
        db: AsyncSession,
        current_user: UserProfile,
        request: ChatQueryRequest,
    ) -> ChatMessageResponse:
        # Validate conversation ownership
        conv = await cls.validate_conversation_ownership(
            db, current_user, request.conversation_id
        )

        clean_query = request.query.strip()
        if not clean_query:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Query text cannot be empty.",
            )

        # 1. Save User Message
        user_msg = Message(
            conversation_id=conv.id,
            sender_type="user",
            content=clean_query,
            citations=[],
        )
        db.add(user_msg)
        await db.commit()

        # 2. Generate Query Embedding & Search Relevant Vector Chunks
        query_vector = await EmbeddingService.generate_embedding(clean_query)
        context_chunks = await RAGService.search_relevant_chunks(
            db, request.subject_id, query_vector
        )

        # 3. Generate Grounded Answer & Citation List
        answer_text, citations = await RAGService.generate_grounded_answer(
            clean_query, context_chunks
        )

        # 4. Save Assistant Message
        assistant_msg = Message(
            conversation_id=conv.id,
            sender_type="assistant",
            content=answer_text,
            citations=citations,
        )
        db.add(assistant_msg)
        await db.commit()
        await db.refresh(assistant_msg)

        return ChatMessageResponse(
            id=assistant_msg.id,
            conversation_id=assistant_msg.conversation_id,
            sender_type=assistant_msg.sender_type,
            content=assistant_msg.content,
            citations=assistant_msg.citations,
            created_at=assistant_msg.created_at,
        )

    @classmethod
    async def delete_conversation(
        cls, db: AsyncSession, current_user: UserProfile, conversation_id: uuid.UUID
    ) -> None:
        conv = await cls.validate_conversation_ownership(
            db, current_user, conversation_id
        )
        await db.delete(conv)
        await db.commit()
