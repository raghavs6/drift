"""Tests for the server-owned user-data routes (preferences, swipes, collections).

These mirror the DB-free style of test_main.py: auth is exercised through the
real dependency, and the routes' pre-DB logic (guards, validation) is checked by
overriding get_current_user. Full data round-trips are covered by the e2e step
against a real Postgres, since the models use Postgres-only column types (JSONB).
"""
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.core.auth import get_current_user
from app.main import app
from app.models.user import User

client = TestClient(app)


@pytest.fixture
def fake_user():
    """Override auth so the route body runs without a real token."""
    user = User(id=uuid4(), email="tester@example.com")
    app.dependency_overrides[get_current_user] = lambda: user
    yield user
    app.dependency_overrides.clear()


@pytest.mark.parametrize(
    "method,path",
    [
        ("get", "/api/preferences"),
        ("put", "/api/preferences"),
        ("get", "/api/swipes"),
        ("post", "/api/swipes"),
        ("get", "/api/collections"),
        ("put", "/api/collections"),
    ],
)
def test_routes_require_bearer_token(method, path):
    res = client.request(method, path, json={})
    assert res.status_code == 401


def test_swipe_rejects_invalid_action(fake_user):
    res = client.post(
        "/api/swipes", json={"experience_id": "test-park", "action": "love"}
    )
    assert res.status_code == 422
