import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.exam import Exam
from app.models.user import AuditLog, User
from app.schemas.exam import ExamCreate, ExamRead, ExamUpdate
from app.schemas.user import UserRead, UserUpdateStatus
from app.services import exam_service
from app.tasks.notifications import send_exam_reminders

router = APIRouter(dependencies=[Depends(require_admin)])


async def _log_action(db: AsyncSession, admin: User, action: str, entity_type: str, entity_id: str) -> None:
    db.add(AuditLog(admin_id=admin.id, action=action, entity_type=entity_type, entity_id=entity_id))
    await db.commit()


@router.post("/exams", response_model=ExamRead, status_code=status.HTTP_201_CREATED)
async def create_exam(
    payload: ExamCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    exam = await exam_service.create_exam(db, payload, admin.id)
    await _log_action(db, admin, "create", "exam", str(exam.id))
    return exam_service.to_read(exam)


@router.put("/exams/{exam_id}", response_model=ExamRead)
async def update_exam(
    exam_id: uuid.UUID,
    payload: ExamUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    exam = await exam_service.update_exam(db, exam_id, payload)
    if exam is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Exam not found")
    await _log_action(db, admin, "update", "exam", str(exam_id))
    return exam_service.to_read(exam)


@router.delete("/exams/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exam(
    exam_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    deleted = await exam_service.delete_exam(db, exam_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Exam not found")
    await _log_action(db, admin, "delete", "exam", str(exam_id))


@router.get("/users", response_model=list[UserRead])
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.patch("/users/{user_id}", response_model=UserRead)
async def update_user_status(
    user_id: uuid.UUID,
    payload: UserUpdateStatus,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    user.is_active = payload.is_active
    await db.commit()
    await db.refresh(user)
    await _log_action(db, admin, "reactivate" if payload.is_active else "disable", "user", str(user_id))
    return user


@router.post("/exams/{exam_id}/resend-notifications")
async def resend_notifications(
    exam_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    exam = await db.get(Exam, exam_id)
    if exam is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Exam not found")

    sent = await send_exam_reminders(exam_id)
    await _log_action(db, admin, "resend-notifications", "exam", str(exam_id))
    return {"sent": sent}


@router.get("/audit-logs")
async def list_audit_logs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(200))
    logs = result.scalars().all()
    return [
        {
            "id": log.id,
            "admin_id": log.admin_id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "created_at": log.created_at,
        }
        for log in logs
    ]
