import uuid

from app.core.security import create_access_token, create_refresh_token, decode_token, generate_otp_code
from app.core.config import settings


def test_generate_otp_code_has_configured_length_and_is_numeric():
    code = generate_otp_code()
    assert len(code) == settings.OTP_LENGTH
    assert code.isdigit()


def test_access_token_round_trips():
    user_id = uuid.uuid4()
    token = create_access_token(user_id, "student")
    payload = decode_token(token)

    assert payload is not None
    assert payload["sub"] == str(user_id)
    assert payload["role"] == "student"
    assert payload["type"] == "access"


def test_refresh_token_round_trips():
    user_id = uuid.uuid4()
    token = create_refresh_token(user_id, "admin")
    payload = decode_token(token)

    assert payload is not None
    assert payload["type"] == "refresh"


def test_decode_token_rejects_garbage():
    assert decode_token("not-a-real-token") is None
