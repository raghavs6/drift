import json
import time
from collections import defaultdict

from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
import anthropic

from app.api import collections_router, preferences_router, swipes_router
from app.core.config import settings
from app.core.database import get_async_session
from app.models.experience import Experience

app = FastAPI(
    title="Drift API",
    version="0.1.0",
    description="FastAPI backend for the Drift outdoor discovery MVP.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(preferences_router)
app.include_router(swipes_router)
app.include_router(collections_router)


RATE_LIMIT_MAX_REQUESTS = settings.rate_limit_max_requests
RATE_LIMIT_WINDOW_SECONDS = settings.rate_limit_window_seconds

_request_log: dict[str, list[float]] = defaultdict(list)

# The catalog is unauthenticated and identical for every caller, changing only
# when a sync runs, so a short TTL takes both Postgres and the JSON encoding
# off the hot path. Encoding is the half worth caching: ?limit=500 is ~1.5 MB
# and json encoding is GIL-bound, so caching rows would pay that cost per hit.
_CATALOG_TTL_SECONDS = 60
# Bounded because the key is built from query params, which the caller controls;
# an unbounded dict keyed on user input is a memory leak. Clearing wholesale
# rather than evicting LRU: at this size the bookkeeping costs more than the
# occasional cold miss.
_CATALOG_CACHE_MAX_ENTRIES = 128
_catalog_cache: dict[tuple, tuple[float, bytes]] = {}


def _check_rate_limit(client_ip: str) -> None:
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW_SECONDS
    timestamps = _request_log[client_ip]
    _request_log[client_ip] = [t for t in timestamps if t > window_start]
    if len(_request_log[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Try again in {RATE_LIMIT_WINDOW_SECONDS}s.",
        )
    _request_log[client_ip].append(now)


class TripPlanRequest(BaseModel):
    title: str
    category: str | None = None
    distance: str | None = None
    difficulty: str | None = None
    cost: str | None = None
    description: str | None = None
    location: str | None = None
    tags: list[str] | None = None


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "drift-backend"}


@app.get("/api/experiences")
async def list_experiences(
    category: str | None = None,
    state: str | None = None,
    difficulty: str | None = None,
    kid_friendly: bool | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    session: AsyncSession = Depends(get_async_session),
) -> Response:
    # Keyed on every filter, not just `limit`: two different filters must never
    # serve each other's rows.
    cache_key = (category, state, difficulty, kid_friendly, limit)
    now = time.time()
    cached = _catalog_cache.get(cache_key)
    if cached is not None and now - cached[0] < _CATALOG_TTL_SECONDS:
        return Response(content=cached[1], media_type="application/json")

    statement = select(Experience)
    if category is not None:
        statement = statement.where(Experience.category == category)
    if state is not None:
        statement = statement.where(Experience.state == state)
    if difficulty is not None:
        statement = statement.where(Experience.difficulty == difficulty)
    if kid_friendly is not None:
        statement = statement.where(Experience.kid_friendly == kid_friendly)

    statement = statement.order_by(Experience.title).limit(limit)
    experiences = (await session.exec(statement)).all()
    body = {"items": [_experience_payload(experience) for experience in experiences]}
    encoded = json.dumps(jsonable_encoder(body)).encode()

    if len(_catalog_cache) >= _CATALOG_CACHE_MAX_ENTRIES:
        _catalog_cache.clear()
    _catalog_cache[cache_key] = (now, encoded)
    return Response(content=encoded, media_type="application/json")


def _experience_payload(experience: Experience) -> dict:
    item = experience.model_dump()
    item["categoryLabel"] = experience.category_label
    item["conditionType"] = experience.condition_type
    item["kidFriendly"] = experience.kid_friendly
    item["minAge"] = experience.min_age
    item["conditionScore"] = experience.condition_score
    item["whatToBring"] = experience.what_to_bring
    return item


@app.post("/api/plan-trip")
async def plan_trip(req: TripPlanRequest, request: Request):
    _check_rate_limit(request.client.host)
    api_key = settings.anthropic_api_key
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")

    details = [f"Activity: {req.title}"]
    if req.category:
        details.append(f"Category: {req.category}")
    if req.location:
        details.append(f"Location: {req.location}")
    if req.distance:
        details.append(f"Distance: {req.distance}")
    if req.difficulty:
        details.append(f"Difficulty: {req.difficulty}")
    if req.cost:
        details.append(f"Cost: {req.cost}")
    if req.description:
        details.append(f"Description: {req.description}")
    if req.tags:
        details.append(f"Tags: {', '.join(req.tags)}")

    prompt = f"""Plan a fun, practical day trip for this outdoor experience:

{chr(10).join(details)}

Create a friendly, concise trip plan with:
1. **Best time to go** — ideal time of day and season
2. **What to bring** — essential gear and supplies (keep it short, 5-8 items)
3. **Getting there** — brief travel tips
4. **Itinerary** — a simple timeline with 3-5 key moments
5. **Pro tips** — 2-3 insider tips to make it great

Keep the tone warm and encouraging, like a friend who knows the spot well. Be concise — no more than 250 words total."""

    # Async client, awaited: the synchronous client blocked the event loop for the
    # full API call, stalling every other request on this worker (see
    # benchmarks/results/baseline — p99 was ~2.1s on endpoints that read one row).
    async with anthropic.AsyncAnthropic(api_key=api_key) as client:
        message = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )

    plan_text = message.content[0].text
    return {"plan": plan_text}
