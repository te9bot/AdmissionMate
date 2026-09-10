import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.rate_limit import limiter
from app.db.session import get_db
from app.models.exam import ExamCategory
from app.models.followed_exam import FollowedExam
from app.models.user import User
from app.schemas.exam import ExamRead, FollowedExamRead
from app.services import exam_service

router = APIRouter()


@router.get("", response_model=list[ExamRead])
@limiter.limit("60/minute")
async def get_exams(request: Request, category: ExamCategory | None = None, db: AsyncSession = Depends(get_db)):
    return await exam_service.list_exams(db, category=category.value if category else None)


@router.get("/{exam_id}", response_model=ExamRead)
@limiter.limit("60/minute")
async def get_exam(request: Request, exam_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    exam = await exam_service.get_exam(db, exam_id)
    if exam is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Exam not found")
    return exam


@router.post("/{exam_id}/follow", response_model=FollowedExamRead, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def follow_exam(
    request: Request,
    exam_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    exam = await db.get(exam_service.Exam, exam_id)
    if exam is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Exam not found")

    result = await db.execute(
        select(FollowedExam).where(FollowedExam.user_id == user.id, FollowedExam.exam_id == exam_id)
    )
    existing = result.scalar_one_or_none()
    if existing is not None:
        return existing

    follow = FollowedExam(user_id=user.id, exam_id=exam_id, notify=True)
    db.add(follow)
    await db.commit()
    await db.refresh(follow)
    return follow


@router.delete("/{exam_id}/follow", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("30/minute")
async def unfollow_exam(
    request: Request,
    exam_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(FollowedExam).where(FollowedExam.user_id == user.id, FollowedExam.exam_id == exam_id)
    )
    follow = result.scalar_one_or_none()
    if follow is not None:
        await db.delete(follow)
        await db.commit()


@router.get("/me/followed", response_model=list[ExamRead])
async def get_my_followed_exams(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(FollowedExam.exam_id).where(FollowedExam.user_id == user.id))
    exam_ids = result.scalars().all()
    exams = []
    for exam_id in exam_ids:
        exam = await exam_service.get_exam(db, exam_id)
        if exam is not None:
            exams.append(exam)
    return exams
