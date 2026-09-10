from datetime import date, timedelta

from app.models.topic import Topic, TopicStatus
from app.services.planner_service import assign_schedule, regenerate_remaining


def make_topics(n: int) -> list[Topic]:
    return [Topic(title=f"Topic {i}", order=i, status=TopicStatus.pending) for i in range(n)]


def test_assign_schedule_spreads_fewer_topics_than_days():
    topics = make_topics(3)
    start = date(2026, 1, 1)
    end = start + timedelta(days=9)  # 10 days

    assign_schedule(topics, start, end)

    dates = [t.scheduled_date for t in topics]
    assert dates == sorted(dates)
    assert all(start <= d <= end for d in dates)
    assert len(set(dates)) == 3  # each topic gets its own day when topics < days


def test_assign_schedule_packs_more_topics_than_days():
    topics = make_topics(10)
    start = date(2026, 1, 1)
    end = start + timedelta(days=2)  # 3 days

    assign_schedule(topics, start, end)

    assert all(start <= t.scheduled_date <= end for t in topics)
    assert len(set(t.scheduled_date for t in topics)) == 3


def test_assign_schedule_empty_topics_noop():
    assign_schedule([], date(2026, 1, 1), date(2026, 1, 5))  # should not raise


def test_regenerate_remaining_only_touches_pending():
    topics = make_topics(4)
    done_topic = topics[0]
    done_topic.status = TopicStatus.done
    done_topic.scheduled_date = date(2026, 1, 1)

    regenerate_remaining(topics, end_date=date(2026, 12, 31), today=date(2026, 6, 1))

    assert done_topic.scheduled_date == date(2026, 1, 1)
    for t in topics[1:]:
        assert t.scheduled_date >= date(2026, 6, 1)
