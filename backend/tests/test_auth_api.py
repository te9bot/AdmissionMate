import pytest

pytestmark = [pytest.mark.asyncio(loop_scope="session"), pytest.mark.usefixtures("db_ready")]


async def test_otp_login_flow_issues_tokens(client):
    email = "student@admissionmate-dev.com"

    resp = await client.post("/auth/request-otp", json={"email": email, "name": "Student"})
    assert resp.status_code == 200
    dev_code = resp.json()["dev_code"]
    assert dev_code is not None  # DEBUG=true in test settings echoes the code

    resp = await client.post("/auth/verify-otp", json={"email": email, "code": dev_code})
    assert resp.status_code == 200
    body = resp.json()
    assert body["user"]["email"] == email
    assert body["user"]["role"] == "student"
    assert body["access_token"]
    assert body["refresh_token"]


async def test_verify_otp_with_wrong_code_fails(client):
    email = "student2@admissionmate-dev.com"
    await client.post("/auth/request-otp", json={"email": email})

    resp = await client.post("/auth/verify-otp", json={"email": email, "code": "000000"})
    assert resp.status_code == 400


async def test_refresh_token_issues_new_access_token(client):
    email = "student3@admissionmate-dev.com"
    resp = await client.post("/auth/request-otp", json={"email": email})
    dev_code = resp.json()["dev_code"]
    verify = await client.post("/auth/verify-otp", json={"email": email, "code": dev_code})
    refresh_token = verify.json()["refresh_token"]

    resp = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    assert resp.json()["access_token"]
