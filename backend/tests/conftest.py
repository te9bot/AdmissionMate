import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

from app.db.base import Base
from app.db.session import AsyncSessionLocal, engine
from app.main import app
from app.models.user import User, UserRole


@pytest_asyncio.fixture
async def _setup_schema():
    """Only pulled in by tests that touch the DB (via the `db_ready` fixture below) —
    pure unit tests (planner_service, security) don't need Postgres running at all."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest_asyncio.fixture
async def db_ready(_setup_schema):
    yield
    async with AsyncSessionLocal() as db:
        for table in ("notification_logs", "topics", "study_goals", "followed_exams", "exams", "audit_logs", "users"):
            await db.execute(text(f'TRUNCATE TABLE "{table}" CASCADE'))
        await db.commit()


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def admin_user(db_ready) -> User:
    async with AsyncSessionLocal() as db:
        user = User(email="admin@admissionmate-dev.com", name="Admin", role=UserRole.admin)
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user


@pytest_asyncio.fixture
async def student_user(db_ready) -> User:
    async with AsyncSessionLocal() as db:
        user = User(email="student@admissionmate-dev.com", name="Student", role=UserRole.student)
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
