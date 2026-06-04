import asyncio

import httpx

from app.core.config import settings


NPS_BASE_URL = "https://developer.nps.gov/api/v1"
PAGE_LIMIT = 50
PAGE_DELAY_SECONDS = 0.15
MAX_RETRIES = 3


async def _get_with_retry(client: httpx.AsyncClient, url: str, **kwargs) -> httpx.Response:
    for attempt in range(MAX_RETRIES):
        response = await client.get(url, **kwargs)
        if response.status_code != 429:
            response.raise_for_status()
            return response
        await asyncio.sleep(0.5 * (attempt + 1))
    response.raise_for_status()
    return response


async def fetch_parks(state: str) -> list[dict]:
    if not settings.nps_api_key:
        raise RuntimeError("NPS_API_KEY not configured")

    parks: list[dict] = []
    start = 0

    async with httpx.AsyncClient(base_url=NPS_BASE_URL, timeout=30.0) as client:
        while True:
            response = await _get_with_retry(
                client,
                "/parks",
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
