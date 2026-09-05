from typing import ClassVar, TypedDict

from app.services.pdf_service import ExtractedPage


class ChunkData(TypedDict):
    chunk_index: int
    page_number: int
    chunk_text: str


class ChunkingService:
    DEFAULT_CHUNK_SIZE = 500
    DEFAULT_CHUNK_OVERLAP = 50
    SEPARATORS: ClassVar[list[str]] = ["\n\n", "\n", " ", ""]

    @classmethod
    def split_text_into_chunks(
        cls,
        text: str,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
    ) -> list[str]:
        if not text:
            return []

        def _split_recursive(t: str, separators: list[str]) -> list[str]:
            if len(t) <= chunk_size or not separators:
                return [t] if t.strip() else []

            sep = separators[0]
            next_seps = separators[1:]

            splits = t.split(sep) if sep else list(t)
            good_splits: list[str] = []

            for s in splits:
                if len(s) > chunk_size:
                    sub_splits = _split_recursive(s, next_seps)
                    good_splits.extend(sub_splits)
                else:
                    good_splits.append(s)

            # Combine small splits up to chunk_size with chunk_overlap
            merged_chunks: list[str] = []
            current_chunk = ""

            for piece in good_splits:
                piece_str = piece if not sep else piece + sep
                if len(current_chunk) + len(piece_str) <= chunk_size:
                    current_chunk += piece_str
                else:
                    if current_chunk.strip():
                        merged_chunks.append(current_chunk.strip())
                    # Overlap handling
                    overlap_start = max(0, len(current_chunk) - chunk_overlap)
                    current_chunk = current_chunk[overlap_start:] + piece_str

            if current_chunk.strip():
                merged_chunks.append(current_chunk.strip())

            return merged_chunks

        return _split_recursive(text, cls.SEPARATORS)

    @classmethod
    def chunk_pages(
        cls,
        pages: list[ExtractedPage],
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
    ) -> list[ChunkData]:
        all_chunks: list[ChunkData] = []
        global_index = 0

        for page in pages:
            page_number = page["page_number"]
            text = page["text"]

            text_chunks = cls.split_text_into_chunks(text, chunk_size, chunk_overlap)
            for chunk_str in text_chunks:
                if chunk_str.strip():
                    all_chunks.append(
                        {
                            "chunk_index": global_index,
                            "page_number": page_number,
                            "chunk_text": chunk_str.strip(),
                        }
                    )
                    global_index += 1

        return all_chunks
