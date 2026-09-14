"""seed 2026-27 admission test dates (RU, JnU, KU, CU, KUET, MIST, BUP, RUET, SUST, HSTU, BUTEX, Agri Cluster)

Dates as supplied by the site operator, not independently cross-checked
against each university's official circular the way 0005 was. Re-verify
against admission.xxx.ac.bd / official notices before relying on these for
anything user-facing, and update via a follow-up migration if a circular
changes a date.

DU and BUET are intentionally excluded here: both are already seeded by
0004 with matching dates.

Where a university's source only gave a month/day with no year, the year
was inferred from context (December dates -> 2026, following DU's already-
seeded December 2026 season; January/February dates -> 2027, following the
already-seeded BUET 2027-01-16 date and the explicitly-dated KUET/BUP
entries).

Some units span more than one exam_date (e.g. BUP FBS on both Jan 1 and
Jan 9, SUST across two days, HSTU across five days). Since `exams.exam_date`
is a single date, multi-date units are split into one row per date; HSTU's
5-day window is represented as a single row on its first day with the full
range noted in the description, since it isn't unit-split like the others.

Revision ID: 0006
Revises: 0005
Create Date: 2026-09-14

"""
import uuid
from datetime import date
from typing import Sequence, Union

from alembic import op
from sqlalchemy import Date, bindparam, text
from sqlalchemy.dialects.postgresql import UUID

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

EXAMS = [
    (
        "Rajshahi University - B Unit (Commerce) Admission Test",
        "2027-01-08",
        "2026-27 undergraduate admission test, B Unit (Commerce). "
        "Applications: Nov 12-27, 2026.",
    ),
    (
        "Rajshahi University - C Unit (Science) Admission Test",
        "2027-01-09",
        "2026-27 undergraduate admission test, C Unit (Science). "
        "Applications: Nov 12-27, 2026.",
    ),
    (
        "Rajshahi University - A Unit (Humanities) Admission Test",
        "2027-01-16",
        "2026-27 undergraduate admission test, A Unit (Humanities). "
        "Applications: Nov 12-27, 2026.",
    ),
    (
        "Jagannath University - A Unit Admission Test",
        "2027-01-01",
        "2026-27 undergraduate admission test, A Unit. "
        "Applications: Nov 15, 2026 12:00 PM - Dec 10, 2026 11:59 PM.",
    ),
    (
        "Jagannath University - E Unit Admission Test",
        "2027-01-08",
        "2026-27 undergraduate admission test, E Unit. "
        "Applications: Nov 15, 2026 12:00 PM - Dec 10, 2026 11:59 PM.",
    ),
    (
        "Jagannath University - B Unit Admission Test",
        "2027-01-15",
        "2026-27 undergraduate admission test, B Unit. "
        "Applications: Nov 15, 2026 12:00 PM - Dec 10, 2026 11:59 PM.",
    ),
    (
        "Jagannath University - C Unit Admission Test",
        "2027-01-22",
        "2026-27 undergraduate admission test, C Unit. "
        "Applications: Nov 15, 2026 12:00 PM - Dec 10, 2026 11:59 PM.",
    ),
    (
        "Jagannath University - D Unit Admission Test",
        "2027-01-23",
        "2026-27 undergraduate admission test, D Unit. "
        "Applications: Nov 15, 2026 12:00 PM - Dec 10, 2026 11:59 PM.",
    ),
    (
        "Khulna University - C & D Units Admission Test",
        "2026-12-17",
        "2026-27 undergraduate admission test, C & D Units. "
        "Application deadline not yet announced.",
    ),
    (
        "Khulna University - A & B Units Admission Test",
        "2026-12-18",
        "2026-27 undergraduate admission test, A & B Units. "
        "Application deadline not yet announced.",
    ),
    (
        "University of Chittagong - C Unit Admission Test",
        "2027-01-29",
        "2026-27 undergraduate admission test, C Unit. "
        "Applications: Nov 15 - Dec 10, 2026.",
    ),
    (
        "University of Chittagong - A Unit Admission Test",
        "2027-01-30",
        "2026-27 undergraduate admission test, A Unit. "
        "Applications: Nov 15 - Dec 10, 2026.",
    ),
    (
        "University of Chittagong - B1 Unit Admission Test",
        "2027-02-03",
        "2026-27 undergraduate admission test, B1 Unit. "
        "Applications: Nov 15 - Dec 10, 2026.",
    ),
    (
        "University of Chittagong - B2 Unit Admission Test",
        "2027-02-04",
        "2026-27 undergraduate admission test, B2 Unit. "
        "Applications: Nov 15 - Dec 10, 2026.",
    ),
    (
        "University of Chittagong - B Unit Admission Test",
        "2027-02-05",
        "2026-27 undergraduate admission test, B Unit. "
        "Applications: Nov 15 - Dec 10, 2026.",
    ),
    (
        "University of Chittagong - D Unit Admission Test",
        "2027-02-06",
        "2026-27 undergraduate admission test, D Unit. "
        "Applications: Nov 15 - Dec 10, 2026.",
    ),
    (
        "University of Chittagong - D1 Unit Admission Test",
        "2027-02-08",
        "2026-27 undergraduate admission test, D1 Unit. "
        "Applications: Nov 15 - Dec 10, 2026.",
    ),
    (
        "KUET Undergraduate Admission Test",
        "2027-01-08",
        "Khulna University of Engineering & Technology, 2026-27 undergraduate "
        "admission test. Application deadline not yet announced.",
    ),
    (
        "MIST - C Unit Admission Test",
        "2026-12-18",
        "Military Institute of Science and Technology, 2026-27 undergraduate "
        "admission test, C Unit. Application deadline not yet announced.",
    ),
    (
        "MIST - A & B Units Admission Test",
        "2026-12-19",
        "Military Institute of Science and Technology, 2026-27 undergraduate "
        "admission test, A & B Units. Application deadline not yet announced.",
    ),
    (
        "BUP - FASS Admission Test",
        "2027-01-02",
        "Bangladesh University of Professionals, 2026-27 undergraduate "
        "admission test, Faculty of Arts and Social Sciences. Application "
        "deadline not yet announced.",
    ),
    (
        "BUP - FBS Admission Test (1st Sitting)",
        "2027-01-01",
        "Bangladesh University of Professionals, 2026-27 undergraduate "
        "admission test, Faculty of Business Studies. Application deadline "
        "not yet announced.",
    ),
    (
        "BUP - FBS Admission Test (2nd Sitting)",
        "2027-01-09",
        "Bangladesh University of Professionals, 2026-27 undergraduate "
        "admission test, Faculty of Business Studies. Application deadline "
        "not yet announced.",
    ),
    (
        "BUP - FST Admission Test",
        "2027-01-08",
        "Bangladesh University of Professionals, 2026-27 undergraduate "
        "admission test, Faculty of Science and Technology. Application "
        "deadline not yet announced.",
    ),
    (
        "BUP - FET Admission Test",
        "2027-01-08",
        "Bangladesh University of Professionals, 2026-27 undergraduate "
        "admission test, Faculty of Engineering and Technology. Application "
        "deadline not yet announced.",
    ),
    (
        "BUP - FMS Admission Test",
        "2027-01-08",
        "Bangladesh University of Professionals, 2026-27 undergraduate "
        "admission test, Faculty of Medical Sciences. Application deadline "
        "not yet announced.",
    ),
    (
        "BUP - FSSS Admission Test",
        "2027-01-08",
        "Bangladesh University of Professionals, 2026-27 undergraduate "
        "admission test, Faculty of Security and Strategic Studies. "
        "Application deadline not yet announced.",
    ),
    (
        "RUET Undergraduate Admission Test",
        "2027-01-14",
        "Rajshahi University of Engineering & Technology, 2026-27 "
        "undergraduate admission test. Application deadline not yet announced.",
    ),
    (
        "SUST Admission Test (Day 1)",
        "2027-01-26",
        "Shahjalal University of Science and Technology, 2026-27 "
        "undergraduate admission test, first of two test days (Jan 26-27, "
        "2027). Application deadline not yet announced.",
    ),
    (
        "SUST Admission Test (Day 2)",
        "2027-01-27",
        "Shahjalal University of Science and Technology, 2026-27 "
        "undergraduate admission test, second of two test days (Jan 26-27, "
        "2027). Application deadline not yet announced.",
    ),
    (
        "HSTU Admission Test",
        "2027-01-24",
        "Hajee Mohammad Danesh Science and Technology University, 2026-27 "
        "undergraduate admission tests run Jan 24-28, 2027 (unit-wise "
        "schedule). Application deadline not yet announced.",
    ),
    (
        "BUTEX Undergraduate Admission Test",
        "2027-01-29",
        "Bangladesh University of Textiles, 2026-27 undergraduate admission "
        "test. Application deadline not yet announced.",
    ),
    (
        "Agricultural Cluster Admission Test",
        "2027-01-02",
        "Agricultural Cluster Admission System, 2026-27 undergraduate "
        "admission test (shared test for agricultural universities). "
        "Application deadline not yet announced.",
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
