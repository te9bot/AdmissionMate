import hashlib
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import redis_client
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, decode_token, generate_otp_code
from app.models.user import User
from app.services.email import email_backend

OTP_KEY_PREFIX = "otp"


def _otp_key(email: str) -> str:
    return f"{OTP_KEY_PREFIX}:{email.lower()}"


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


async def request_otp(email: str, name: str | None) -> str | None:
    code = generate_otp_code()
    await redis_client.set(_otp_key(email), _hash_code(code), ex=settings.OTP_TTL_SECONDS)

    subject = f"Your {settings.APP_NAME} login code"
    body = f"Your one-time login code is {code}. It expires in {settings.OTP_TTL_SECONDS // 60} minutes."
    await email_backend.send(email, subject, body)

    return code if settings.DEBUG else None


async def verify_otp(db: AsyncSession, email: str, code: str, name: str | None = None) -> User | None:
    stored_hash = await redis_client.get(_otp_key(email))
    if stored_hash is None or stored_hash != _hash_code(code):
        return None

    await redis_client.delete(_otp_key(email))

    result = await db.execute(select(User).where(User.email == email.lower()))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(email=email.lower(), name=name)
        db.add(user)
        await db.flush()
    await db.commit()
    await db.refresh(user)
    return user


def issue_token_pair(user: User) -> tuple[str, str]:
    access = create_access_token(user.id, user.role.value)
    refresh = create_refresh_token(user.id, user.role.value)
    return access, refresh


async def refresh_access_token(db: AsyncSession, refresh_token: str) -> str | None:
    payload = decode_token(refresh_token)
    if payload is None or payload.get("type") != "refresh":
        return None

    result = await db.execute(select(User).where(User.id == uuid.UUID(payload["sub"])))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        return None

    return create_access_token(user.id, user.role.value)
