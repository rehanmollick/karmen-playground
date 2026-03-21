import hashlib
import time
from typing import Any, Optional, Dict
from collections import defaultdict
import os

CACHE_TTL = int(os.getenv("CACHE_TTL_SECONDS", "3600"))
RATE_LIMIT = int(os.getenv("RATE_LIMIT_PER_HOUR", "10"))


class CacheManager:
    def __init__(self):
        self._cache: Dict[str, tuple] = {}
        self._ip_calls: Dict[str, list] = defaultdict(list)

    def _key(self, prompt: str) -> str:
        return hashlib.sha256(prompt.encode()).hexdigest()

    def get(self, prompt: str) -> Optional[Any]:
        key = self._key(prompt)
        return self.get_by_key(key)

    def set(self, prompt: str, value: Any) -> None:
        key = self._key(prompt)
        self.set_by_key(key, value)

    def get_by_key(self, key: str) -> Optional[Any]:
        if key in self._cache:
            value, ts = self._cache[key]
            if time.time() - ts < CACHE_TTL:
                return value
            del self._cache[key]
        return None

    def set_by_key(self, key: str, value: Any) -> None:
        self._cache[key] = (value, time.time())

    def check_rate_limit(self, ip: str) -> bool:
        """Returns True if under limit, False if exceeded."""
        now = time.time()
        hour_ago = now - 3600
        self._ip_calls[ip] = [t for t in self._ip_calls[ip] if t > hour_ago]
        if len(self._ip_calls[ip]) >= RATE_LIMIT:
            return False
        self._ip_calls[ip].append(now)
        return True


cache = CacheManager()
