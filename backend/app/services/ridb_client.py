import asyncio

import httpx

from app.core.config import settings


RIDB_BASE_URL = "https://ridb.recreation.gov/api/v1"
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


async def fetch_facilities(state: str) -> list[dict]:
    if not settings.ridb_api_key:
        raise RuntimeError("RIDB_API_KEY not configured")

    facilities: list[dict] = []
    offset = 0

    async with httpx.AsyncClient(base_url=RIDB_BASE_URL, timeout=30.0) as client:
        while True:
            response = await _get_with_retry(
                client,
                "/facilities",
                headers={"apikey": settings.ridb_api_key},
                params={"state": state, "offset": offset, "limit": PAGE_LIMIT},
            )
            payload = response.json()
            page = payload.get("RECDATA") or []
            facilities.extend(page)

            if len(page) < PAGE_LIMIT:
                break
            offset += PAGE_LIMIT
            await asyncio.sleep(PAGE_DELAY_SECONDS)

    return facilities
