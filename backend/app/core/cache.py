from redis.asyncio import Redis, from_url

from app.core.config import settings

redis_client: Redis = from_url(settings.REDIS_URL, decode_responses=True)


async def get_cached(key: str) -> str | None:
    return await redis_client.get(key)


async def set_cached(key: str, value: str, ttl_seconds: int) -> None:
    await redis_client.set(key, value, ex=ttl_seconds)


async def delete_cached(*keys: str) -> None:
    if keys:
        await redis_client.delete(*keys)
