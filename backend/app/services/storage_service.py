import uuid
from pathlib import Path

# Base upload path: backend/storage/uploads
BASE_STORAGE_DIR = Path(__file__).resolve().parent.parent.parent / "storage" / "uploads"


class StorageService:
    @staticmethod
    def save_file(subject_id: uuid.UUID, file_id: uuid.UUID, file_name: str, file_bytes: bytes) -> str:
        subject_dir = BASE_STORAGE_DIR / str(subject_id)
        subject_dir.mkdir(parents=True, exist_ok=True)

        safe_extension = Path(file_name).suffix or ".pdf"
        target_path = subject_dir / f"{file_id}{safe_extension}"

        with open(target_path, "wb") as f:
            f.write(file_bytes)

        return str(target_path)

    @staticmethod
    def delete_file(storage_path: str) -> bool:
        try:
            path = Path(storage_path)
            if path.exists():
                path.unlink()
                return True
        except OSError:
            pass
        return False
