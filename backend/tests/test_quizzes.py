import uuid

import pytest
from httpx import AsyncClient

SAMPLE_PDF_BYTES = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Count 1\n/Kids [3 0 R]\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources << >>\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<< /Length 85 >>\nstream\nBT\n/F1 12 Tf\n72 712 Td\n(Relational Algebra Selection Operator filters rows: sigma_condition\\(Relation\\)) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000060 00000 n \n0000000125 00000 n \n0000000214 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n350\n%%EOF"


async def setup_user_subject_material(client: AsyncClient, prefix: str = "quiz"):
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
    await client.post(
        "/api/v1/documents/upload",
        data={"subject_id": subject_id},
        files=files,
        headers=headers,
    )

    return token, headers, subject_id


@pytest.mark.asyncio
async def test_generate_quiz_success(client: AsyncClient):
    _, headers, subject_id = await setup_user_subject_material(client, "quizgen")

    response = await client.post(
        "/api/v1/quizzes/generate",
        json={"subject_id": subject_id, "total_questions": 5},
        headers=headers,
    )

    assert response.status_code == 201
    data = response.json()
    assert "quiz_id" in data
    assert data["total_questions"] == 5
    assert len(data["questions"]) == 5
    assert "options" in data["questions"][0]
    assert len(data["questions"][0]["options"]) == 4


@pytest.mark.asyncio
async def test_generate_quiz_unauthenticated_fails(client: AsyncClient):
    fake_id = str(uuid.uuid4())
    response = await client.post(
        "/api/v1/quizzes/generate",
        json={"subject_id": fake_id},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_generate_quiz_cross_user_isolation(client: AsyncClient):
    _, _, subject_id_A = await setup_user_subject_material(client, "quizuserA")
    _, headersB, _ = await setup_user_subject_material(client, "quizuserB")

    # User B tries to generate quiz for User A's subject -> 404
    response = await client.post(
        "/api/v1/quizzes/generate",
        json={"subject_id": subject_id_A},
        headers=headersB,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_quiz_by_id_hides_answers(client: AsyncClient):
    _, headers, subject_id = await setup_user_subject_material(client, "quizget")

    gen_res = await client.post(
        "/api/v1/quizzes/generate",
        json={"subject_id": subject_id},
        headers=headers,
    )
    quiz_id = gen_res.json()["quiz_id"]

    response = await client.get(
        f"/api/v1/quizzes/{quiz_id}",
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["quiz_id"] == quiz_id
    # Ensure correct_option_index is hidden from QuizQuestionItem schema
    assert "correct_option_index" not in data["questions"][0]


@pytest.mark.asyncio
async def test_submit_quiz_scoring_success(client: AsyncClient):
    _, headers, subject_id = await setup_user_subject_material(client, "quizsub")

    gen_res = await client.post(
        "/api/v1/quizzes/generate",
        json={"subject_id": subject_id},
        headers=headers,
    )
    quiz_id = gen_res.json()["quiz_id"]
    questions = gen_res.json()["questions"]

    # Build submission answers payload
    answers = [{"question_id": q["id"], "selected_option_index": 0} for q in questions]

    sub_res = await client.post(
        f"/api/v1/quizzes/{quiz_id}/submit",
        json={"answers": answers},
        headers=headers,
    )

    assert sub_res.status_code == 200
    data = sub_res.json()
    assert data["quiz_id"] == quiz_id
    assert "score_achieved" in data
    assert "percentage_score" in data
    assert "feedback" in data
    assert len(data["question_results"]) == len(questions)
    assert "correct_option_index" in data["question_results"][0]
    assert "explanation" in data["question_results"][0]


@pytest.mark.asyncio
async def test_submit_quiz_cross_user_isolation(client: AsyncClient):
    _, headersA, subject_idA = await setup_user_subject_material(client, "quizisoA")
    gen_res = await client.post(
        "/api/v1/quizzes/generate",
        json={"subject_id": subject_idA},
        headers=headersA,
    )
    quiz_id = gen_res.json()["quiz_id"]

    _, headersB, _ = await setup_user_subject_material(client, "quizisoB")

    sub_res = await client.post(
        f"/api/v1/quizzes/{quiz_id}/submit",
        json={"answers": []},
        headers=headersB,
    )
    assert sub_res.status_code == 404


@pytest.mark.asyncio
async def test_generate_quiz_no_documents_fails(client: AsyncClient):
    # Register user & subject without uploading documents
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": "nodocs.test@university.edu", "password": "Password123!"},
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
        "/api/v1/quizzes/generate",
        json={"subject_id": subject_id},
        headers=headers,
    )
    assert response.status_code == 400
    assert "No processed study materials" in response.json()["detail"]


@pytest.mark.asyncio
async def test_list_subject_quizzes_success(client: AsyncClient):
    _, headers, subject_id = await setup_user_subject_material(client, "quizlist")

    await client.post(
        "/api/v1/quizzes/generate",
        json={"subject_id": subject_id},
        headers=headers,
    )

    response = await client.get(
        f"/api/v1/quizzes/subject/{subject_id}",
        headers=headers,
    )

    assert response.status_code == 200
    quizzes = response.json()
    assert isinstance(quizzes, list)
    assert len(quizzes) >= 1


@pytest.mark.asyncio
async def test_quiz_scoring_variations(client: AsyncClient):
    _, headers, subject_id = await setup_user_subject_material(client, "quizscorevar")

    gen_res = await client.post(
        "/api/v1/quizzes/generate",
        json={"subject_id": subject_id},
        headers=headers,
    )
    quiz_id = gen_res.json()["quiz_id"]
    questions = gen_res.json()["questions"]

    # Retrieve stored questions from database/service or submission attempt to get correct indices
    # We can perform a 0-scoring attempt first to get the correct_option_index from the response question_results
    init_res = await client.post(
        f"/api/v1/quizzes/{quiz_id}/submit",
        json={"answers": []},
        headers=headers,
    )
    q_results = init_res.json()["question_results"]
    correct_indices = {r["question_id"]: r["correct_option_index"] for r in q_results}

    # 5/5 correct (100%)
    ans_5 = [{"question_id": q["id"], "selected_option_index": correct_indices[q["id"]]} for q in questions]
    res_5 = await client.post(f"/api/v1/quizzes/{quiz_id}/submit", json={"answers": ans_5}, headers=headers)
    assert res_5.status_code == 200
    assert res_5.json()["score_achieved"] == 5
    assert res_5.json()["percentage_score"] == 100.0

    # 4/5 correct (80%)
    ans_4 = [
        {"question_id": questions[i]["id"], "selected_option_index": correct_indices[questions[i]["id"]] if i < 4 else (correct_indices[questions[i]["id"]] + 1) % 4}
        for i in range(5)
    ]
    res_4 = await client.post(f"/api/v1/quizzes/{quiz_id}/submit", json={"answers": ans_4}, headers=headers)
    assert res_4.status_code == 200
    assert res_4.json()["score_achieved"] == 4
    assert res_4.json()["percentage_score"] == 80.0

    # 3/5 correct (60%)
    ans_3 = [
        {"question_id": questions[i]["id"], "selected_option_index": correct_indices[questions[i]["id"]] if i < 3 else (correct_indices[questions[i]["id"]] + 1) % 4}
        for i in range(5)
    ]
    res_3 = await client.post(f"/api/v1/quizzes/{quiz_id}/submit", json={"answers": ans_3}, headers=headers)
    assert res_3.status_code == 200
    assert res_3.json()["score_achieved"] == 3
    assert res_3.json()["percentage_score"] == 60.0

    # 2/5 correct (40%)
    ans_2 = [
        {"question_id": questions[i]["id"], "selected_option_index": correct_indices[questions[i]["id"]] if i < 2 else (correct_indices[questions[i]["id"]] + 1) % 4}
        for i in range(5)
    ]
    res_2 = await client.post(f"/api/v1/quizzes/{quiz_id}/submit", json={"answers": ans_2}, headers=headers)
    assert res_2.status_code == 200
    assert res_2.json()["score_achieved"] == 2
    assert res_2.json()["percentage_score"] == 40.0

    # 1/5 correct (20%)
    ans_1 = [
        {"question_id": questions[i]["id"], "selected_option_index": correct_indices[questions[i]["id"]] if i < 1 else (correct_indices[questions[i]["id"]] + 1) % 4}
        for i in range(5)
    ]
    res_1 = await client.post(f"/api/v1/quizzes/{quiz_id}/submit", json={"answers": ans_1}, headers=headers)
    assert res_1.status_code == 200
    assert res_1.json()["score_achieved"] == 1
    assert res_1.json()["percentage_score"] == 20.0

    # 0/5 correct (0%)
    ans_0 = [
        {"question_id": q["id"], "selected_option_index": (correct_indices[q["id"]] + 1) % 4}
        for q in questions
    ]
    res_0 = await client.post(f"/api/v1/quizzes/{quiz_id}/submit", json={"answers": ans_0}, headers=headers)
    assert res_0.status_code == 200
    assert res_0.json()["score_achieved"] == 0
    assert res_0.json()["percentage_score"] == 0.0


@pytest.mark.asyncio
async def test_quiz_submission_invalid_answers_rejection(client: AsyncClient):
    _, headers, subject_id = await setup_user_subject_material(client, "quizinvalid")

    gen_res = await client.post(
        "/api/v1/quizzes/generate",
        json={"subject_id": subject_id},
        headers=headers,
    )
    quiz_id = gen_res.json()["quiz_id"]
    questions = gen_res.json()["questions"]

    # Invalid option index > 3
    bad_option_answers = [{"question_id": q["id"], "selected_option_index": 99} for q in questions]
    res_bad_opt = await client.post(
        f"/api/v1/quizzes/{quiz_id}/submit",
        json={"answers": bad_option_answers},
        headers=headers,
    )
    assert res_bad_opt.status_code == 422

    # Invalid question ID not belonging to quiz
    fake_q_id = str(uuid.uuid4())
    bad_q_answers = [{"question_id": fake_q_id, "selected_option_index": 0}]
    res_bad_q = await client.post(
        f"/api/v1/quizzes/{quiz_id}/submit",
        json={"answers": bad_q_answers},
        headers=headers,
    )
    assert res_bad_q.status_code == 400

