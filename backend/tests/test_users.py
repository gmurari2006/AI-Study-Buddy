import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_current_user_profile_success(client: AsyncClient):
    """M1-TEST-09 & M1-TEST-13: Fetch authenticated user profile returns 200 OK and database user data."""
    reg_payload = {
        "email": "profile.test@university.edu",
        "password": "Password123!",
        "full_name": "Initial Name",
        "academic_year": "2nd Year CSE",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    token = reg_res.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    response = await client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "profile.test@university.edu"
    assert data["full_name"] == "Initial Name"
    assert data["academic_year"] == "2nd Year CSE"


@pytest.mark.asyncio
async def test_get_current_user_profile_unauthorized(client: AsyncClient):
    """M1-TEST-07b: Unauthenticated request to /users/me returns 401 Unauthorized."""
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_profile_invalid_token(client: AsyncClient):
    """M1-TEST-12: Request to /users/me with malformed JWT token returns 401 Unauthorized."""
    headers = {"Authorization": "Bearer invalid.jwt.token.string"}
    response = await client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_user_profile_success(client: AsyncClient):
    """M1-TEST-10: Update profile returns 200 OK and persists updated full_name and academic_year in DB."""
    reg_payload = {
        "email": "update.test@university.edu",
        "password": "Password123!",
        "full_name": "Original Name",
        "academic_year": "1st Year CSE",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    token = reg_res.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    update_payload = {
        "full_name": "Updated Name",
        "academic_year": "3rd Year CSE",
    }
    response = await client.put("/api/v1/users/me", json=update_payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Name"
    assert data["academic_year"] == "3rd Year CSE"

    # Re-fetch profile to verify database persistence
    get_res = await client.get("/api/v1/users/me", headers=headers)
    assert get_res.json()["full_name"] == "Updated Name"


@pytest.mark.asyncio
async def test_update_user_profile_unauthorized(client: AsyncClient):
    """M1-TEST-07c: Unauthenticated request to update profile returns 401 Unauthorized."""
    update_payload = {"full_name": "Hacker Name"}
    response = await client.put("/api/v1/users/me", json=update_payload)
    assert response.status_code == 401
