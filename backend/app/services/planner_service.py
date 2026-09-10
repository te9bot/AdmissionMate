from datetime import date, timedelta

from app.models.topic import Topic


def _date_range(start: date, end: date) -> list[date]:
    if end < start:
        end = start
    return [start + timedelta(days=d) for d in range((end - start).days + 1)]


def assign_schedule(topics: list[Topic], start_date: date, end_date: date) -> None:
    """v1 scheduling: spread N topics evenly across the day window [start_date, end_date].
    Works whether there are more topics than days (multiple topics/day) or fewer
    (topics spaced out across the window) — mutates topic.scheduled_date in place."""
    days = _date_range(start_date, end_date)
    n_days = len(days)
    n_topics = len(topics)
    if n_topics == 0:
        return

    for i, topic in enumerate(topics):
        day_index = min((i * n_days) // n_topics, n_days - 1)
        topic.scheduled_date = days[day_index]


def regenerate_remaining(topics: list[Topic], end_date: date, today: date | None = None) -> None:
    """Re-spread only the not-yet-done topics across the days remaining until end_date,
    used when the student falls behind. Done topics keep their scheduled_date."""
    today = today or date.today()
    pending = [t for t in topics if t.status.value == "pending"]
    assign_schedule(pending, today, max(end_date, today))
