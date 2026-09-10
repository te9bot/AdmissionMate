"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-09-10

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# create_type=False: the types are created/dropped below via raw SQL (op.execute), not
# by SQLAlchemy's own Enum.create()/DDL machinery, which hits a known asyncpg dialect bug
# where CREATE TYPE executed through the compiled-DDL path raises a spurious
# "DuplicateObjectError" (asyncpg's extended query protocol chokes on CREATE TYPE there).
user_role = postgresql.ENUM("student", "admin", name="user_role", create_type=False)
exam_category = postgresql.ENUM("hsc", "ssc", "admission", "others", name="exam_category", create_type=False)
topic_status = postgresql.ENUM("pending", "done", name="topic_status", create_type=False)
notification_channel = postgresql.ENUM("email", name="notification_channel", create_type=False)


def upgrade() -> None:
    op.execute("CREATE TYPE user_role AS ENUM ('student', 'admin')")
    op.execute("CREATE TYPE exam_category AS ENUM ('hsc', 'ssc', 'admission', 'others')")
    op.execute("CREATE TYPE topic_status AS ENUM ('pending', 'done')")
    op.execute("CREATE TYPE notification_channel AS ENUM ('email')")

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(120), nullable=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("role", user_role, nullable=False, server_default="student"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("admin_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("action", sa.String(255), nullable=False),
        sa.Column("entity_type", sa.String(50), nullable=False),
        sa.Column("entity_id", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "exams",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("category", exam_category, nullable=False),
        sa.Column("exam_date", sa.Date, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("created_by_admin_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "followed_exams",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("exam_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("exams.id"), nullable=False),
        sa.Column("notify", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "exam_id", name="uq_followed_exam_user_exam"),
    )

    op.create_table(
        "study_goals",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("target_exam_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("exams.id"), nullable=True),
        sa.Column("start_date", sa.Date, nullable=False),
        sa.Column("end_date", sa.Date, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "topics",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("goal_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("study_goals.id"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("status", topic_status, nullable=False, server_default="pending"),
        sa.Column("scheduled_date", sa.Date, nullable=True),
    )

    op.create_table(
        "notification_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("exam_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("exams.id"), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("channel", notification_channel, nullable=False, server_default="email"),
    )


def downgrade() -> None:
    op.drop_table("notification_logs")
    op.drop_table("topics")
    op.drop_table("study_goals")
    op.drop_table("followed_exams")
    op.drop_table("exams")
    op.drop_table("audit_logs")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    op.execute("DROP TYPE notification_channel")
    op.execute("DROP TYPE topic_status")
    op.execute("DROP TYPE exam_category")
    op.execute("DROP TYPE user_role")
