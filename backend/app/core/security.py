import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from enum import Enum

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

PASSWORD_MIN_LENGTH = 8


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def password_strength_error(password: str) -> str | None:
    """Returns a description of the first unmet requirement, or None if the password is strong enough."""
    if len(password) < PASSWORD_MIN_LENGTH:
        return f"Password must be at least {PASSWORD_MIN_LENGTH} characters"
    if re.search(r"\s", password):
        return "Password must not contain spaces"
    if not re.search(r"[a-z]", password):
        return "Password must include at least 1 lower case letter"
    if not re.search(r"[A-Z]", password):
        return "Password must include at least 1 upper case letter"
    if not re.search(r"\d", password) or not re.search(r"[^\w\s]", password):
        return "Password must include at least 1 number and 1 special character"
    return None


class TokenType(str, Enum):
    access = "access"
    refresh = "refresh"


def generate_otp_code() -> str:
    return "".join(secrets.choice("0123456789") for _ in range(settings.OTP_LENGTH))


def _create_token(subject: uuid.UUID, role: str, token_type: TokenType, expires_delta: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(subject),
        "role": role,
        "type": token_type.value,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_access_token(user_id: uuid.UUID, role: str) -> str:
    return _create_token(user_id, role, TokenType.access, timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))


def create_refresh_token(user_id: uuid.UUID, role: str) -> str:
    return _create_token(user_id, role, TokenType.refresh, timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None
