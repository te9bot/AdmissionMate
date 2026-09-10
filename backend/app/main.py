from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from app.api.v1 import admin, auth, exams, goals
from app.core.cache import redis_client
from app.core.config import settings
from app.core.rate_limit import limiter, rate_limit_exceeded_handler
from app.tasks.notifications import scheduler, start_notification_job


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
    return {"status": "ok"}
