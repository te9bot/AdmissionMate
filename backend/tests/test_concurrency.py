import asyncio

import pytest

from app.core.security import create_access_token

pytestmark = [pytest.mark.asyncio(loop_scope="session"), pytest.mark.usefixtures("db_ready")]


def auth_header(user) -> dict:
    token = create_access_token(user.id, user.role.value)
    return {"Authorization": f"Bearer {token}"}


async def test_concurrent_follow_requests_dont_error_or_duplicate(client, admin_user, student_user):
    """Regression test: follow_exam used to check-then-insert against a unique
    constraint, so two concurrent follow requests for the same user+exam could
    race and the loser would 500 on an uncaught IntegrityError instead of
    returning the same followed-exam row."""
    create = await client.post(
        "/admin/exams",
        json={"title": "Concurrency Test Exam", "category": "admission", "exam_date": "2026-12-01"},
        headers=auth_header(admin_user),
    )
    assert create.status_code == 201
    exam_id = create.json()["id"]

    headers = auth_header(student_user)
    responses = await asyncio.gather(
        *[client.post(f"/exams/{exam_id}/follow", headers=headers) for _ in range(10)]
    )

    for resp in responses:
        assert resp.status_code == 201, resp.text

    followed = await client.get("/exams/me/followed", headers=headers)
    matching = [e for e in followed.json() if e["id"] == exam_id]
    assert len(matching) == 1


async def test_concurrent_otp_requests_are_rate_limited_not_erroring(client):
    """Bursting the OTP endpoint concurrently should produce clean 200s and 429s,
    never an unhandled error, even though the per-email limiter is Redis-backed
    and shared across concurrent requests."""
    payload = {"email": "concurrent-otp@admissionmate-dev.com", "name": "Concurrent"}
    responses = await asyncio.gather(
        *[client.post("/auth/request-otp", json=payload) for _ in range(8)]
    )

    statuses = {resp.status_code for resp in responses}
    assert statuses <= {200, 429}
    assert 200 in statuses
