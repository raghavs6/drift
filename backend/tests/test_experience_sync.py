import asyncio

import pytest

from app.core.config import settings
from app.services.nps_client import fetch_parks
from app.services.ridb_client import fetch_facilities
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
