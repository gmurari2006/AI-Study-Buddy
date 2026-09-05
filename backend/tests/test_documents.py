import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document_chunk import DocumentChunk
from app.models.study_material import StudyMaterial

# Simple sample PDF bytes with text
SAMPLE_PDF_BYTES = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Count 1\n/Kids [3 0 R]\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources << >>\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<< /Length 55 >>\nstream\nBT\n/F1 12 Tf\n72 712 Td\n(Operating Systems Unit 1 Process Management) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000060 00000 n \n0000000125 00000 n \n0000000214 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n320\n%%EOF"


async def setup_user_and_subject(client: AsyncClient, email_prefix: str = "doc"):
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": f"{email_prefix}.test@university.edu", "password": "Password123!"},
    )
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    subj_res = await client.post(
        "/api/v1/subjects",
        json={"name": "Operating Systems", "code": "CS301"},
        headers=headers,
    )
    subject_id = subj_res.json()["id"]
    return token, headers, subject_id


@pytest.mark.asyncio
async def test_upload_document_success(client: AsyncClient, db_session: AsyncSession):
    _, headers, subject_id = await setup_user_and_subject(client, "upload")

    files = {"file": ("unit1_os.pdf", SAMPLE_PDF_BYTES, "application/pdf")}
    data = {"subject_id": subject_id}

    response = await client.post(
        "/api/v1/documents/upload",
        data=data,
        files=files,
        headers=headers,
    )

    assert response.status_code == 202
    res_data = response.json()
    assert res_data["file_name"] == "unit1_os.pdf"
    assert res_data["status"] in ["COMPLETED", "PROCESSING"]
    assert "material_id" in res_data

    material_id = uuid.UUID(res_data["material_id"])

    # Verify DB record created
    db_mat = await db_session.get(StudyMaterial, material_id)
    assert db_mat is not None
    assert db_mat.file_name == "unit1_os.pdf"
    assert db_mat.status == "COMPLETED"
    assert db_mat.page_count >= 1

    # Verify chunks created
    chunk_res = await db_session.execute(
        select(DocumentChunk).where(DocumentChunk.material_id == material_id)
    )
    chunks = chunk_res.scalars().all()
    assert len(chunks) >= 1
    assert chunks[0].chunk_text is not None


@pytest.mark.asyncio
async def test_list_subject_documents(client: AsyncClient):
    _, headers, subject_id = await setup_user_and_subject(client, "lister")

    # Upload document
    files = {"file": ("test_doc.pdf", SAMPLE_PDF_BYTES, "application/pdf")}
    await client.post(
        "/api/v1/documents/upload",
        data={"subject_id": subject_id},
        files=files,
        headers=headers,
    )

    response = await client.get(
        f"/api/v1/documents/subject/{subject_id}",
        headers=headers,
    )

    assert response.status_code == 200
    docs = response.json()
    assert isinstance(docs, list)
    assert len(docs) >= 1
    assert docs[0]["file_name"] == "test_doc.pdf"


@pytest.mark.asyncio
async def test_get_document_status(client: AsyncClient):
    _, headers, subject_id = await setup_user_and_subject(client, "status")

    files = {"file": ("status_doc.pdf", SAMPLE_PDF_BYTES, "application/pdf")}
    upload_res = await client.post(
        "/api/v1/documents/upload",
        data={"subject_id": subject_id},
        files=files,
        headers=headers,
    )
    material_id = upload_res.json()["material_id"]

    response = await client.get(
        f"/api/v1/documents/{material_id}/status",
        headers=headers,
    )

    assert response.status_code == 200
    status_data = response.json()
    assert status_data["material_id"] == material_id
    assert status_data["status"] == "COMPLETED"
    assert status_data["page_count"] >= 1
    assert status_data["chunks_created"] >= 1


@pytest.mark.asyncio
async def test_get_document_chunks(client: AsyncClient):
    _, headers, subject_id = await setup_user_and_subject(client, "chunks")

    files = {"file": ("chunks_doc.pdf", SAMPLE_PDF_BYTES, "application/pdf")}
    upload_res = await client.post(
        "/api/v1/documents/upload",
        data={"subject_id": subject_id},
        files=files,
        headers=headers,
    )
    material_id = upload_res.json()["material_id"]

    response = await client.get(
        f"/api/v1/documents/{material_id}/chunks",
        headers=headers,
    )

    assert response.status_code == 200
    chunks = response.json()
    assert isinstance(chunks, list)
    assert len(chunks) >= 1
    assert chunks[0]["page_number"] >= 1


@pytest.mark.asyncio
async def test_upload_non_pdf_fails(client: AsyncClient):
    _, headers, subject_id = await setup_user_and_subject(client, "nonpdf")

    files = {"file": ("invalid.txt", b"Hello world text", "text/plain")}

    response = await client.post(
        "/api/v1/documents/upload",
        data={"subject_id": subject_id},
        files=files,
        headers=headers,
    )

    assert response.status_code == 400
    assert "Only PDF files" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_empty_file_fails(client: AsyncClient):
    _, headers, subject_id = await setup_user_and_subject(client, "empty")

    files = {"file": ("empty.pdf", b"", "application/pdf")}

    response = await client.post(
        "/api/v1/documents/upload",
        data={"subject_id": subject_id},
        files=files,
        headers=headers,
    )

    assert response.status_code == 400
    assert "file is empty" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_unauthenticated_fails(client: AsyncClient):
    fake_subject_id = str(uuid.uuid4())
    files = {"file": ("doc.pdf", SAMPLE_PDF_BYTES, "application/pdf")}

    response = await client.post(
        "/api/v1/documents/upload",
        data={"subject_id": fake_subject_id},
        files=files,
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_document_cross_user_isolation(client: AsyncClient):
    _, headersA, subject_idA = await setup_user_and_subject(client, "userA")

    files = {"file": ("userA_doc.pdf", SAMPLE_PDF_BYTES, "application/pdf")}
    upload_res = await client.post(
        "/api/v1/documents/upload",
        data={"subject_id": subject_idA},
        files=files,
        headers=headersA,
    )
    material_id = upload_res.json()["material_id"]

    # Setup User B
    _, headersB, _ = await setup_user_and_subject(client, "userB")

    # User B tries to access User A's document status -> 404
    status_res = await client.get(
        f"/api/v1/documents/{material_id}/status",
        headers=headersB,
    )
    assert status_res.status_code == 404

    # User B tries to delete User A's document -> 404
    delete_res = await client.delete(
        f"/api/v1/documents/{material_id}",
        headers=headersB,
    )
    assert delete_res.status_code == 404


@pytest.mark.asyncio
async def test_delete_document_success(client: AsyncClient, db_session: AsyncSession):
    _, headers, subject_id = await setup_user_and_subject(client, "deleter")

    files = {"file": ("to_delete.pdf", SAMPLE_PDF_BYTES, "application/pdf")}
    upload_res = await client.post(
        "/api/v1/documents/upload",
        data={"subject_id": subject_id},
        files=files,
        headers=headers,
    )
    material_id = uuid.UUID(upload_res.json()["material_id"])

    # Delete document
    del_res = await client.delete(
        f"/api/v1/documents/{material_id}",
        headers=headers,
    )
    assert del_res.status_code == 200
    assert del_res.json()["message"] == "Document deleted successfully"

    # Verify material deleted from DB
    mat = await db_session.get(StudyMaterial, material_id)
    assert mat is None

    # Verify associated chunks deleted from DB
    chunks = await db_session.execute(
        select(DocumentChunk).where(DocumentChunk.material_id == material_id)
    )
    assert len(chunks.scalars().all()) == 0
