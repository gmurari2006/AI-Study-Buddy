from fastapi import APIRouter

from app.api.v1.endpoints import (
    analytics,
    auth,
    chat,
    documents,
    flashcards,
    notifications,
    planner,
    quizzes,
    subjects,
    summaries,
    users,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users & Profile"])
api_router.include_router(subjects.router, prefix="/subjects", tags=["Subjects"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(chat.router, prefix="/chat", tags=["RAG Chat"])
api_router.include_router(summaries.router, prefix="/summaries", tags=["Summaries"])
api_router.include_router(quizzes.router, prefix="/quizzes", tags=["Quizzes"])
api_router.include_router(flashcards.router, prefix="/flashcards", tags=["Flashcards"])
api_router.include_router(planner.router, prefix="/planner", tags=["Study Planner"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics & Mastery"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
