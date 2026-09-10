"""seed initial admin user

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-10

"""
import uuid
from typing import Sequence, Union

from alembic import op
from sqlalchemy import bindparam, text
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ADMIN_EMAIL = "talhazobayed7@gmail.com"


def upgrade() -> None:
    op.execute(
        text(
            """
            INSERT INTO users (id, name, email, role, is_active, created_at)
            VALUES (:id, 'Admin', :email, 'admin', true, now())
            ON CONFLICT (email) DO UPDATE SET role = 'admin', is_active = true
            """
        ).bindparams(
            bindparam("id", value=uuid.uuid4(), type_=UUID(as_uuid=True)),
            bindparam("email", value=ADMIN_EMAIL),
        )
    )


def downgrade() -> None:
    pass
