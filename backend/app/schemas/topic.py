import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict

from app.models.topic import TopicStatus


class TopicCreate(BaseModel):
    titles: list[str]


class TopicRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    goal_id: uuid.UUID
    title: str
    order: int
    status: TopicStatus
    scheduled_date: date | None


class TopicUpdate(BaseModel):
    status: TopicStatus | None = None
    title: str | None = None
