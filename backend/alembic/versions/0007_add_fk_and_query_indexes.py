"""add missing FK and query indexes

Every foreign-key column except the ones incidentally covered by
followed_exams' unique constraint had no index, and the two columns used in
ORDER BY (exams.exam_date, audit_logs.created_at) and the exams.category
filter had none either. None of these caused correctness bugs at today's row
counts, but they're cheap to add now before it matters.

Revision ID: 0007
Revises: 0006

"""
from typing import Sequence, Union

from alembic import op

revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_audit_logs_admin_id", "audit_logs", ["admin_id"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])
    op.create_index("ix_exams_category", "exams", ["category"])
    op.create_index("ix_exams_exam_date", "exams", ["exam_date"])
    op.create_index("ix_exams_created_by_admin_id", "exams", ["created_by_admin_id"])
    op.create_index("ix_followed_exams_exam_id", "followed_exams", ["exam_id"])
    op.create_index("ix_study_goals_user_id", "study_goals", ["user_id"])
    op.create_index("ix_study_goals_target_exam_id", "study_goals", ["target_exam_id"])
    op.create_index("ix_topics_goal_id", "topics", ["goal_id"])
    op.create_index("ix_notification_logs_user_id", "notification_logs", ["user_id"])
    op.create_index("ix_notification_logs_exam_id", "notification_logs", ["exam_id"])


def downgrade() -> None:
    op.drop_index("ix_notification_logs_exam_id", table_name="notification_logs")
    op.drop_index("ix_notification_logs_user_id", table_name="notification_logs")
    op.drop_index("ix_topics_goal_id", table_name="topics")
    op.drop_index("ix_study_goals_target_exam_id", table_name="study_goals")
    op.drop_index("ix_study_goals_user_id", table_name="study_goals")
    op.drop_index("ix_followed_exams_exam_id", table_name="followed_exams")
    op.drop_index("ix_exams_created_by_admin_id", table_name="exams")
    op.drop_index("ix_exams_exam_date", table_name="exams")
    op.drop_index("ix_exams_category", table_name="exams")
    op.drop_index("ix_audit_logs_created_at", table_name="audit_logs")
    op.drop_index("ix_audit_logs_admin_id", table_name="audit_logs")
