import pytest
from fastapi.testclient import TestClient
from sqlalchemy.dialects import postgresql

import app.main as main
from app.main import app
from app.core.config import settings
from app.core.database import get_session
from app.models.experience import Experience

client = TestClient(app)


@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    """Clear the in-memory rate-limit log so tests don't bleed into each other."""
    main._request_log.clear()
    yield
    main._request_log.clear()


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "service": "drift-backend"}


def test_list_experiences_shape():
    class FakeResult:
        def all(self):
            return [
                Experience(
                    id="test-park",
                    title="Test Park",
                    hook="A scenic test park",
                    location="Madison, WI",
                    state="WI",
                    distance="1 hr",
                    difficulty="Moderate",
                    cost="Free",
                    time="2-3 hrs",
                    season="Year-round",
                    category="hiking",
                    category_label="Hiking",
                    description="A test description.",
                    description2="Check current conditions, hours, and access details before you head out.",
                    condition="Check conditions",
                    condition_type="check",
                    kid_friendly=False,
                    min_age=0,
                    condition_score=0,
                    what_to_bring=["Water"],
                    images=["#5A8F6E", "#3D6B4E", "#8BB89A"],
                    source="nps",
                    source_id="test",
                )
            ]

    class FakeSession:
        def exec(self, _statement):
            return FakeResult()

    def override_get_session():
        yield FakeSession()

    app.dependency_overrides[get_session] = override_get_session
    res = client.get("/api/experiences")
    app.dependency_overrides.clear()

    assert res.status_code == 200
    body = res.json()
    assert "items" in body
    assert isinstance(body["items"], list)
    assert body["items"][0]["title"] == "Test Park"
    assert body["items"][0]["categoryLabel"] == "Hiking"
    assert body["items"][0]["whatToBring"] == ["Water"]


def test_list_experiences_applies_filters_and_limit():
    captured = {}

    class FakeResult:
        def all(self):
            return []

    class FakeSession:
        def exec(self, statement):
            captured["statement"] = statement
            return FakeResult()

    def override_get_session():
        yield FakeSession()

    app.dependency_overrides[get_session] = override_get_session
    res = client.get(
        "/api/experiences",
        params={
            "category": "hiking",
            "state": "WI",
            "difficulty": "Easy",
            "kid_friendly": "false",
            "limit": 25,
        },
    )
    app.dependency_overrides.clear()

    assert res.status_code == 200
    compiled = captured["statement"].compile(
        dialect=postgresql.dialect(),
        compile_kwargs={"literal_binds": True},
    )
    sql = str(compiled)
    assert "experiences.category = 'hiking'" in sql
    assert "experiences.state = 'WI'" in sql
    assert "experiences.difficulty = 'Easy'" in sql
    assert "experiences.kid_friendly = false" in sql
    assert "ORDER BY experiences.title" in sql
    assert "LIMIT 25" in sql


def test_list_experiences_uses_default_limit():
    captured = {}

    class FakeResult:
        def all(self):
            return []

    class FakeSession:
        def exec(self, statement):
            captured["statement"] = statement
            return FakeResult()

    def override_get_session():
        yield FakeSession()

    app.dependency_overrides[get_session] = override_get_session
    res = client.get("/api/experiences")
    app.dependency_overrides.clear()

    assert res.status_code == 200
    assert captured["statement"]._limit_clause.value == 100


@pytest.mark.parametrize("limit", [0, 501])
def test_list_experiences_rejects_out_of_range_limit(limit):
    res = client.get("/api/experiences", params={"limit": limit})

    assert res.status_code == 422


def test_plan_trip_requires_title():
    res = client.post("/api/plan-trip", json={"category": "hiking"})
    assert res.status_code == 422


def test_plan_trip_missing_api_key(monkeypatch):
    monkeypatch.setattr(settings, "anthropic_api_key", None)
    res = client.post("/api/plan-trip", json={"title": "Sunset ridge hike"})
    assert res.status_code == 500
    assert "ANTHROPIC_API_KEY" in res.json()["detail"]


def test_plan_trip_success(monkeypatch):
    monkeypatch.setattr(settings, "anthropic_api_key", "test-key")

    class FakeBlock:
        text = "A lovely day plan."

    class FakeMessage:
        content = [FakeBlock()]

    class FakeMessages:
        def create(self, **kwargs):
            return FakeMessage()

    class FakeClient:
        def __init__(self, *args, **kwargs):
            self.messages = FakeMessages()

    monkeypatch.setattr(main.anthropic, "Anthropic", FakeClient)

    res = client.post("/api/plan-trip", json={"title": "Sunset ridge hike"})
    assert res.status_code == 200
    assert res.json() == {"plan": "A lovely day plan."}


def test_plan_trip_rate_limited(monkeypatch):
    monkeypatch.setattr(settings, "anthropic_api_key", None)
    limit = settings.rate_limit_max_requests
    # The first `limit` requests pass the rate check (then 500 on the missing key);
    # the next one trips the limiter before reaching the key check.
    for _ in range(limit):
        client.post("/api/plan-trip", json={"title": "x"})
    res = client.post("/api/plan-trip", json={"title": "x"})
    assert res.status_code == 429
