import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text

from app.api.v1 import admin, auth, exams, goals
from app.core.cache import redis_client
from app.core.config import settings
from app.core.rate_limit import limiter, rate_limit_exceeded_handler
from app.db.session import AsyncSessionLocal
from app.tasks.notifications import scheduler, start_notification_job

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("admissionmate")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await redis_client.ping()
    start_notification_job()
    scheduler.start()
    yield
    scheduler.shutdown(wait=False)
    await redis_client.close()


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error("Unhandled error on %s %s", request.method, request.url.path, exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(exams.router, prefix="/exams", tags=["exams"])
app.include_router(goals.router, tags=["goals"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])


@app.get("/health")
async def health():
    problems = []

    try:
        await redis_client.ping()
    except Exception:
        logger.exception("Health check: Redis ping failed")
        problems.append("redis")

    try:
        async with AsyncSessionLocal() as db:
            await db.execute(text("SELECT 1"))
    except Exception:
        logger.exception("Health check: database ping failed")
        problems.append("database")

    if problems:
        return JSONResponse(status_code=503, content={"status": "degraded", "unhealthy": problems})
    return {"status": "ok"}
