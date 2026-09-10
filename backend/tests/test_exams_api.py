import pytest

from app.core.security import create_access_token

pytestmark = [pytest.mark.asyncio(loop_scope="session"), pytest.mark.usefixtures("db_ready")]


def auth_header(user) -> dict:
    token = create_access_token(user.id, user.role.value)
    return {"Authorization": f"Bearer {token}"}


async def test_public_can_list_exams_without_auth(client, admin_user):
    create = await client.post(
        "/admin/exams",
        json={"title": "BUET Admission Test", "category": "admission", "exam_date": "2026-12-15"},
        headers=auth_header(admin_user),
    )
    assert create.status_code == 201

    resp = await client.get("/exams")
    assert resp.status_code == 200
    titles = [e["title"] for e in resp.json()]
    assert "BUET Admission Test" in titles


async def test_non_admin_cannot_create_exam(client, student_user):
    resp = await client.post(
        "/admin/exams",
        json={"title": "SSC 2027", "category": "ssc", "exam_date": "2027-02-01"},
        headers=auth_header(student_user),
    )
    assert resp.status_code == 403


async def test_admin_update_invalidates_cache(client, admin_user):
    create = await client.post(
        "/admin/exams",
        json={"title": "HSC 2026", "category": "hsc", "exam_date": "2026-11-01"},
        headers=auth_header(admin_user),
    )
    exam_id = create.json()["id"]

    # warm the public cache
    await client.get(f"/exams/{exam_id}")

    updated = await client.put(
        f"/admin/exams/{exam_id}",
        json={"title": "HSC 2026 (Updated)"},
        headers=auth_header(admin_user),
    )
    assert updated.status_code == 200

    resp = await client.get(f"/exams/{exam_id}")
    assert resp.json()["title"] == "HSC 2026 (Updated)"


async def test_follow_and_unfollow_exam(client, admin_user):
    create = await client.post(
        "/admin/exams",
        json={"title": "DU Admission Test", "category": "admission", "exam_date": "2026-10-10"},
        headers=auth_header(admin_user),
    )
    exam_id = create.json()["id"]

    follow = await client.post(f"/exams/{exam_id}/follow", headers=auth_header(admin_user))
    assert follow.status_code == 201

    unfollow = await client.delete(f"/exams/{exam_id}/follow", headers=auth_header(admin_user))
    assert unfollow.status_code == 204
