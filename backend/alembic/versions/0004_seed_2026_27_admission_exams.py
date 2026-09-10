"""seed 2026-27 admission test dates (DU, BUET)

Only entries with an officially announced, confirmed test date are seeded.
JU and the GST cluster hadn't published their 2026-27 circulars as of this
migration's authoring date, so they're intentionally omitted rather than
guessed.

Revision ID: 0004
Revises: 0003
Create Date: 2026-09-11

"""
import uuid
from datetime import date
from typing import Sequence, Union

from alembic import op
from sqlalchemy import Date, bindparam, text
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

EXAMS = [
    (
        "Dhaka University - IBA Unit Admission Test",
        "2026-12-05",
        "2026-27 undergraduate admission test, IBA Unit, 10:00 AM-12:00 PM. "
        "Applications: Nov 11-25, 2026 (admission.eis.du.ac.bd).",
    ),
    (
        "Dhaka University - Science Unit Admission Test",
        "2026-12-12",
        "2026-27 undergraduate admission test, Science Unit, 11:00 AM-12:30 PM. "
        "Applications: Nov 11-25, 2026 (admission.eis.du.ac.bd).",
    ),
    (
        "Dhaka University - Arts, Law & Social Science Unit Admission Test",
        "2026-12-19",
        "2026-27 undergraduate admission test, Arts/Law/Social Science Unit, 11:00 AM-12:30 PM. "
        "Applications: Nov 11-25, 2026 (admission.eis.du.ac.bd).",
    ),
    (
        "Dhaka University - Fine Arts Unit Admission Test",
        "2026-12-22",
        "2026-27 undergraduate admission test, Fine Arts Unit, 11:00 AM-12:30 PM. "
        "Applications: Nov 11-25, 2026 (admission.eis.du.ac.bd).",
    ),
    (
        "Dhaka University - Business Studies Unit Admission Test",
        "2026-12-26",
        "2026-27 undergraduate admission test, Business Studies Unit, 11:00 AM-12:30 PM. "
        "Applications: Nov 11-25, 2026 (admission.eis.du.ac.bd).",
    ),
    (
        "BUET Undergraduate Admission Test",
        "2027-01-16",
        "Written entrance examination for the 2026-27 academic year. "
        "Exact shift/timing details to be confirmed by BUET (buet.ac.bd).",
    ),
]


def upgrade() -> None:
    for title, exam_date, description in EXAMS:
        op.execute(
            text(
                """
                INSERT INTO exams (id, title, category, exam_date, description, created_at, updated_at)
                VALUES (:id, :title, 'admission', :exam_date, :description, now(), now())
                """
            ).bindparams(
                bindparam("id", value=uuid.uuid4(), type_=UUID(as_uuid=True)),
                bindparam("title", value=title),
                bindparam("exam_date", value=date.fromisoformat(exam_date), type_=Date),
                bindparam("description", value=description),
            )
        )


def downgrade() -> None:
    titles = [title for title, _, _ in EXAMS]
    op.execute(
        text("DELETE FROM exams WHERE title = ANY(:titles)").bindparams(
            bindparam("titles", value=titles, expanding=True)
        )
    )
