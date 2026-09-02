"""Shared 429 retry for the catalog fetchers.

RIDB and NPS had a byte-identical copy of this each. Once the retry has to do jitter and
Retry-After parsing, keeping two copies of that logic in sync stops being realistic.
"""

import asyncio
import email.utils
import random
from datetime import datetime, timezone

import httpx


MAX_RETRIES = 3
BASE_BACKOFF_SECONDS = 0.5
MAX_BACKOFF_SECONDS = 30.0


def parse_retry_after(value: str | None) -> float | None:
    """RFC 9110 allows either a delay in seconds or an HTTP-date. Accept both."""
    if not value:
        return None

    raw = value.strip()
    try:
        return max(0.0, float(raw))
    except ValueError:
        pass

    try:
        when = email.utils.parsedate_to_datetime(raw)
    except (TypeError, ValueError):
        return None
    if when is None:
        return None
    if when.tzinfo is None:
        when = when.replace(tzinfo=timezone.utc)
    return max(0.0, (when - datetime.now(timezone.utc)).total_seconds())


def backoff_seconds(attempt: int, retry_after: float | None) -> float:
    """Full jitter, so concurrent workers that get 429'd together do not retry together.

    Without the jitter every bounded worker sleeps the same fixed interval and they all
    collide again on the next attempt, which is exactly the pile-up the bound exists to
    avoid. When the server tells us how long to wait we honour it, and still spread the
    resumption by up to a second for the same reason.
    """
    if retry_after is not None:
        return min(MAX_BACKOFF_SECONDS, retry_after) + random.uniform(0, 1)

    ceiling = min(MAX_BACKOFF_SECONDS, BASE_BACKOFF_SECONDS * (2**attempt))
    return random.uniform(0, ceiling)


async def get_with_retry(client: httpx.AsyncClient, url: str, **kwargs) -> httpx.Response:
    for attempt in range(MAX_RETRIES):
        response = await client.get(url, **kwargs)
        if response.status_code != 429:
            response.raise_for_status()
            return response
        if attempt == MAX_RETRIES - 1:
            break
        await asyncio.sleep(backoff_seconds(attempt, parse_retry_after(response.headers.get("Retry-After"))))

    response.raise_for_status()
    return response
