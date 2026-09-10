import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.exam import ExamCategory


class ExamRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    category: ExamCategory
    exam_date: date
    description: str | None
    created_at: datetime
    updated_at: datetime
    days_left: int


class ExamCreate(BaseModel):
    title: str
    category: ExamCategory
    exam_date: date
    description: str | None = None


class ExamUpdate(BaseModel):
    title: str | None = None
    category: ExamCategory | None = None
    exam_date: date | None = None
    description: str | None = None


class FollowedExamRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    exam_id: uuid.UUID
    notify: bool
