"""seed SSC/HSC 2027 exam dates

Only officially-confirmed dates are seeded, cross-checked against multiple
independent sources before adding:

- SSC 2027: Inter-Education Board Examination Controllers' Committee routine,
  following a Secondary and Higher Education Division order. Published
  2026-08-24. Written exams start with Bangla First Paper on 2027-03-14,
  10:00 AM daily, across all nine general education boards; written exams
  end 2027-04-15, practicals end 2027-04-22.
  Sources: bssnews.net/news-flash/417615, tbsnews.net, jagonews24.com.

- HSC 2027: Announced by the Education Minister at a Ministry of Education
  press briefing, 2026-05-14. Starts with Bangla First Paper on 2027-06-06;
  morning shift 10:00 AM-1:00 PM, afternoon shift 2:00 PM-5:00 PM; exams run
  through 2027-07-13.
  Sources: thedailystar.net, en.prothomalo.com.

Admission-test circulars checked but not yet published as of this
migration's authoring date (2026-09-11), so intentionally omitted rather
than guessed: GST cluster 2026-27, Jahangirnagar University 2026-27,
MBBS/medical 2026-27.

Revision ID: 0005
Revises: 0004
Create Date: 2026-09-11

"""
import uuid
from datetime import date
from typing import Sequence, Union

from alembic import op
from sqlalchemy import Date, bindparam, text
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

EXAMS = [
    (
        "SSC 2027 Examination",
        "ssc",
        "2027-03-14",
        "Secondary School Certificate 2027, all nine general education boards. "
        "Begins with Bangla First Paper, 10:00 AM daily. Written exams end "
        "2027-04-15; practicals end 2027-04-22. "
        "(Inter-Education Board Examination Controllers' Committee, published 2026-08-24.)",
    ),
    (
        "HSC 2027 Examination",
        "hsc",
        "2027-06-06",
        "Higher Secondary Certificate 2027. Begins with Bangla First Paper. "
        "Morning shift 10:00 AM-1:00 PM, afternoon shift 2:00 PM-5:00 PM. "
        "Exams run through 2027-07-13. "
        "(Announced by the Ministry of Education, 2026-05-14.)",
    ),
]


def upgrade() -> None:
    for title, category, exam_date, description in EXAMS:
        op.execute(
            text(
                """
                INSERT INTO exams (id, title, category, exam_date, description, created_at, updated_at)
                VALUES (:id, :title, CAST(:category AS exam_category), :exam_date, :description, now(), now())
                """
            ).bindparams(
                bindparam("id", value=uuid.uuid4(), type_=UUID(as_uuid=True)),
                bindparam("title", value=title),
                bindparam("category", value=category),
                bindparam("exam_date", value=date.fromisoformat(exam_date), type_=Date),
                bindparam("description", value=description),
            )
        )


def downgrade() -> None:
    titles = [title for title, _, _, _ in EXAMS]
    op.execute(
        text("DELETE FROM exams WHERE title = ANY(:titles)").bindparams(
            bindparam("titles", value=titles, expanding=True)
        )
    )
