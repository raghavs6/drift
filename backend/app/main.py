import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic

load_dotenv()

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
async def plan_trip(req: TripPlanRequest):
    api_key = os.getenv("ANTHROPIC_API_KEY")
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
