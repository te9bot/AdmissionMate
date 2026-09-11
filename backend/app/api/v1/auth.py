from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.rate_limit import enforce_email_rate_limit, limiter
from app.core.security import password_strength_error
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AccessTokenResponse,
    LoginRequest,
    OTPRequest,
    OTPRequestResponse,
    OTPVerify,
    RefreshRequest,
    SetPasswordRequest,
    TokenPair,
)
from app.schemas.user import UserRead
from app.services import auth_service

router = APIRouter()

_OTP_LIMIT_COUNT, _OTP_LIMIT_WINDOW = 5, 600  # 5 requests / 10 minutes per email
_OTP_VERIFY_LIMIT_COUNT, _OTP_VERIFY_LIMIT_WINDOW = 10, 600  # 10 attempts / 10 minutes per email
_LOGIN_LIMIT_COUNT, _LOGIN_LIMIT_WINDOW = 10, 600  # 10 attempts / 10 minutes per email


@router.post("/request-otp", response_model=OTPRequestResponse)
@limiter.limit("10/minute")
async def request_otp(request: Request, payload: OTPRequest):
    await enforce_email_rate_limit(
        payload.email, scope="otp-request", max_requests=_OTP_LIMIT_COUNT, window_seconds=_OTP_LIMIT_WINDOW
    )
    dev_code = await auth_service.request_otp(payload.email, payload.name)
    return OTPRequestResponse(message="OTP sent", dev_code=dev_code)


@router.post("/verify-otp", response_model=TokenPair)
@limiter.limit("20/minute")
async def verify_otp(request: Request, payload: OTPVerify, db: AsyncSession = Depends(get_db)):
    # A 6-digit code is brute-forceable without a per-email cap, independent of the
    # broader per-IP limit above.
    await enforce_email_rate_limit(
        payload.email,
        scope="otp-verify",
        max_requests=_OTP_VERIFY_LIMIT_COUNT,
        window_seconds=_OTP_VERIFY_LIMIT_WINDOW,
    )
    user = await auth_service.verify_otp(db, payload.email, payload.code, payload.name)
    if user is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired code")

    access, refresh = auth_service.issue_token_pair(user)
    return TokenPair(access_token=access, refresh_token=refresh, user=UserRead.model_validate(user))


@router.post("/login", response_model=TokenPair)
@limiter.limit("20/minute")
async def login(request: Request, payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    await enforce_email_rate_limit(
        payload.email, scope="login", max_requests=_LOGIN_LIMIT_COUNT, window_seconds=_LOGIN_LIMIT_WINDOW
    )
    user, error = await auth_service.login_with_password(db, payload.email, payload.password)
    if error == auth_service.PASSWORD_NOT_SET:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "PASSWORD_NOT_SET")
    if user is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid email or password")

    access, refresh = auth_service.issue_token_pair(user)
    return TokenPair(access_token=access, refresh_token=refresh, user=UserRead.model_validate(user))


@router.post("/set-password", response_model=UserRead)
@limiter.limit("10/minute")
async def set_password(
    request: Request,
    payload: SetPasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    error = password_strength_error(payload.password)
    if error:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, error)
    updated = await auth_service.set_password(db, user, payload.password)
    return UserRead.model_validate(updated)


@router.post("/refresh", response_model=AccessTokenResponse)
@limiter.limit("30/minute")
async def refresh(request: Request, payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    access = await auth_service.refresh_access_token(db, payload.refresh_token)
    if access is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token")
    return AccessTokenResponse(access_token=access)
