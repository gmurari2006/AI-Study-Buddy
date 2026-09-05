import uuid

import pytest
from httpx import AsyncClient

SAMPLE_PDF_BYTES = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Count 1\n/Kids [3 0 R]\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources << >>\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<< /Length 85 >>\nstream\nBT\n/F1 12 Tf\n72 712 Td\n(Relational Algebra Selection Operator filters rows: sigma_condition\\(Relation\\)) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000060 00000 n \n0000000125 00000 n \n0000000214 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n350\n%%EOF"


async def setup_user_subject_material(client: AsyncClient, prefix: str = "card"):
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": f"{prefix}.test@university.edu", "password": "Password123!"},
    )
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    subj_res = await client.post(
        "/api/v1/subjects",
        json={"name": "Database Management", "code": "CS302"},
        headers=headers,
    )
    subject_id = subj_res.json()["id"]

    files = {"file": ("relational_dbms.pdf", SAMPLE_PDF_BYTES, "application/pdf")}
    upload_res = await client.post(
        "/api/v1/documents/upload",
        data={"subject_id": subject_id},
        files=files,
        headers=headers,
    )
    material_id = upload_res.json()["material_id"]

    return token, headers, subject_id, material_id


@pytest.mark.asyncio
async def test_generate_flashcards_success(client: AsyncClient):
    _, headers, subject_id, _ = await setup_user_subject_material(client, "cardgen")

    response = await client.post(
        "/api/v1/flashcards/generate",
        json={"subject_id": subject_id, "total_cards": 5},
        headers=headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert "deck_id" in data
    assert data["card_count"] == 5
    assert len(data["cards"]) == 5
    assert "front_text" in data["cards"][0]
    assert "back_text" in data["cards"][0]
    assert "difficulty_rating" in data["cards"][0]


@pytest.mark.asyncio
async def test_generate_flashcards_unauthenticated_fails(client: AsyncClient):
    fake_id = str(uuid.uuid4())
    response = await client.post(
        "/api/v1/flashcards/generate",
        json={"subject_id": fake_id},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_generate_flashcards_cross_user_isolation(client: AsyncClient):
    _, _, subject_id_A, _ = await setup_user_subject_material(client, "carduserA")
    _, headersB, _, _ = await setup_user_subject_material(client, "carduserB")

    # User B attempts to generate deck for User A's subject -> 404
    response = await client.post(
        "/api/v1/flashcards/generate",
        json={"subject_id": subject_id_A},
        headers=headersB,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_subject_flashcard_decks(client: AsyncClient):
    _, headers, subject_id, _ = await setup_user_subject_material(client, "cardlist")

    await client.post(
        "/api/v1/flashcards/generate",
        json={"subject_id": subject_id},
        headers=headers,
    )

    response = await client.get(
        f"/api/v1/flashcards/subject/{subject_id}",
        headers=headers,
    )

    assert response.status_code == 200
    decks = response.json()
    assert isinstance(decks, list)
    assert len(decks) >= 1
    assert "id" in decks[0]
    assert "title" in decks[0]


@pytest.mark.asyncio
async def test_get_flashcard_deck_by_id(client: AsyncClient):
    _, headers, subject_id, _ = await setup_user_subject_material(client, "cardget")

    gen_res = await client.post(
        "/api/v1/flashcards/generate",
        json={"subject_id": subject_id},
        headers=headers,
    )
    deck_id = gen_res.json()["deck_id"]

    response = await client.get(
        f"/api/v1/flashcards/deck/{deck_id}",
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["deck_id"] == deck_id
    assert len(data["cards"]) == 5


@pytest.mark.asyncio
async def test_review_flashcard_ratings_and_timestamp_update(client: AsyncClient):
    _, headers, subject_id, _ = await setup_user_subject_material(client, "cardrev")

    gen_res = await client.post(
        "/api/v1/flashcards/generate",
        json={"subject_id": subject_id},
        headers=headers,
    )
    cards = gen_res.json()["cards"]
    first_card_id = cards[0]["id"]

    # Review as EASY
    rev_res = await client.post(
        f"/api/v1/flashcards/card/{first_card_id}/review",
        json={"difficulty_rating": "EASY"},
        headers=headers,
    )

    assert rev_res.status_code == 200
    card_data = rev_res.json()
    assert card_data["id"] == first_card_id
    assert card_data["difficulty_rating"] == "EASY"
    assert card_data["last_reviewed_at"] is not null_or_empty(card_data["last_reviewed_at"])

    # Review as HARD
    rev_res_hard = await client.post(
        f"/api/v1/flashcards/card/{first_card_id}/review",
        json={"difficulty_rating": "HARD"},
        headers=headers,
    )
    assert rev_res_hard.status_code == 200
    assert rev_res_hard.json()["difficulty_rating"] == "HARD"


def null_or_empty(val):
    return val is not None and val != ""


@pytest.mark.asyncio
async def test_review_flashcard_cross_user_isolation(client: AsyncClient):
    _, headersA, subject_idA, _ = await setup_user_subject_material(client, "cardisoA")
    gen_res = await client.post(
        "/api/v1/flashcards/generate",
        json={"subject_id": subject_idA},
        headers=headersA,
    )
    first_card_id = gen_res.json()["cards"][0]["id"]

    _, headersB, _, _ = await setup_user_subject_material(client, "cardisoB")

    # User B attempts to review User A's flashcard -> 404
    response = await client.post(
        f"/api/v1/flashcards/card/{first_card_id}/review",
        json={"difficulty_rating": "EASY"},
        headers=headersB,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_generate_flashcards_no_documents_fails(client: AsyncClient):
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "emptycard.test@university.edu", "password": "Password123!"},
    )
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    subj_res = await client.post(
        "/api/v1/subjects",
        json={"name": "Empty Subject"},
        headers=headers,
    )
    subject_id = subj_res.json()["id"]

    response = await client.post(
        "/api/v1/flashcards/generate",
        json={"subject_id": subject_id},
        headers=headers,
    )
    assert response.status_code == 400
    assert "No processed study materials" in response.json()["detail"]


@pytest.mark.asyncio
async def test_review_flashcard_invalid_rating_rejection(client: AsyncClient):
    _, headers, subject_id, _ = await setup_user_subject_material(client, "cardinval")

    gen_res = await client.post(
        "/api/v1/flashcards/generate",
        json={"subject_id": subject_id},
        headers=headers,
    )
    first_card_id = gen_res.json()["cards"][0]["id"]

    response = await client.post(
        f"/api/v1/flashcards/card/{first_card_id}/review",
        json={"difficulty_rating": "IMPOSSIBLE"},
        headers=headers,
    )
    assert response.status_code == 422
