from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.cache import redis_client

limiter = Limiter(key_func=get_remote_address)


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"detail": f"Rate limit exceeded: {exc.detail}"},
    )


async def enforce_email_rate_limit(email: str, *, scope: str, max_requests: int, window_seconds: int) -> None:
    """Redis-backed sliding-window-ish limiter keyed by email, used where slowapi's
    IP-based key_func can't reach the request body (e.g. OTP request by email)."""
    key = f"ratelimit:{scope}:{email.lower()}"
    count = await redis_client.incr(key)
    if count == 1:
        await redis_client.expire(key, window_seconds)
    if count > max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many requests for {email}. Try again later.",
        )
