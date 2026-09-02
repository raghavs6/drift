import asyncio

import httpx
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
    assert experience["difficulty"] is None
    assert experience["cost"] is None


def test_nps_to_experience_populates_required_fields():
    experience = nps_to_experience(NPS_SAMPLE)

    assert_required_fields_populated(experience)
    assert experience["source"] == "nps"
    assert experience["source_id"] == "test"
    assert experience["latitude"] == 43.0731
    assert experience["longitude"] == -89.4012
    assert experience["description"] == "Official NPS description wins when records overlap."
    assert experience["state"] == "WI"
    assert experience["category"] == "hiking"
    assert experience["difficulty"] == "Moderate"
    assert experience["cost"] is None


def test_merge_prefers_nps_detail_and_keeps_ridb_id():
    ridb = ridb_to_experience(RIDB_SAMPLE)
    nps = nps_to_experience(NPS_SAMPLE)

    merged = merge_prefer_nps(ridb, nps)

    assert merged["source"] == "nps"
    assert merged["source_id"] == "nps:test|ridb:123"
    assert merged["description"] == "Official NPS description wins when records overlap."
    assert merged["images"][0] == "https://example.com/nps-one.jpg"


async def _fetch_one(fetch, state):
    async with httpx.AsyncClient(timeout=30.0) as client:
        return await fetch(client, state)


@pytest.mark.skipif(not settings.ridb_api_key, reason="RIDB_API_KEY not configured")
def test_fetch_facilities_wi_returns_raw_list():
    facilities = asyncio.run(_fetch_one(fetch_facilities, "WI"))

    assert facilities
    assert isinstance(facilities[0], dict)


@pytest.mark.skipif(not settings.nps_api_key, reason="NPS_API_KEY not configured")
def test_fetch_parks_wi_returns_raw_list():
    parks = asyncio.run(_fetch_one(fetch_parks, "WI"))

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

    async def unauthorized(client, state):
        raise RuntimeError("401 Unauthorized")

    monkeypatch.setattr(sync, "fetch_facilities", unauthorized)
    monkeypatch.setattr(sync, "fetch_parks", unauthorized)

    with pytest.raises(RuntimeError) as excinfo:
        asyncio.run(sync.run_sync(session=None))

    message = str(excinfo.value)
    assert "all 50 states" in message
    assert "401 Unauthorized" in message


def test_run_sync_reports_the_real_error_for_a_partial_failure(monkeypatch):
    async def ridb(client, state):
        if state == "WI":
            raise RuntimeError("429 Too Many Requests")
        return []

    async def nps(client, state):
        return []

    monkeypatch.setattr(sync, "fetch_facilities", ridb)
    monkeypatch.setattr(sync, "fetch_parks", nps)
    monkeypatch.setattr(sync, "_upsert_experiences", lambda session, rows: None)

    result = asyncio.run(sync.run_sync(session=None))

    assert result["failed_states"] == ["WI"]
    assert any("429 Too Many Requests" in error for error in result["errors"])


# --- enrichment from fields the APIs actually return ------------------------
#
# Every synced row used to get difficulty="Moderate", cost="Free" and category="hiking"
# for anything the keyword chain did not match, so the whole catalog looked identical.


def _ridb(**overrides):
    return {**RIDB_SAMPLE, **overrides}


def test_category_reads_the_activity_list_rather_than_guessing_from_text():
    experience = ridb_to_experience(
        _ridb(FacilityName="Sector 9 Wall", FacilityTypeDescription="Facility",
              ACTIVITY=[{"ActivityName": "ROCK CLIMBING"}])
    )

    assert experience["category"] == "climbing"


def test_a_distinctive_activity_beats_the_ubiquitous_ones():
    """Almost every facility lists HIKING and CAMPING; ranking by frequency would put the
    whole catalog back into two buckets."""
    experience = ridb_to_experience(
        _ridb(ACTIVITY=[
            {"ActivityName": "HIKING"},
            {"ActivityName": "CAMPING"},
            {"ActivityName": "STAR GAZING"},
        ])
    )

    assert experience["category"] == "stargazing"


def test_nps_title_case_activities_match_too():
    experience = nps_to_experience({**NPS_SAMPLE, "activities": [{"name": "Birdwatching"}]})

    assert experience["category"] == "wildlife"


def test_difficulty_is_easy_when_front_country_access_exists():
    experience = nps_to_experience({
        **NPS_SAMPLE,
        "activities": [{"name": "Backcountry Hiking"}, {"name": "Front-Country Hiking"}],
    })

    assert experience["difficulty"] == "Easy"


def test_difficulty_is_hard_when_only_backcountry_access_exists():
    experience = nps_to_experience({
        **NPS_SAMPLE,
        "activities": [{"name": "Backcountry Hiking"}, {"name": "Backpacking"}],
    })

    assert experience["difficulty"] == "Hard"


def test_ada_access_of_no_is_not_read_as_accessible():
    """FacilityAdaAccess is 'n' or 'no' on most records and only rarely 'yes'. Treating the
    field as a boolean by checking it is non-empty would mark the whole catalog Easy."""
    assert ridb_to_experience(_ridb(FacilityAdaAccess="N"))["difficulty"] is None
    assert ridb_to_experience(_ridb(FacilityAdaAccess="Yes"))["difficulty"] == "Easy"


def test_cost_uses_the_cheapest_paid_entrance_fee():
    experience = nps_to_experience({
        **NPS_SAMPLE,
        "entranceFees": [
            {"cost": "20.00", "title": "Entrance - Private Vehicle"},
            {"cost": "15.00", "title": "Entrance - Motorcycle"},
            {"cost": "300.00", "title": "Commercial - Bus"},
        ],
    })

    assert experience["cost"] == "$15"


def test_cost_is_free_only_when_the_source_says_zero():
    experience = nps_to_experience({**NPS_SAMPLE, "entranceFees": [{"cost": "0.00"}]})

    assert experience["cost"] == "Free"


def test_ridb_fee_prose_reports_that_a_fee_exists_without_inventing_an_amount():
    experience = ridb_to_experience(
        _ridb(FacilityUseFeeDescription="<p>There is a $5 use fee for day use.</p>")
    )

    assert experience["cost"] == "Fee required"
