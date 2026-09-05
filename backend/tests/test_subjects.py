import uuid

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_subject_success(client: AsyncClient):
    """M2-TEST-01: Create subject with valid payload returns 201 Created."""
    reg_payload = {"email": "subj.creator@university.edu", "password": "Password123!"}
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    headers = {"Authorization": f"Bearer {reg_res.json()['access_token']}"}

    subj_payload = {
        "name": "Database Management Systems",
        "code": "CS302",
        "color_code": "#4F46E5",
    }
    response = await client.post("/api/v1/subjects", json=subj_payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Database Management Systems"
    assert data["code"] == "CS302"
    assert data["color_code"] == "#4F46E5"
    assert "id" in data


@pytest.mark.asyncio
async def test_list_subjects(client: AsyncClient):
    """M2-TEST-02: List subjects returns 200 OK with authenticated user's subjects."""
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "subj.lister@university.edu", "password": "Password123!"},
    )
    headers = {"Authorization": f"Bearer {reg_res.json()['access_token']}"}

    await client.post("/api/v1/subjects", json={"name": "Operating Systems", "code": "CS301"}, headers=headers)
    await client.post("/api/v1/subjects", json={"name": "Computer Networks", "code": "CS303"}, headers=headers)

    response = await client.get("/api/v1/subjects", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    names = [s["name"] for s in data]
    assert "Operating Systems" in names
    assert "Computer Networks" in names


@pytest.mark.asyncio
async def test_get_subject_by_id(client: AsyncClient):
    """M2-TEST-03: Fetch specific subject by ID returns 200 OK."""
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "subj.getter@university.edu", "password": "Password123!"},
    )
    headers = {"Authorization": f"Bearer {reg_res.json()['access_token']}"}

    create_res = await client.post(
        "/api/v1/subjects",
        json={"name": "Machine Learning", "code": "CS401"},
        headers=headers,
    )
    subj_id = create_res.json()["id"]

    response = await client.get(f"/api/v1/subjects/{subj_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Machine Learning"


@pytest.mark.asyncio
async def test_update_subject(client: AsyncClient):
    """M2-TEST-04: Update subject details returns 200 OK."""
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "subj.updater@university.edu", "password": "Password123!"},
    )
    headers = {"Authorization": f"Bearer {reg_res.json()['access_token']}"}

    create_res = await client.post(
        "/api/v1/subjects",
        json={"name": "Algorithms", "code": "CS201"},
        headers=headers,
    )
    subj_id = create_res.json()["id"]

    update_payload = {"name": "Advanced Algorithms", "code": "CS501", "color_code": "#10B981"}
    response = await client.put(f"/api/v1/subjects/{subj_id}", json=update_payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Advanced Algorithms"
    assert data["code"] == "CS501"
    assert data["color_code"] == "#10B981"


@pytest.mark.asyncio
async def test_delete_subject(client: AsyncClient):
    """M2-TEST-05: Delete subject returns 200 OK and subsequent GET returns 404."""
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "subj.deleter@university.edu", "password": "Password123!"},
    )
    headers = {"Authorization": f"Bearer {reg_res.json()['access_token']}"}

    create_res = await client.post(
        "/api/v1/subjects",
        json={"name": "Temporary Subject", "code": "TEMP101"},
        headers=headers,
    )
    subj_id = create_res.json()["id"]

    del_res = await client.delete(f"/api/v1/subjects/{subj_id}", headers=headers)
    assert del_res.status_code == 200

    get_res = await client.get(f"/api/v1/subjects/{subj_id}", headers=headers)
    assert get_res.status_code == 404


@pytest.mark.asyncio
async def test_create_subject_empty_name_fails(client: AsyncClient):
    """M2-TEST-06: Creating subject with empty or whitespace name returns 422."""
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "subj.validator@university.edu", "password": "Password123!"},
    )
    headers = {"Authorization": f"Bearer {reg_res.json()['access_token']}"}

    response = await client.post("/api/v1/subjects", json={"name": "   "}, headers=headers)
    assert response.status_code in (422, 400)


@pytest.mark.asyncio
async def test_subject_unauthenticated_fails(client: AsyncClient):
    """M2-TEST-08: Accessing subject endpoints without token returns 401 Unauthorized."""
    res1 = await client.get("/api/v1/subjects")
    assert res1.status_code == 401

    res2 = await client.post("/api/v1/subjects", json={"name": "Test"})
    assert res2.status_code == 401


@pytest.mark.asyncio
async def test_subject_cross_user_isolation(client: AsyncClient):
    """M2-TEST-09: User B attempting to view/edit/delete User A's subject returns 404 Not Found."""
    # User A creates subject
    reg_a = await client.post(
        "/api/v1/auth/register",
        json={"email": "usera@university.edu", "password": "Password123!"},
    )
    headers_a = {"Authorization": f"Bearer {reg_a.json()['access_token']}"}
    create_a = await client.post(
        "/api/v1/subjects",
        json={"name": "User A Private Subject"},
        headers=headers_a,
    )
    subj_id = create_a.json()["id"]

    # User B attempts to access User A's subject
    reg_b = await client.post(
        "/api/v1/auth/register",
        json={"email": "userb@university.edu", "password": "Password123!"},
    )
    headers_b = {"Authorization": f"Bearer {reg_b.json()['access_token']}"}

    get_res = await client.get(f"/api/v1/subjects/{subj_id}", headers=headers_b)
    assert get_res.status_code == 404

    put_res = await client.put(f"/api/v1/subjects/{subj_id}", json={"name": "Hacked Subject"}, headers=headers_b)
    assert put_res.status_code == 404

    del_res = await client.delete(f"/api/v1/subjects/{subj_id}", headers=headers_b)
    assert del_res.status_code == 404


@pytest.mark.asyncio
async def test_get_nonexistent_subject_fails(client: AsyncClient):
    """M2-TEST-10: Querying non-existent UUID returns 404 Not Found."""
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "subj.nonexistent@university.edu", "password": "Password123!"},
    )
    headers = {"Authorization": f"Bearer {reg_res.json()['access_token']}"}
    fake_id = uuid.uuid4()

    response = await client.get(f"/api/v1/subjects/{fake_id}", headers=headers)
    assert response.status_code == 404
