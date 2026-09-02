import asyncio

import httpx

from app.core.config import settings
from app.services.http_retry import get_with_retry


NPS_BASE_URL = "https://developer.nps.gov/api/v1"
PAGE_LIMIT = 50
PAGE_DELAY_SECONDS = 0.15


async def fetch_parks(client: httpx.AsyncClient, state: str) -> list[dict]:
    """The caller owns the client, so one connection pool is reused across every state."""
    if not settings.nps_api_key:
        raise RuntimeError("NPS_API_KEY not configured")

    parks: list[dict] = []
    start = 0

    while True:
        response = await get_with_retry(
            client,
            f"{NPS_BASE_URL}/parks",
            params={
                "stateCode": state,
                "api_key": settings.nps_api_key,
                "start": start,
                "limit": PAGE_LIMIT,
            },
        )
        payload = response.json()
        page = payload.get("data") or []
        parks.extend(page)

        if len(page) < PAGE_LIMIT:
            break
        start += PAGE_LIMIT
        await asyncio.sleep(PAGE_DELAY_SECONDS)

    return parks
