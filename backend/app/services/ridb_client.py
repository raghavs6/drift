import asyncio

import httpx

from app.core.config import settings
from app.services.http_retry import get_with_retry


RIDB_BASE_URL = "https://ridb.recreation.gov/api/v1"
PAGE_LIMIT = 50
PAGE_DELAY_SECONDS = 0.15


async def fetch_facilities(client: httpx.AsyncClient, state: str) -> list[dict]:
    """The caller owns the client, so one connection pool is reused across every state."""
    if not settings.ridb_api_key:
        raise RuntimeError("RIDB_API_KEY not configured")

    facilities: list[dict] = []
    offset = 0

    while True:
        response = await get_with_retry(
            client,
            f"{RIDB_BASE_URL}/facilities",
            headers={"apikey": settings.ridb_api_key},
            # full=true nests each facility's ACTIVITY list in the response. Without it
            # the key is present but always empty, and category has nothing real to read.
            params={"state": state, "offset": offset, "limit": PAGE_LIMIT, "full": "true"},
        )
        payload = response.json()
        page = payload.get("RECDATA") or []
        facilities.extend(page)

        if len(page) < PAGE_LIMIT:
            break
        offset += PAGE_LIMIT
        await asyncio.sleep(PAGE_DELAY_SECONDS)

    return facilities
