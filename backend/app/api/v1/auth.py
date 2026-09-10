from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.rate_limit import enforce_email_rate_limit
from app.db.session import get_db
from app.schemas.auth import (
    AccessTokenResponse,
    OTPRequest,
    OTPRequestResponse,
    OTPVerify,
    RefreshRequest,
    TokenPair,
)
from app.schemas.user import UserRead
from app.services import auth_service

router = APIRouter()

_OTP_LIMIT_COUNT, _OTP_LIMIT_WINDOW = 5, 600  # 5 requests / 10 minutes per email


@router.post("/request-otp", response_model=OTPRequestResponse)
async def request_otp(payload: OTPRequest):
    await enforce_email_rate_limit(
        payload.email, scope="otp-request", max_requests=_OTP_LIMIT_COUNT, window_seconds=_OTP_LIMIT_WINDOW
    )
    dev_code = await auth_service.request_otp(payload.email, payload.name)
    return OTPRequestResponse(message="OTP sent", dev_code=dev_code)


@router.post("/verify-otp", response_model=TokenPair)
async def verify_otp(payload: OTPVerify, db: AsyncSession = Depends(get_db)):
    user = await auth_service.verify_otp(db, payload.email, payload.code)
    if user is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired code")

    access, refresh = auth_service.issue_token_pair(user)
    return TokenPair(access_token=access, refresh_token=refresh, user=UserRead.model_validate(user))


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    access = await auth_service.refresh_access_token(db, payload.refresh_token)
    if access is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired refresh token")
    return AccessTokenResponse(access_token=access)
