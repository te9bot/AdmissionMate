import json
import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import delete_cached, get_cached, redis_client
from app.core.config import settings
from app.models.exam import Exam
from app.schemas.exam import ExamCreate, ExamRead, ExamUpdate

EXAM_LIST_CACHE_KEY = "exams:list"
EXAM_ITEM_CACHE_KEY = "exams:item:{id}"


def to_read(exam: Exam) -> ExamRead:
    days_left = (exam.exam_date - date.today()).days
    return ExamRead(
        id=exam.id,
        title=exam.title,
        category=exam.category,
        exam_date=exam.exam_date,
        description=exam.description,
        created_at=exam.created_at,
        updated_at=exam.updated_at,
        days_left=days_left,
    )


async def list_exams(db: AsyncSession, category: str | None = None) -> list[ExamRead]:
    cache_key = EXAM_LIST_CACHE_KEY if category is None else f"{EXAM_LIST_CACHE_KEY}:{category}"
    cached = await get_cached(cache_key)
    if cached is not None:
        return [ExamRead.model_validate(item) for item in json.loads(cached)]

    stmt = select(Exam).order_by(Exam.exam_date)
    if category is not None:
        stmt = stmt.where(Exam.category == category)
    result = await db.execute(stmt)
    exams = [to_read(e) for e in result.scalars().all()]

    await redis_client.set(
        cache_key, json.dumps([e.model_dump(mode="json") for e in exams]), ex=settings.EXAM_CACHE_TTL_SECONDS
    )
    return exams


async def get_exam(db: AsyncSession, exam_id: uuid.UUID) -> ExamRead | None:
    cache_key = EXAM_ITEM_CACHE_KEY.format(id=exam_id)
    cached = await get_cached(cache_key)
    if cached is not None:
        return ExamRead.model_validate(json.loads(cached))

    exam = await db.get(Exam, exam_id)
    if exam is None:
        return None

    read = to_read(exam)
    await redis_client.set(cache_key, json.dumps(read.model_dump(mode="json")), ex=settings.EXAM_CACHE_TTL_SECONDS)
    return read


async def invalidate_exam_cache(exam_id: uuid.UUID | None = None) -> None:
    keys = [EXAM_LIST_CACHE_KEY]
    for cat in ("hsc", "ssc", "admission", "others"):
        keys.append(f"{EXAM_LIST_CACHE_KEY}:{cat}")
    if exam_id is not None:
        keys.append(EXAM_ITEM_CACHE_KEY.format(id=exam_id))
    await delete_cached(*keys)


async def create_exam(db: AsyncSession, payload: ExamCreate, admin_id: uuid.UUID) -> Exam:
    exam = Exam(
        title=payload.title,
        category=payload.category,
        exam_date=payload.exam_date,
        description=payload.description,
        created_by_admin_id=admin_id,
    )
    db.add(exam)
    await db.commit()
    await db.refresh(exam)
    await invalidate_exam_cache()
    return exam


async def update_exam(db: AsyncSession, exam_id: uuid.UUID, payload: ExamUpdate) -> Exam | None:
    exam = await db.get(Exam, exam_id)
    if exam is None:
        return None

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(exam, field, value)

    await db.commit()
    await db.refresh(exam)
    await invalidate_exam_cache(exam_id)
    return exam


async def delete_exam(db: AsyncSession, exam_id: uuid.UUID) -> bool:
    exam = await db.get(Exam, exam_id)
    if exam is None:
        return False

    await db.delete(exam)
    await db.commit()
    await invalidate_exam_cache(exam_id)
    return True
