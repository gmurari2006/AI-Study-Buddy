import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.conversation import Conversation
from app.models.message import Message

SAMPLE_PDF_BYTES = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Count 1\n/Kids [3 0 R]\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources << >>\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<< /Length 75 >>\nstream\nBT\n/F1 12 Tf\n72 712 Td\n(Relational Algebra Selection Operator filters rows in a table) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000060 00000 n \n0000000125 00000 n \n0000000214 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n340\n%%EOF"


async def setup_user_and_subject(client: AsyncClient, email_prefix: str = "chat"):
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": f"{email_prefix}.test@university.edu", "password": "Password123!"},
    )
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    subj_res = await client.post(
        "/api/v1/subjects",
        json={"name": "Database Management Systems", "code": "CS302"},
        headers=headers,
    )
    subject_id = subj_res.json()["id"]
    return token, headers, subject_id


@pytest.mark.asyncio
async def test_create_conversation_success(client: AsyncClient):
    _, headers, subject_id = await setup_user_and_subject(client, "convcreate")

    response = await client.post(
        "/api/v1/chat/conversations",
        json={"subject_id": subject_id, "title": "DBMS Midterm Review"},
        headers=headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "DBMS Midterm Review"
    assert data["subject_id"] == subject_id
    assert "id" in data


@pytest.mark.asyncio
async def test_list_subject_conversations(client: AsyncClient):
    _, headers, subject_id = await setup_user_and_subject(client, "convlist")

    await client.post(
        "/api/v1/chat/conversations",
        json={"subject_id": subject_id, "title": "Session 1"},
        headers=headers,
    )
    await client.post(
        "/api/v1/chat/conversations",
        json={"subject_id": subject_id, "title": "Session 2"},
        headers=headers,
    )

    response = await client.get(
        f"/api/v1/chat/conversations/{subject_id}",
        headers=headers,
    )

    assert response.status_code == 200
    convs = response.json()
    assert isinstance(convs, list)
    assert len(convs) >= 2


@pytest.mark.asyncio
async def test_chat_query_grounded_response_with_citations(client: AsyncClient):
    _, headers, subject_id = await setup_user_and_subject(client, "ragquery")

    # 1. Upload document for RAG vector search
    files = {"file": ("dbms_relational.pdf", SAMPLE_PDF_BYTES, "application/pdf")}
    await client.post(
        "/api/v1/documents/upload",
        data={"subject_id": subject_id},
        files=files,
        headers=headers,
    )

    # 2. Create conversation
    conv_res = await client.post(
        "/api/v1/chat/conversations",
        json={"subject_id": subject_id, "title": "Relational Algebra Q&A"},
        headers=headers,
    )
    conversation_id = conv_res.json()["id"]

    # 3. Submit RAG query
    query_payload = {
        "subject_id": subject_id,
        "conversation_id": conversation_id,
        "query": "What is the Selection Operator in Relational Algebra?",
    }
    response = await client.post(
        "/api/v1/chat/query",
        json=query_payload,
        headers=headers,
    )

    assert response.status_code == 200
    msg = response.json()
    assert msg["sender_type"] == "assistant"
    assert "Selection" in msg["content"] or "Relational Algebra" in msg["content"]
    assert msg["citations"] is not None
    assert len(msg["citations"]) >= 1
    assert msg["citations"][0]["file_name"] == "dbms_relational.pdf"


@pytest.mark.asyncio
async def test_chat_query_no_relevant_context_fallback(client: AsyncClient):
    _, headers, subject_id = await setup_user_and_subject(client, "fallback")

    conv_res = await client.post(
        "/api/v1/chat/conversations",
        json={"subject_id": subject_id, "title": "Empty Subject Chat"},
        headers=headers,
    )
    conversation_id = conv_res.json()["id"]

    query_payload = {
        "subject_id": subject_id,
        "conversation_id": conversation_id,
        "query": "Explain Quantum Entanglement physics.",
    }
    response = await client.post(
        "/api/v1/chat/query",
        json=query_payload,
        headers=headers,
    )

    assert response.status_code == 200
    msg = response.json()
    assert "I could not find a direct answer in your uploaded materials." in msg["content"]
    assert msg["citations"] == []


@pytest.mark.asyncio
async def test_get_conversation_message_history(client: AsyncClient):
    _, headers, subject_id = await setup_user_and_subject(client, "msghistory")

    conv_res = await client.post(
        "/api/v1/chat/conversations",
        json={"subject_id": subject_id},
        headers=headers,
    )
    conversation_id = conv_res.json()["id"]

    await client.post(
        "/api/v1/chat/query",
        json={
            "subject_id": subject_id,
            "conversation_id": conversation_id,
            "query": "What is SQL?",
        },
        headers=headers,
    )

    response = await client.get(
        f"/api/v1/chat/messages/{conversation_id}",
        headers=headers,
    )

    assert response.status_code == 200
    messages = response.json()
    assert len(messages) >= 2  # 1 user + 1 assistant
    assert messages[0]["sender_type"] == "user"
    assert messages[1]["sender_type"] == "assistant"


@pytest.mark.asyncio
async def test_chat_unauthenticated_fails(client: AsyncClient):
    fake_id = str(uuid.uuid4())
    res1 = await client.get(f"/api/v1/chat/conversations/{fake_id}")
    assert res1.status_code == 401

    res2 = await client.post(
        "/api/v1/chat/query",
        json={
            "subject_id": fake_id,
            "conversation_id": fake_id,
            "query": "Test",
        },
    )
    assert res2.status_code == 401


@pytest.mark.asyncio
async def test_cross_user_chat_isolation(client: AsyncClient):
    _, headersA, subject_idA = await setup_user_and_subject(client, "userAchat")

    conv_res = await client.post(
        "/api/v1/chat/conversations",
        json={"subject_id": subject_idA, "title": "User A Private Chat"},
        headers=headersA,
    )
    conversation_id = conv_res.json()["id"]

    # Setup User B
    _, headersB, _ = await setup_user_and_subject(client, "userBchat")

    # User B tries to get User A's messages -> 404
    msg_res = await client.get(
        f"/api/v1/chat/messages/{conversation_id}",
        headers=headersB,
    )
    assert msg_res.status_code == 404

    # User B tries to query User A's conversation -> 404
    query_res = await client.post(
        "/api/v1/chat/query",
        json={
            "subject_id": subject_idA,
            "conversation_id": conversation_id,
            "query": "Hack User A",
        },
        headers=headersB,
    )
    assert query_res.status_code == 404


@pytest.mark.asyncio
async def test_delete_conversation_success(
    client: AsyncClient, db_session: AsyncSession
):
    _, headers, subject_id = await setup_user_and_subject(client, "chatdel")

    conv_res = await client.post(
        "/api/v1/chat/conversations",
        json={"subject_id": subject_id},
        headers=headers,
    )
    conversation_id = uuid.UUID(conv_res.json()["id"])

    # Query chat to populate messages
    await client.post(
        "/api/v1/chat/query",
        json={
            "subject_id": str(subject_id),
            "conversation_id": str(conversation_id),
            "query": "Test query",
        },
        headers=headers,
    )

    # Delete conversation
    del_res = await client.delete(
        f"/api/v1/chat/conversations/{conversation_id}",
        headers=headers,
    )
    assert del_res.status_code == 200
    assert del_res.json()["message"] == "Conversation deleted successfully"

    # Verify conversation deleted from DB
    conv = await db_session.get(Conversation, conversation_id)
    assert conv is None

    # Verify cascade messages deleted from DB
    msgs = await db_session.execute(
        select(Message).where(Message.conversation_id == conversation_id)
    )
    assert len(msgs.scalars().all()) == 0
