import json
import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, ForeignKey, Integer, Text, TypeDecorator, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

try:
    from pgvector.sqlalchemy import Vector
    Vector768 = Vector(768)
except ImportError:
    class VectorFallback(TypeDecorator):
        impl = Text
        cache_ok = True

        def process_bind_param(self, value: Any, dialect: Any) -> Any:
            if value is None:
                return None
            if isinstance(value, list):
                return json.dumps(value)
            return str(value)

        def process_result_value(self, value: Any, dialect: Any) -> Any:
            if value is None:
                return None
            if isinstance(value, str):
                try:
                    return json.loads(value)
                except (json.JSONDecodeError, TypeError, ValueError):
                    return value
            return value

    Vector768 = VectorFallback


if TYPE_CHECKING:
    from app.models.study_material import StudyMaterial
    from app.models.subject import Subject


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    material_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("study_materials.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    subject_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("subjects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    page_number: Mapped[int] = mapped_column(Integer, nullable=False)
    embedding: Mapped[Any] = mapped_column(Vector768, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        server_default=text("NOW()"),
    )

    material: Mapped["StudyMaterial"] = relationship(
        "StudyMaterial", back_populates="chunks"
    )
    subject: Mapped["Subject"] = relationship("Subject", backref="chunks")
