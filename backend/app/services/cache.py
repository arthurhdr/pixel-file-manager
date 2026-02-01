import os
import redis
from typing import Optional

class CacheService:
    def __init__(self):
        redis_url = os.getenv("REDIS_URL", "redis://redis:6379")
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.ttl = 60 * 5 

    def get_user_files(self, user_id: int) -> Optional[str]:
        key = f"user_files:{user_id}"
        return self.redis.get(key)

    def set_user_files(self, user_id: int, data: str):
        key = f"user_files:{user_id}"
        self.redis.setex(key, self.ttl, data)

    def invalidate_user_files(self, user_id: int):
        key = f"user_files:{user_id}"
        self.redis.delete(key)

cache_service = CacheService()