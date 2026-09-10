import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.user import UserRole


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str | None
    email: str
    role: UserRole
    is_active: bool
    has_password: bool
    created_at: datetime


class UserUpdateStatus(BaseModel):
    is_active: bool
