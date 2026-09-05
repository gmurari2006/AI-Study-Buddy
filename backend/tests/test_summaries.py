import uuid

import pytest
from httpx import AsyncClient

SAMPLE_PDF_BYTES = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Count 1\n/Kids [3 0 R]\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources << >>\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<< /Length 85 >>\nstream\nBT\n/F1 12 Tf\n72 712 Td\n(Relational Algebra Selection Operator filters rows: sigma_condition\\(Relation\\)) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000060 00000 n \n0000000125 00000 n \n0000000214 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n350\n%%EOF"


async def setup_user_subject_material(client: AsyncClient, prefix: str = "summary"):
    # 1. Register & login
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": f"{prefix}.test@university.edu", "password": "Password123!"},
    )
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create subject
    subj_res = await client.post(
        "/api/v1/subjects",
        json={"name": "Database Systems", "code": "CS302"},
        headers=headers,
    )
    subject_id = subj_res.json()["id"]

    # 3. Upload document
    files = {"file": ("relational_algebra.pdf", SAMPLE_PDF_BYTES, "application/pdf")}
    upload_res = await client.post(
        "/api/v1/documents/upload",
        data={"subject_id": subject_id},
        files=files,
        headers=headers,
    )
    material_id = upload_res.json()["material_id"]

    return token, headers, subject_id, material_id


@pytest.mark.asyncio
async def test_generate_summary_success(client: AsyncClient):
    _, headers, _, material_id = await setup_user_subject_material(client, "sumsuccess")

    response = await client.post(
        "/api/v1/summaries/generate",
        json={
            "material_id": material_id,
            "summary_type": "KEY_POINTS_AND_FORMULAS",
        },
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["material_id"] == material_id
    assert data["summary_type"] == "KEY_POINTS_AND_FORMULAS"
    assert "executive_summary" in data
    assert isinstance(data["key_takeaways"], list)
    assert len(data["key_takeaways"]) > 0
    assert isinstance(data["formula_index"], list)
    assert len(data["formula_index"]) > 0


@pytest.mark.asyncio
async def test_generate_summary_unauthenticated_fails(client: AsyncClient):
    fake_id = str(uuid.uuid4())
    response = await client.post(
        "/api/v1/summaries/generate",
        json={"material_id": fake_id, "summary_type": "EXECUTIVE_SUMMARY"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_generate_summary_cross_user_isolation(client: AsyncClient):
    # User A creates material
    _, _, _, material_id_A = await setup_user_subject_material(client, "userAsum")

    # User B logs in
    _, headersB, _, _ = await setup_user_subject_material(client, "userBsum")

    # User B attempts to generate summary for User A's material -> 404
    response = await client.post(
        "/api/v1/summaries/generate",
        json={"material_id": material_id_A},
        headers=headersB,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_generate_summary_nonexistent_material_fails(client: AsyncClient):
    _, headers, _, _ = await setup_user_subject_material(client, "nonexist")
    fake_id = str(uuid.uuid4())

    response = await client.post(
        "/api/v1/summaries/generate",
        json={"material_id": fake_id},
        headers=headers,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_supported_summary_types(client: AsyncClient):
    _, headers, _, material_id = await setup_user_subject_material(client, "sumtypes")

    for st in ["EXECUTIVE_SUMMARY", "KEY_POINTS", "FORMULA_SHEET", "DETAILED_SUMMARY"]:
        res = await client.post(
            "/api/v1/summaries/generate",
            json={"material_id": material_id, "summary_type": st},
            headers=headers,
        )
        assert res.status_code == 200
        data = res.json()
        assert data["summary_type"] == st
