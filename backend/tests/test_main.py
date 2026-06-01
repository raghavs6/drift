import pytest
from fastapi.testclient import TestClient

import app.main as main
from app.main import app
from app.core.config import settings

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
    res = client.get("/api/experiences")
    assert res.status_code == 200
    body = res.json()
    assert "items" in body
    assert isinstance(body["items"], list)


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
