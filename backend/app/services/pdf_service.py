import io
import re
from typing import TypedDict


class ExtractedPage(TypedDict):
    page_number: int
    text: str


class PDFService:
    @staticmethod
    def clean_text(text: str) -> str:
        if not text:
            return ""
        # Remove null bytes
        text = text.replace("\x00", "")
        # Replace non-printable ascii characters except newline/tab
        text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]", "", text)
        # Normalize multiple spaces and repeated newlines
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n\s*\n+", "\n\n", text)
        return text.strip()

    @classmethod
    def extract_text_from_pdf(cls, file_bytes: bytes) -> list[ExtractedPage]:
        pages: list[ExtractedPage] = []

        # Strategy 1: Try pdfplumber
        try:
            import pdfplumber

            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for idx, page in enumerate(pdf.pages, start=1):
                    raw_text = page.extract_text() or ""
                    cleaned = cls.clean_text(raw_text)
                    if cleaned:
                        pages.append({"page_number": idx, "text": cleaned})
            if pages:
                return pages
        except Exception:  # noqa: BLE001, S110
            pass

        # Strategy 2: Try pypdf / PyPDF2
        try:
            import pypdf

            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            for idx, page in enumerate(reader.pages, start=1):
                raw_text = page.extract_text() or ""
                cleaned = cls.clean_text(raw_text)
                if cleaned:
                    pages.append({"page_number": idx, "text": cleaned})
            if pages:
                return pages
        except Exception:  # noqa: BLE001, S110
            pass

        # Fallback: Plain text decoding if user uploaded text/pdf test file
        try:
            raw_text = file_bytes.decode("utf-8", errors="ignore")
            cleaned = cls.clean_text(raw_text)
            if cleaned:
                pages.append({"page_number": 1, "text": cleaned})
        except Exception:  # noqa: BLE001, S110
            pass

        return pages
