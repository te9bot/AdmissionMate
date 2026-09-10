import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.core.rate_limit import limiter
from app.db.session import get_db
from app.models.study_goal import StudyGoal
from app.models.topic import Topic
from app.models.user import User
from app.schemas.goal import GoalCreate, GoalRead, GoalUpdate
from app.schemas.topic import TopicCreate, TopicRead, TopicUpdate
from app.services import planner_service

router = APIRouter()


async def _get_owned_goal(db: AsyncSession, goal_id: uuid.UUID, user: User) -> StudyGoal:
    result = await db.execute(
        select(StudyGoal).options(selectinload(StudyGoal.topics)).where(StudyGoal.id == goal_id)
    )
    goal = result.scalar_one_or_none()
    if goal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Goal not found")
    if goal.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your goal")
    return goal


@router.post("/goals", response_model=GoalRead, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def create_goal(
    request: Request,
    payload: GoalCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    goal = StudyGoal(
        user_id=user.id,
        title=payload.title,
        target_exam_id=payload.target_exam_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
    )
    db.add(goal)
    await db.commit()
    await db.refresh(goal, attribute_names=["topics"])
    return goal


@router.get("/goals", response_model=list[GoalRead])
async def list_goals(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    result = await db.execute(
        select(StudyGoal).options(selectinload(StudyGoal.topics)).where(StudyGoal.user_id == user.id)
    )
    return result.scalars().all()


@router.put("/goals/{goal_id}", response_model=GoalRead)
async def update_goal(
    goal_id: uuid.UUID,
    payload: GoalUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    goal = await _get_owned_goal(db, goal_id, user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)
    await db.commit()
    await db.refresh(goal, attribute_names=["topics"])
    return goal


@router.post("/goals/{goal_id}/topics", response_model=GoalRead, status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def add_topics(
    request: Request,
    goal_id: uuid.UUID,
    payload: TopicCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    goal = await _get_owned_goal(db, goal_id, user)

    next_order = len(goal.topics)
    new_topics = [Topic(goal_id=goal.id, title=title, order=next_order + i) for i, title in enumerate(payload.titles)]
    db.add_all(new_topics)
    await db.flush()

    all_topics = [*goal.topics, *new_topics]
    planner_service.assign_schedule(all_topics, goal.start_date, goal.end_date)

    await db.commit()
    await db.refresh(goal, attribute_names=["topics"])
    return goal


@router.post("/goals/{goal_id}/regenerate", response_model=GoalRead)
async def regenerate_schedule(
    goal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    goal = await _get_owned_goal(db, goal_id, user)
    planner_service.regenerate_remaining(goal.topics, goal.end_date)
    await db.commit()
    await db.refresh(goal, attribute_names=["topics"])
    return goal


@router.patch("/topics/{topic_id}", response_model=TopicRead)
async def update_topic(
    topic_id: uuid.UUID,
    payload: TopicUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Topic).options(selectinload(Topic.goal)).where(Topic.id == topic_id))
    topic = result.scalar_one_or_none()
    if topic is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Topic not found")
    if topic.goal.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your topic")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(topic, field, value)

    await db.commit()
    await db.refresh(topic)
    return topic
