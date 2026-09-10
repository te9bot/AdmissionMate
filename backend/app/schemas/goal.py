import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict

from app.schemas.topic import TopicRead


class GoalCreate(BaseModel):
    title: str
    target_exam_id: uuid.UUID | None = None
    start_date: date
    end_date: date


class GoalUpdate(BaseModel):
    title: str | None = None
    target_exam_id: uuid.UUID | None = None
    start_date: date | None = None
    end_date: date | None = None


class GoalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    target_exam_id: uuid.UUID | None
    start_date: date
    end_date: date
    topics: list[TopicRead] = []
