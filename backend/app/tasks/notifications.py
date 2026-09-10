import logging
import uuid
from datetime import date

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.exam import Exam
from app.models.followed_exam import FollowedExam
from app.models.notification_log import NotificationChannel, NotificationLog
from app.models.user import User
from app.services.email import email_backend

logger = logging.getLogger("admissionmate.notifications")

scheduler = AsyncIOScheduler()


async def send_exam_reminders(exam_id: uuid.UUID | None = None) -> int:
    """Sends 'X days left' reminder emails to everyone following an exam with
    notify=true. If exam_id is given, only that exam's followers are notified
    (used by the admin 'resend' action); otherwise all followed exams run —
    this is the daily job body."""
    sent = 0
    async with AsyncSessionLocal() as db:
        stmt = (
            select(FollowedExam, Exam, User)
            .join(Exam, FollowedExam.exam_id == Exam.id)
            .join(User, FollowedExam.user_id == User.id)
            .where(FollowedExam.notify.is_(True))
        )
        if exam_id is not None:
            stmt = stmt.where(Exam.id == exam_id)

        result = await db.execute(stmt)
        rows = result.all()

        for _follow, exam, user in rows:
            days_left = (exam.exam_date - date.today()).days
            subject = f"{exam.title} — {days_left} days left"
            body = f"Hi{f' {user.name}' if user.name else ''}, your followed exam '{exam.title}' is in {days_left} days ({exam.exam_date})."
            await email_backend.send(user.email, subject, body)
            db.add(NotificationLog(user_id=user.id, exam_id=exam.id, channel=NotificationChannel.email))
            sent += 1

        await db.commit()

    logger.info("Sent %d exam reminder emails", sent)
    return sent


def start_notification_job() -> None:
    scheduler.add_job(
        send_exam_reminders,
        trigger=CronTrigger(hour=settings.NOTIFICATION_JOB_HOUR, minute=settings.NOTIFICATION_JOB_MINUTE),
        id="daily_exam_reminders",
        replace_existing=True,
    )
