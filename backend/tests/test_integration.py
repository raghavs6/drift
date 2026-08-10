"""Live round-trip tests for the server-owned data routes against real Postgres.

Skipped by default (the models use Postgres-only JSONB, so they can't run on the
DB-free suite). Run explicitly once Postgres is up and migrated:

    docker compose up -d && alembic upgrade head
    RUN_DB_INTEGRATION=1 SUPABASE_JWT_SECRET=test-secret pytest tests/test_integration.py
"""
import os
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, delete

pytestmark = pytest.mark.skipif(
    os.getenv("RUN_DB_INTEGRATION") != "1",
    reason="set RUN_DB_INTEGRATION=1 (with Postgres up) to run live round-trip tests",
)


@pytest.fixture
def ctx():
    from app.core.config import settings
    from app.core.database import engine
    from app.main import app
    from app.models import Collection, CollectionItem, Experience, Swipe

    user_id = str(uuid4())
    exp_id = f"itest-{uuid4().hex[:8]}"
    token = jwt.encode(
        {
            "sub": user_id,
            "email": "itest@example.com",
            "aud": "authenticated",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        },
        settings.supabase_jwt_secret,
        algorithm="HS256",
    )

    with Session(engine) as s:
        s.add(
            Experience(
                id=exp_id, title="Integration Park", hook="test", location="Madison, WI",
                state="WI", distance="1 hr", difficulty="Easy", cost="Free", time="2 hrs",
                season="Year-round", category="hiking", category_label="Hiking",
                description="d", description2="d2", condition="Check", condition_type="check",
                kid_friendly=False, min_age=0, condition_score=0, what_to_bring=["Water"],
                images=["#5A8F6E"], source="itest", source_id="itest",
            )
        )
        s.commit()

    yield {
        "client": TestClient(app),
        "auth": {"Authorization": f"Bearer {token}"},
        "user_id": user_id,
        "exp_id": exp_id,
    }

    with Session(engine) as s:
        s.exec(delete(Swipe).where(Swipe.user_id == user_id))
        s.exec(delete(CollectionItem).where(CollectionItem.experience_id == exp_id))
        s.exec(delete(Collection).where(Collection.user_id == user_id))
        s.exec(delete(Experience).where(Experience.id == exp_id))
        s.commit()


def test_preferences_round_trip(ctx):
    client, auth = ctx["client"], ctx["auth"]
    r = client.put("/api/preferences", headers=auth, json={
        "location": "Madison, WI", "distance": "1 hr", "age": "25–34",
        "comfort": "Moderate", "kidFriendly": True, "childAge": 8,
        "vibes": ["hiking", "water"], "onboardingComplete": True,
    })
    assert r.status_code == 200, r.text
    body = client.get("/api/preferences", headers=auth).json()
    assert body["vibes"] == ["hiking", "water"]
    assert body["onboardingComplete"] is True
    assert body["kidFriendly"] is True


def test_swipe_round_trip(ctx):
    client, auth, exp_id = ctx["client"], ctx["auth"], ctx["exp_id"]
    assert client.post("/api/swipes", headers=auth,
                       json={"experience_id": exp_id, "action": "skip"}).status_code == 200
    assert client.post("/api/swipes", headers=auth,
                       json={"experience_id": exp_id, "action": "save"}).status_code == 200
    assert client.get("/api/swipes", headers=auth).json()["skippedIds"] == [exp_id]


def test_collections_round_trip(ctx):
    client, auth, exp_id = ctx["client"], ctx["auth"], ctx["exp_id"]
    assert client.put("/api/collections", headers=auth, json={"collections": [
        {"id": "saved", "label": "Saved", "icon": "💚", "itemIds": [exp_id]},
        {"id": "bucket", "label": "Bucket List", "icon": "⭐", "itemIds": []},
    ]}).status_code == 200
    cols = client.get("/api/collections", headers=auth).json()["collections"]
    saved = next(c for c in cols if c["id"] == "saved")
    assert saved["itemIds"] == [exp_id]
