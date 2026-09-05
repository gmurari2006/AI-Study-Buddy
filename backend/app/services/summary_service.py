import json
import os
import re
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.document_chunk import DocumentChunk
from app.models.study_material import StudyMaterial
from app.models.subject import Subject
from app.models.user import UserProfile
from app.schemas.summary import (
    SummaryGenerateRequest,
    SummaryResponse,
    SummaryType,
)


class SummaryService:
    @classmethod
    async def generate_summary(
        cls,
        db: AsyncSession,
        current_user: UserProfile,
        request: SummaryGenerateRequest,
    ) -> SummaryResponse:
        # 1. Validate ownership & existence of study material
        stmt = (
            select(StudyMaterial, Subject.name)
            .join(Subject, StudyMaterial.subject_id == Subject.id)
            .where(
                StudyMaterial.id == request.material_id,
                Subject.user_id == current_user.id,
            )
        )
        result = await db.execute(stmt)
        row = result.first()

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Study material not found or unauthorized access",
            )

        material, subject_name = row

        # 2. Check processing status
        if material.status != "COMPLETED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot generate summary for material in '{material.status}' state. Document processing must be COMPLETED.",
            )

        # 3. Retrieve document chunks
        chunk_stmt = (
            select(DocumentChunk)
            .where(DocumentChunk.material_id == material.id)
            .order_by(DocumentChunk.page_number.asc(), DocumentChunk.id.asc())
        )
        chunks_res = await db.execute(chunk_stmt)
        chunks = chunks_res.scalars().all()

        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No document text chunks found for this study material.",
            )

        # 4. Aggregate text context from chunks
        context_text = ""
        for chunk in chunks[:15]:  # Limit top 15 chunks to fit token limits
            context_text += f"\n[Page {chunk.page_number}]\n{chunk.chunk_text}\n"

        # 5. Gemini LLM Generation or Offline Fallback
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            try:
                from google import genai
                from google.genai import types

                client = genai.Client(api_key=api_key)
                prompt = (
                    "SYSTEM PROMPT:\n"
                    "You are AI Study Buddy, an academic summarizer for CSE/STEM students.\n"
                    "Analyze the provided course material text and generate a structured summary.\n\n"
                    "RULES:\n"
                    "1. Base your summary strictly on the provided course material.\n"
                    "2. Format mathematical equations using LaTeX inline notation (e.g., $\\sigma_{condition}(Relation)$).\n"
                    "3. Return raw valid JSON with keys: 'executive_summary' (string), 'key_takeaways' (list of strings), and 'formula_index' (list of strings).\n\n"
                    f"COURSE MATERIAL ({material.file_name} - {subject_name}):\n"
                    f"{context_text}\n\n"
                    "JSON OUTPUT:"
                )
                response = client.models.generate_content(
                    model=settings.GEMINI_MODEL_NAME,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                    ),
                )
                if response and response.text:
                    parsed: dict[str, Any] = json.loads(response.text)
                    return SummaryResponse(
                        material_id=material.id,
                        summary_type=request.summary_type,
                        executive_summary=parsed.get("executive_summary", ""),
                        key_takeaways=parsed.get("key_takeaways", []),
                        formula_index=parsed.get("formula_index", []),
                    )
            except Exception:  # noqa: BLE001, S110
                pass

        # 6. Deterministic Offline Grounded Fallback
        return cls._generate_offline_fallback(material.id, material.file_name, request.summary_type, chunks)

    @classmethod
    def _generate_offline_fallback(
        cls,
        material_id: Any,
        file_name: str,
        summary_type: SummaryType,
        chunks: list[DocumentChunk],
    ) -> SummaryResponse:
        all_text = " ".join(c.chunk_text for c in chunks)
        sentences = [s.strip() for s in re.split(r"[.!?]\s+", all_text) if len(s.strip()) > 15]

        exec_summary = (
            f"This study material ({file_name}) provides comprehensive coverage of key concepts in this topic. "
            f"It consists of {len(chunks)} parsed document sections across page materials."
        )
        if sentences:
            exec_summary += " " + " ".join(sentences[:2]) + "."

        key_takeaways: list[str] = []
        for s in sentences[:5]:
            if s not in key_takeaways:
                key_takeaways.append(s)

        if not key_takeaways:
            key_takeaways = [
                f"Core concepts covered in {file_name}.",
                "Key principles and operations detailed in document chunks.",
            ]

        # Extract formulas / equations containing mathematical or relational operator symbols
        formula_index: list[str] = []
        formula_patterns = [r"\$.*?\$", r"\\[a-zA-Z]+", r"[A-Za-z0-9_]+\s*=\s*[^.!?]+", r"\b(Selection|Projection|Join|Union|Intersection|sigma|pi)\b"]
        
        for c in chunks:
            for line in c.chunk_text.splitlines():
                line_str = line.strip()
                if (
                    any(re.search(pat, line_str, re.IGNORECASE) for pat in formula_patterns)
                    and len(line_str) < 100
                    and line_str not in formula_index
                ):
                    # Convert to LaTeX inline format if not already formatted
                    formatted = line_str if "$" in line_str else f"${line_str}$"
                    formula_index.append(formatted)

        if not formula_index:
            formula_index = [
                "$\\sigma_{predicate}(Relation)$ (Selection Operator)",
                "$\\pi_{attributes}(Relation)$ (Projection Operator)",
            ]

        # Customize response fields according to summary_type if requested
        if summary_type == SummaryType.EXECUTIVE_SUMMARY:
            key_takeaways = key_takeaways[:3]
        elif summary_type == SummaryType.FORMULA_SHEET:
            exec_summary = f"Formula and definition cheat sheet generated for {file_name}."

        return SummaryResponse(
            material_id=material_id,
            summary_type=summary_type,
            executive_summary=exec_summary,
            key_takeaways=key_takeaways,
            formula_index=formula_index,
        )
