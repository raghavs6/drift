import time
from collections import defaultdict

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic

from app.core.config import settings

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


RATE_LIMIT_MAX_REQUESTS = settings.rate_limit_max_requests
RATE_LIMIT_WINDOW_SECONDS = settings.rate_limit_window_seconds

_request_log: dict[str, list[float]] = defaultdict(list)


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
def list_experiences() -> dict[str, list]:
    return {"items": []}


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

    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )

    plan_text = message.content[0].text
    return {"plan": plan_text}
