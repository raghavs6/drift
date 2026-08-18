"""Tests for the server-owned user-data routes (preferences, swipes, collections).

These mirror the DB-free style of test_main.py: auth is exercised through the
real dependency, and the routes' pre-DB logic (guards, validation) is checked by
overriding get_current_user. Full data round-trips are covered by the e2e step
against a real Postgres, since the models use Postgres-only column types (JSONB).
"""
from uuid import uuid4

import jwt
import pytest
from fastapi.testclient import TestClient

from app.core import auth as auth_module
from app.core.auth import get_current_user
from app.main import app
from app.models.user import User

TEST_JWT_SECRET = "test-secret-not-a-real-key"

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


@pytest.fixture
def jwt_secret(monkeypatch):
    """Give the auth dependency a known signing secret, so tokens verify."""
    monkeypatch.setattr(auth_module.settings, "supabase_jwt_secret", TEST_JWT_SECRET)
    return TEST_JWT_SECRET


def _bearer(claims, secret):
    token = jwt.encode({"aud": "authenticated", **claims}, secret, algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.parametrize(
    "claims,case",
    [
        ({"sub": "not-a-uuid"}, "sub is not a UUID"),
        ({"email": "nobody@example.com"}, "sub is missing entirely"),
        ({"sub": None}, "sub is null"),
        ({"sub": 12345}, "sub is not a string"),
    ],
)
def test_malformed_sub_is_401_not_500(jwt_secret, claims, case):
    """A correctly-signed token with an unusable `sub` is an auth failure, not a crash.

    This used to raise KeyError/ValueError out of `UUID(claims["sub"])`, surfacing
    as a 500 with a stack trace instead of a 401.
    """
    res = client.get("/api/preferences", headers=_bearer(claims, jwt_secret))
    assert res.status_code == 401, case


def test_token_signed_with_wrong_secret_is_401(jwt_secret):
    res = client.get("/api/preferences", headers=_bearer({"sub": str(uuid4())}, "wrong-secret"))
    assert res.status_code == 401


def test_missing_jwt_secret_is_500_not_401(monkeypatch):
    """Server misconfiguration must not masquerade as the caller's fault."""
    monkeypatch.setattr(auth_module.settings, "supabase_jwt_secret", None)
    res = client.get("/api/preferences", headers=_bearer({"sub": str(uuid4())}, "any-secret"))
    assert res.status_code == 500
