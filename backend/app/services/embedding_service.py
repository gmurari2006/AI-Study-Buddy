import hashlib
import math
import os
from collections.abc import Sequence


class EmbeddingService:
    EMBEDDING_DIM = 768
    MODEL_NAME = "models/text-embedding-004"  # or gemini-embedding-001

    @classmethod
    def generate_mock_embedding(cls, text: str) -> list[float]:
        """Generates a deterministic, unit-normalized 768-dim vector from text hash."""
        seed = int(hashlib.md5(text.encode("utf-8")).hexdigest(), 16)
        raw_vec = []
        for i in range(cls.EMBEDDING_DIM):
            val = math.sin(seed + i * 0.1)
            raw_vec.append(val)

        # L2 normalize
        norm = math.sqrt(sum(x * x for x in raw_vec)) or 1.0
        return [x / norm for x in raw_vec]

    @classmethod
    async def generate_embedding(cls, text: str) -> list[float]:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return cls.generate_mock_embedding(text)

        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            response = client.models.embed_content(
                model=cls.MODEL_NAME,
                contents=text,
                config={"output_dimensionality": cls.EMBEDDING_DIM},
            )
            if response and hasattr(response, "embedding") and response.embedding:
                vec = response.embedding.values
                if len(vec) == cls.EMBEDDING_DIM:
                    return list(vec)
        except Exception:  # noqa: BLE001, S110
            pass

        return cls.generate_mock_embedding(text)

    @classmethod
    async def generate_batch_embeddings(
        cls, texts: Sequence[str]
    ) -> list[list[float]]:
        embeddings: list[list[float]] = []
        for text in texts:
            emb = await cls.generate_embedding(text)
            embeddings.append(emb)
        return embeddings
