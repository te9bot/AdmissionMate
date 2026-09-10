import enum
import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.study_goal import StudyGoal


class TopicStatus(str, enum.Enum):
    pending = "pending"
    done = "done"


class Topic(Base):
    __tablename__ = "topics"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    goal_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("study_goals.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[TopicStatus] = mapped_column(Enum(TopicStatus, name="topic_status"), default=TopicStatus.pending, nullable=False)
    scheduled_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    goal: Mapped["StudyGoal"] = relationship(back_populates="topics")
