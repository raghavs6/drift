import asyncio

import pytest

from app.core.config import settings
from app.services.nps_client import fetch_parks
from app.services.ridb_client import fetch_facilities
from app.services import sync
from app.services.sync import merge_prefer_nps, nps_to_experience, ridb_to_experience


RIDB_SAMPLE = {
    "FacilityID": 123,
    "FacilityName": "Test Lake Recreation Area",
    "FacilityDescription": "A quiet lake with trails and picnic areas.",
    "FacilityLatitude": "43.0731",
    "FacilityLongitude": "-89.4012",
    "FacilityCity": "Madison",
    "FacilityStateCode": "WI",
    "FacilityTypeDescription": "Lake",
    "MEDIA": [
        {"URL": "https://example.com/one.jpg"},
        {"URL": "https://example.com/two.jpg"},
        {"URL": "https://example.com/three.jpg"},
    ],
}

NPS_SAMPLE = {
    "parkCode": "test",
    "fullName": "Test Lake Recreation Area",
    "description": "Official NPS description wins when records overlap.",
    "latLong": "lat:43.0731, long:-89.4012",
    "states": "WI",
    "activities": [{"name": "Hiking"}],
    "addresses": [{"city": "Madison", "stateCode": "WI"}],
    "images": [
        {"url": "https://example.com/nps-one.jpg"},
        {"url": "https://example.com/nps-two.jpg"},
        {"url": "https://example.com/nps-three.jpg"},
    ],
}

REQUIRED_FIELDS = [
    "id",
    "title",
    "hook",
    "location",
    "state",
    "distance",
    "difficulty",
    "cost",
    "time",
    "season",
    "category",
    "category_label",
    "description",
    "description2",
    "condition",
    "condition_type",
    "kid_friendly",
    "min_age",
    "condition_score",
    "what_to_bring",
    "images",
    "source",
    "source_id",
]


def assert_required_fields_populated(experience):
    for field in REQUIRED_FIELDS:
        assert experience[field] is not None, field
    assert experience["distance"] == "1 hr"
    assert experience["difficulty"] == "Moderate"
    assert experience["cost"] == "Free"
    assert experience["time"] == "2-3 hrs"
    assert experience["season"] == "Year-round"
    assert experience["what_to_bring"] == ["Water", "Layers", "Phone charger", "Trail snacks"]
    assert len(experience["images"]) == 3


def test_ridb_to_experience_populates_required_fields():
    experience = ridb_to_experience(RIDB_SAMPLE)

    assert_required_fields_populated(experience)
    assert experience["source"] == "ridb"
    assert experience["source_id"] == "123"
    assert experience["latitude"] == 43.0731
    assert experience["longitude"] == -89.4012
    assert experience["category"] == "water"
    assert experience["state"] == "WI"


def test_nps_to_experience_populates_required_fields():
    experience = nps_to_experience(NPS_SAMPLE)

    assert_required_fields_populated(experience)
    assert experience["source"] == "nps"
    assert experience["source_id"] == "test"
    assert experience["latitude"] == 43.0731
    assert experience["longitude"] == -89.4012
    assert experience["description"] == "Official NPS description wins when records overlap."
    assert experience["state"] == "WI"


def test_merge_prefers_nps_detail_and_keeps_ridb_id():
    ridb = ridb_to_experience(RIDB_SAMPLE)
    nps = nps_to_experience(NPS_SAMPLE)

    merged = merge_prefer_nps(ridb, nps)

    assert merged["source"] == "nps"
    assert merged["source_id"] == "nps:test|ridb:123"
    assert merged["description"] == "Official NPS description wins when records overlap."
    assert merged["images"][0] == "https://example.com/nps-one.jpg"


@pytest.mark.skipif(not settings.ridb_api_key, reason="RIDB_API_KEY not configured")
def test_fetch_facilities_wi_returns_raw_list():
    facilities = asyncio.run(fetch_facilities("WI"))

    assert facilities
    assert isinstance(facilities[0], dict)


@pytest.mark.skipif(not settings.nps_api_key, reason="NPS_API_KEY not configured")
def test_fetch_parks_wi_returns_raw_list():
    parks = asyncio.run(fetch_parks("WI"))

    assert parks
    assert isinstance(parks[0], dict)


def test_source_index_is_declared_on_the_model():
    """The sync upsert's ON CONFLICT target must live in SQLModel.metadata.

    ix_experiences_source_source_id was created by migration 0002 but never
    declared on the Experience model. `alembic revision --autogenerate` compares
    the DB against the model metadata, so it would emit a drop_index for it --
    and the next sync would silently insert duplicates instead of upserting.
    """
    from app.models.experience import Experience

    index = next(
        (ix for ix in Experience.__table__.indexes if ix.name == "ix_experiences_source_source_id"),
        None,
    )
    assert index is not None, "index missing from the model; autogenerate would drop it"
    assert index.unique is True
    assert [c.name for c in index.columns] == ["source", "source_id"]


def test_run_sync_raises_when_every_state_fails(monkeypatch):
    """A run that fetched nothing must fail loudly, not return rows=0 as a success.

    Both bare `except Exception` blocks used to discard the real error, so a sync with
    bad keys "succeeded" with an empty catalog -- which would also make a fast run that
    fetched nothing look like a throughput win.
    """

    async def unauthorized(state):
        raise RuntimeError("401 Unauthorized")

    monkeypatch.setattr(sync, "fetch_facilities", unauthorized)
    monkeypatch.setattr(sync, "fetch_parks", unauthorized)

    with pytest.raises(RuntimeError) as excinfo:
        asyncio.run(sync.run_sync(session=None))

    message = str(excinfo.value)
    assert "all 50 states" in message
    assert "401 Unauthorized" in message


def test_run_sync_reports_the_real_error_for_a_partial_failure(monkeypatch):
    async def ridb(state):
        if state == "WI":
            raise RuntimeError("429 Too Many Requests")
        return []

    async def nps(state):
        return []

    monkeypatch.setattr(sync, "fetch_facilities", ridb)
    monkeypatch.setattr(sync, "fetch_parks", nps)
    monkeypatch.setattr(sync, "_upsert_experiences", lambda session, rows: None)

    result = asyncio.run(sync.run_sync(session=None))

    assert result["failed_states"] == ["WI"]
    assert any("429 Too Many Requests" in error for error in result["errors"])
