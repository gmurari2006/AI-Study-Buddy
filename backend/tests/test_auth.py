import pytest
from httpx import AsyncClient
from jose import jwt

from app.core.config import settings


@pytest.mark.asyncio
async def test_register_user_success(client: AsyncClient):
    """M1-TEST-01: User registration with valid payload returns 201 and JWT token."""
    payload = {
        "email": "alex.test@university.edu",
        "password": "SecurePassword123!",
        "full_name": "Alex Student",
        "academic_year": "3rd Year CSE",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "alex.test@university.edu"
    assert data["user"]["full_name"] == "Alex Student"


@pytest.mark.asyncio
async def test_register_duplicate_email_fails(client: AsyncClient):
    """M1-TEST-16a: User registration with duplicate email returns 400 Bad Request."""
    payload = {
        "email": "duplicate@university.edu",
        "password": "Password123!",
        "full_name": "First User",
    }
    res1 = await client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = await client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already registered" in res2.json()["detail"]


@pytest.mark.asyncio
async def test_register_invalid_email_validation(client: AsyncClient):
    """M1-TEST-11a: Registration with invalid email format returns 422 Unprocessable Entity."""
    payload = {
        "email": "invalid-email-format",
        "password": "Password123!",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_register_short_password_validation(client: AsyncClient):
    """M1-TEST-11b: Registration with password under min length returns 422 Unprocessable Entity."""
    payload = {
        "email": "valid@university.edu",
        "password": "123",  # Under 6 characters
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_user_success(client: AsyncClient):
    """M1-TEST-02 & M1-TEST-17: User login with valid credentials returns 200 OK and valid JWT."""
    reg_payload = {
        "email": "login.test@university.edu",
        "password": "MySecretPassword123",
        "full_name": "Priya Test",
    }
    await client.post("/api/v1/auth/register", json=reg_payload)

    login_payload = {
        "email": "login.test@university.edu",
        "password": "MySecretPassword123",
    }
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data

    # Verify JWT claims
    decoded = jwt.decode(data["access_token"], settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    assert "sub" in decoded
    assert "exp" in decoded


@pytest.mark.asyncio
async def test_login_invalid_password_fails(client: AsyncClient):
    """M1-TEST-08: User login with wrong password returns 401 Unauthorized."""
    reg_payload = {
        "email": "invalid.pw@university.edu",
        "password": "CorrectPassword123",
    }
    await client.post("/api/v1/auth/register", json=reg_payload)

    wrong_login = {
        "email": "invalid.pw@university.edu",
        "password": "WrongPassword999",
    }
    response = await client.post("/api/v1/auth/login", json=wrong_login)
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


@pytest.mark.asyncio
async def test_login_nonexistent_user_fails(client: AsyncClient):
    """M1-TEST-08b: User login with non-existent email returns 401 Unauthorized."""
    login_payload = {
        "email": "nonexistent@university.edu",
        "password": "Password123!",
    }
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_logout_authenticated_success(client: AsyncClient):
    """M1-TEST-03: Protected logout endpoint with valid token returns 200 OK."""
    reg_payload = {
        "email": "logout.user@university.edu",
        "password": "Password123!",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    token = reg_res.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    response = await client.post("/api/v1/auth/logout", headers=headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"


@pytest.mark.asyncio
async def test_logout_unauthenticated_fails(client: AsyncClient):
    """M1-TEST-07a: Unauthenticated call to logout endpoint returns 401 Unauthorized."""
    response = await client.post("/api/v1/auth/logout")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_dev_auth_bypass_disabled_rejects_demo_token(client: AsyncClient, monkeypatch: pytest.MonkeyPatch):
    """Demo token is rejected when DEV_AUTH_BYPASS is False."""
    monkeypatch.setattr(settings, "DEV_AUTH_BYPASS", False)
    headers = {"Authorization": "Bearer dev-test-token-bypass"}
    response = await client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"


@pytest.mark.asyncio
async def test_dev_auth_bypass_missing_demo_student_creates_user(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
):
    """Demo token creates the Demo Student user with a real database UUID when missing and DEV_AUTH_BYPASS is True."""
    monkeypatch.setattr(settings, "DEV_AUTH_BYPASS", True)
    headers = {"Authorization": "Bearer dev-test-token-bypass"}

    response = await client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 200
    user = response.json()
    assert user["email"] == "demo.student@university.edu"
    assert user["full_name"] == "Demo Student"
    assert user["academic_year"] == "3rd Year CSE"
    assert "id" in user and user["id"]


@pytest.mark.asyncio
async def test_dev_auth_bypass_existing_demo_student_returns_existing_uuid(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
):
    """Demo token returns existing Demo Student user's real UUID when already present."""
    monkeypatch.setattr(settings, "DEV_AUTH_BYPASS", True)

    reg_payload = {
        "email": "demo.student@university.edu",
        "password": "Password123!",
        "full_name": "Demo Student",
        "academic_year": "3rd Year CSE",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    registered_id = reg_res.json()["user"]["id"]

    headers = {"Authorization": "Bearer dev-test-token-bypass"}
    response = await client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 200
    user = response.json()
    assert user["id"] == registered_id
    assert user["email"] == "demo.student@university.edu"


@pytest.mark.asyncio
async def test_dev_auth_bypass_repeated_requests_do_not_duplicate(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
):
    """Repeated demo-token requests return the same user without creating duplicates."""
    monkeypatch.setattr(settings, "DEV_AUTH_BYPASS", True)
    headers = {"Authorization": "Bearer dev-test-token-bypass"}

    res1 = await client.get("/api/v1/users/me", headers=headers)
    assert res1.status_code == 200
    user1_id = res1.json()["id"]

    res2 = await client.get("/api/v1/users/me", headers=headers)
    assert res2.status_code == 200
    user2_id = res2.json()["id"]

    assert user1_id == user2_id


@pytest.mark.asyncio
async def test_dev_auth_bypass_normal_jwt_still_works(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
):
    """Normal JWT authentication works even when DEV_AUTH_BYPASS is True."""
    monkeypatch.setattr(settings, "DEV_AUTH_BYPASS", True)

    reg_payload = {
        "email": "normal.jwt@university.edu",
        "password": "Password123!",
        "full_name": "Normal User",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    token = reg_res.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}
    response = await client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["email"] == "normal.jwt@university.edu"


