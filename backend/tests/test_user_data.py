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

from app.api.collections import _frontend_id
from app.core import auth as auth_module
from app.core.auth import get_current_user
from app.core.database import get_async_session
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


class _FakeResult:
    def __init__(self, rows):
        self._rows = rows

    def all(self):
        return self._rows


class _FakeSession:
    """Answers the two SELECTs put_collections issues, and records the inserts."""

    def __init__(self, known_experience_ids):
        self.known = list(known_experience_ids)
        self.added = []

    async def exec(self, statement):
        sql = str(statement)
        if sql.lstrip().upper().startswith("DELETE"):
            return None
        if "experiences" in sql:
            return _FakeResult(self.known)
        return _FakeResult([])  # no pre-existing collections

    def add(self, obj):
        self.added.append(obj)

    async def commit(self):
        pass


def _put_collections(fake_user, collections, known_experience_ids):
    session = _FakeSession(known_experience_ids)
    app.dependency_overrides[get_async_session] = lambda: session
    try:
        res = client.put("/api/collections", json={"collections": collections})
    finally:
        app.dependency_overrides.pop(get_async_session, None)
    return res, session


def test_put_collections_drops_unknown_experience_ids(fake_user):
    """An id missing from the catalog is skipped and reported, not a 500.

    experience_id is a foreign key, so inserting an unknown id used to abort the
    whole transaction with an IntegrityError. Rejecting the request outright is
    worse: this is a full-replace PUT, so one dead id from a catalog re-sync
    would permanently break that user's sync.
    """
    res, session = _put_collections(
        fake_user,
        [{"id": "saved", "label": "Saved", "icon": "💚", "itemIds": ["real-park", "ghost-park"]}],
        known_experience_ids=["real-park"],
    )

    assert res.status_code == 200
    assert res.json()["droppedIds"] == ["ghost-park"]

    item_ids = [o.experience_id for o in session.added if hasattr(o, "experience_id")]
    assert item_ids == ["real-park"]


def test_put_collections_reports_nothing_when_all_ids_are_known(fake_user):
    res, session = _put_collections(
        fake_user,
        [{"id": "saved", "label": "Saved", "icon": "💚", "itemIds": ["a", "b"]}],
        known_experience_ids=["a", "b"],
    )

    assert res.status_code == 200
    assert res.json()["droppedIds"] == []

    item_ids = sorted(o.experience_id for o in session.added if hasattr(o, "experience_id"))
    assert item_ids == ["a", "b"]


def test_put_collections_handles_empty_collections(fake_user):
    res, _ = _put_collections(fake_user, [], known_experience_ids=[])

    assert res.status_code == 200
    assert res.json()["droppedIds"] == []


@pytest.mark.parametrize(
    "db_id,expected",
    [
        ("11111111-1111-1111-1111-111111111111:saved", "saved"),
        ("11111111-1111-1111-1111-111111111111:collection-summer-1", "collection-summer-1"),
        ("saved", "saved"),  # written without the namespace prefix: must not IndexError
    ],
)
def test_frontend_id_tolerates_a_missing_namespace(db_id, expected):
    assert _frontend_id(db_id) == expected
