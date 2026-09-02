import logging
import re
from typing import Any

from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert
from sqlmodel import Session

from app.models.experience import Experience
from app.services.nps_client import fetch_parks
from app.services.ridb_client import fetch_facilities


STATE_CODES = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
]

DEFAULT_BRING_LIST = ["Water", "Layers", "Phone charger", "Trail snacks"]
DEFAULT_DESCRIPTION = "A promising outdoor experience from the current feed."
DEFAULT_DESCRIPTION2 = "Check current conditions, hours, and access details before you head out."
UPSERT_BATCH_SIZE = 500

logger = logging.getLogger(__name__)

FALLBACK_PALETTES = {
    "hiking": ["#5A8F6E", "#3D6B4E", "#8BB89A"],
    "water": ["#3D6B8E", "#2D5A7E", "#5A8FAE"],
    "climbing": ["#8B6B4E", "#6B4E3A", "#A88B6B"],
    "biking": ["#3A5A78", "#2D4A66", "#5A7A9A"],
    "camping": ["#4A6646", "#374F35", "#78906F"],
    "fishing": ["#4C7A74", "#325A55", "#79A7A2"],
    "stargazing": ["#1a2744", "#0d1b33", "#2a3d5c"],
    "wildlife": ["#6B8F5E", "#4A6B3E", "#8BB87A"],
    "foraging": ["#6B5A3E", "#4F432D", "#8C7A57"],
}


# RIDB returns activity names in UPPERCASE, NPS in Title Case, so match case-insensitively
# on substrings: "ICE FISHING" and "Fishing" both have to land on fishing.
#
# Ordered most-distinctive-first, and that ordering is the whole point. Nearly every
# facility offers HIKING or CAMPING, so picking the most frequent match would collapse the
# catalog straight back into two categories - which is the bug this replaces.
CATEGORY_ACTIVITY_KEYWORDS = [
    ("stargazing", ("star gazing", "stargazing", "astronomy")),
    ("foraging", ("berry picking", "mushroom", "gold panning", "hunting and gathering", "clam digging")),
    ("climbing", ("climbing",)),
    ("fishing", ("fishing", "fish hatchery", "fish viewing", "crabbing")),
    ("wildlife", ("wildlife", "birding", "birdwatching", "whale watching")),
    ("biking", ("biking", "cycling")),
    ("water", (
        "boating", "kayak", "canoe", "paddl", "rafting", "swimming", "water sports",
        "water access", "water activities", "snorkeling", "diving", "sailing",
        "beachcombing", "river trips",
    )),
    ("camping", ("camping", "recreational vehicles")),
    ("hiking", ("hiking", "backpacking", "snowshoeing")),
]

# Neither API publishes a difficulty rating, so these buckets are derived from signals that
# genuinely are published: what kind of access the place offers. Read it as "the easiest way
# to enjoy this place", which is what a comfort preference actually filters on. Easy wins over
# Hard deliberately - a park with both a visitor centre and a backcountry route is still
# suitable for a casual visitor.
EASY_ACTIVITY_KEYWORDS = (
    "day use", "picnick", "visitor center", "playground", "front-country",
    "self-guided tours - walking", "accessible", "interpretive", "auto touring",
    "scenic driv", "museum", "park film", "bookstore",
)
HARD_ACTIVITY_KEYWORDS = (
    "backpacking", "wilderness", "backcountry", "climbing", "sea kayaking",
    "rafting", "winter sports", "mountain biking",
)


def first_defined(*values: Any) -> Any:
    return next((value for value in values if value is not None and value != ""), None)


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "untitled-experience"


def label_for_category(category: str) -> str:
    return category[:1].upper() + category[1:]


def _activity_names(raw: dict) -> list[str]:
    """Activity names from either source: RIDB nests them under ACTIVITY, NPS under activities."""
    names: list[str] = []
    for key, name_key in (("ACTIVITY", "ActivityName"), ("activities", "name")):
        entries = raw.get(key)
        if not isinstance(entries, list):
            continue
        names.extend(
            entry[name_key]
            for entry in entries
            if isinstance(entry, dict) and entry.get(name_key)
        )
    return names


def category_from_activities(names: list[str]) -> str | None:
    haystack = " | ".join(names).lower()
    for category, keywords in CATEGORY_ACTIVITY_KEYWORDS:
        if any(keyword in haystack for keyword in keywords):
            return category
    return None


def derive_difficulty(raw: dict, names: list[str]) -> str | None:
    """None when the source says nothing at all - a null is honest, a constant is not."""
    ada = str(raw.get("FacilityAdaAccess") or "").strip().lower()
    accessible = ada.startswith("y")
    if not names and not accessible:
        return None

    haystack = " | ".join(names).lower()
    if accessible or any(keyword in haystack for keyword in EASY_ACTIVITY_KEYWORDS):
        return "Easy"
    if any(keyword in haystack for keyword in HARD_ACTIVITY_KEYWORDS):
        return "Hard"
    return "Moderate"


def derive_cost(raw: dict) -> str | None:
    """Real fee data where the source publishes it, None where it does not."""
    fees = raw.get("entranceFees")
    if isinstance(fees, list) and fees:
        amounts = [parse_float(fee.get("cost")) for fee in fees if isinstance(fee, dict)]
        priced = [amount for amount in amounts if amount is not None and amount > 0]
        if priced:
            # The cheapest entry is the per-person or per-motorcycle rate; the expensive tail
            # is commercial and per-bus, which is not what a visitor pays.
            return f"${min(priced):.0f}"
        if any(amount == 0 for amount in amounts if amount is not None):
            return "Free"

    fee_text = str(raw.get("FacilityUseFeeDescription") or "")
    if not fee_text.strip():
        fee_text = " ".join(
            str(entry.get("FacilityActivityFeeDescription") or "")
            for entry in raw.get("ACTIVITY") or []
            if isinstance(entry, dict)
        )
    # RIDB publishes fee prose, not an amount, and it is HTML. Saying a fee exists is all
    # that can be claimed from it without inventing a number.
    return "Fee required" if fee_text.strip() else None


def infer_category(raw: dict) -> str:
    from_activities = category_from_activities(_activity_names(raw))
    if from_activities:
        return from_activities

    source = " ".join(
        str(value)
        for value in [
            raw.get("category"),
            raw.get("categoryLabel"),
            raw.get("activity"),
            raw.get("activityType"),
            raw.get("ActivityName"),
            raw.get("FacilityTypeDescription"),
            raw.get("RecAreaName"),
            raw.get("title"),
            raw.get("name"),
            raw.get("FacilityName"),
        ]
        if value
    ).lower()

    if any(term in source for term in ["kayak", "paddle", "lake", "water"]):
        return "water"
    if "bike" in source or "cycling" in source:
        return "biking"
    if "camp" in source:
        return "camping"
    if "fish" in source:
        return "fishing"
    if "climb" in source or "scramble" in source:
        return "climbing"
    if "star" in source or "night sky" in source:
        return "stargazing"
    if "wildlife" in source or "bird" in source:
        return "wildlife"
    if "forag" in source:
        return "foraging"
    return "hiking"


def _ridb_state(raw: dict) -> str | None:
    return first_defined(raw.get("FacilityStateCode"), raw.get("RecAreaStateCode"), raw.get("state"), raw.get("State"))


def _nps_state(raw: dict) -> str | None:
    states = first_defined(raw.get("states"), raw.get("stateCode"), raw.get("State"))
    if isinstance(states, str) and states:
        return states.split(",")[0].strip()
    addresses = raw.get("addresses")
    if isinstance(addresses, list):
        for address in addresses:
            state = address.get("stateCode") if isinstance(address, dict) else None
            if state:
                return state
    return None


def format_location(raw: dict) -> str:
    direct = first_defined(raw.get("location"), raw.get("Location"))
    if direct:
        return direct

    city = first_defined(raw.get("city"), raw.get("City"), raw.get("FacilityCity"))
    state = first_defined(raw.get("state"), raw.get("State"), raw.get("FacilityStateCode"), raw.get("RecAreaStateCode"))

    if not city and isinstance(raw.get("addresses"), list):
        for address in raw["addresses"]:
            if not isinstance(address, dict):
                continue
            city = first_defined(address.get("city"), city)
            state = first_defined(address.get("stateCode"), state)
            if city or state:
                break

    if city and state:
        return f"{city}, {state}"
    return city or state or "Unknown location"


def pick_images(raw: dict, category: str) -> list[str]:
    images = raw.get("images")
    if isinstance(images, list):
        urls = [item.get("url") if isinstance(item, dict) else item for item in images]
        urls = [url for url in urls if url]
        if len(urls) >= 3:
            return urls

    media = raw.get("MEDIA")
    if isinstance(media, list) and len(media) >= 3:
        urls = [item.get("URL") or item.get("url") for item in media if isinstance(item, dict)]
        urls = [url for url in urls if url]
        if len(urls) >= 3:
            return urls[:3]

    return FALLBACK_PALETTES.get(category, FALLBACK_PALETTES["hiking"])


def parse_float(value: Any) -> float | None:
    try:
        if value in (None, ""):
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def parse_nps_lat_long(value: Any) -> tuple[float | None, float | None]:
    if not isinstance(value, str):
        return None, None
    lat_match = re.search(r"lat\s*:\s*(-?\d+(?:\.\d+)?)", value, re.IGNORECASE)
    lon_match = re.search(r"(?:long|lng)\s*:\s*(-?\d+(?:\.\d+)?)", value, re.IGNORECASE)
    latitude = parse_float(lat_match.group(1)) if lat_match else None
    longitude = parse_float(lon_match.group(1)) if lon_match else None
    return latitude, longitude


def _condition(condition_score: float) -> tuple[str, str]:
    if condition_score > 0.85:
        return "Perfect right now", "perfect"
    if condition_score > 0.7:
        return "Great this week", "great"
    return "Check conditions", "check"


def _base_experience(raw: dict, *, title: str, state: str | None, source: str, source_id: str) -> dict:
    category = infer_category(raw)
    condition_score = raw.get("conditionScore") or raw.get("condition_score") or 0
    condition, condition_type = _condition(float(condition_score))
    location = format_location(raw)
    description = (
        first_defined(raw.get("description"), raw.get("Description"), raw.get("FacilityDescription"), raw.get("RecAreaDescription"))
        or DEFAULT_DESCRIPTION
    )
    hook = first_defined(raw.get("hook"), raw.get("shortDescription"), raw.get("Snippet"), raw.get("FacilityDescription"))
    if not hook:
        hook = description[:110]

    return {
        "id": first_defined(raw.get("id"), raw.get("legacyId"), raw.get("FacilityID"), raw.get("RecAreaID"), slugify(title)),
        "title": title,
        "hook": hook,
        "location": location,
        "state": state,
        "distance": first_defined(raw.get("distance"), raw.get("driveTime"), raw.get("DistanceLabel"), "1 hr"),
        "difficulty": first_defined(raw.get("difficulty"), raw.get("difficultyLabel"), raw.get("Difficulty"))
        or derive_difficulty(raw, _activity_names(raw)),
        "cost": first_defined(raw.get("cost"), raw.get("priceLabel")) or derive_cost(raw),
        "time": first_defined(raw.get("time"), raw.get("duration"), raw.get("DurationLabel"), "2-3 hrs"),
        "season": first_defined(raw.get("season"), raw.get("bestSeason"), raw.get("SeasonLabel"), "Year-round"),
        "category": category,
        "category_label": first_defined(raw.get("categoryLabel"), label_for_category(category)),
        "description": description,
        "description2": first_defined(raw.get("description2"), raw.get("secondaryDescription"), raw.get("Notes")) or DEFAULT_DESCRIPTION2,
        "condition": raw.get("condition") or condition,
        "condition_type": raw.get("conditionType") or condition_type,
        "kid_friendly": bool(first_defined(raw.get("kidFriendly"), raw.get("familyFriendly"), raw.get("FamilyFriendly"), False)),
        "min_age": first_defined(raw.get("minAge"), raw.get("MinAge"), 0),
        "condition_score": condition_score,
        "what_to_bring": raw.get("whatToBring") if isinstance(raw.get("whatToBring"), list) and raw.get("whatToBring") else DEFAULT_BRING_LIST,
        "images": pick_images(raw, category),
        "source": source,
        "source_id": source_id,
    }


def ridb_to_experience(raw: dict) -> dict:
    title = first_defined(raw.get("title"), raw.get("name"), raw.get("FacilityName"), raw.get("RecAreaName"), "Untitled experience")
    state = _ridb_state(raw)
    source_id = str(first_defined(raw.get("FacilityID"), raw.get("RecAreaID"), slugify(title)))
    experience = _base_experience(raw, title=title, state=state, source="ridb", source_id=source_id)
    experience["latitude"] = parse_float(raw.get("FacilityLatitude"))
    experience["longitude"] = parse_float(raw.get("FacilityLongitude"))
    return experience


def nps_to_experience(raw: dict) -> dict:
    title = first_defined(raw.get("title"), raw.get("name"), raw.get("fullName"), raw.get("FacilityName"), "Untitled experience")
    state = _nps_state(raw)
    source_id = str(first_defined(raw.get("parkCode"), slugify(title)))
    latitude, longitude = parse_nps_lat_long(raw.get("latLong"))
    raw_for_base = {
        **raw,
        "category": _first_activity_name(raw),
        "state": state,
    }
    experience = _base_experience(raw_for_base, title=title, state=state, source="nps", source_id=source_id)
    experience["id"] = slugify(source_id)
    experience["latitude"] = latitude
    experience["longitude"] = longitude
    return experience


def _first_activity_name(raw: dict) -> str | None:
    activities = raw.get("activities")
    if not isinstance(activities, list):
        return None
    for activity in activities:
        if isinstance(activity, dict) and activity.get("name"):
            return activity["name"]
    return None


def dedupe_key(experience: dict) -> str:
    state = experience.get("state")
    if not state:
        location = experience.get("location") or ""
        state = location.rsplit(",", 1)[-1].strip() if "," in location else location
    return f"{experience['title'].lower()}|{state}"


def merge_prefer_nps(current: dict, incoming: dict) -> dict:
    if current["source"] == "nps" and incoming["source"] != "nps":
        return current
    if incoming["source"] != "nps":
        return current

    merged = {**current, **incoming}
    if current["source"] == "ridb":
        merged["source"] = "nps"
        merged["source_id"] = f"nps:{incoming['source_id']}|ridb:{current['source_id']}"
    return merged


def _upsert_experiences(session: Session, rows: list[dict]) -> None:
    if not rows:
        return

    table = Experience.__table__
    for start in range(0, len(rows), UPSERT_BATCH_SIZE):
        insert_stmt = insert(table).values(rows[start : start + UPSERT_BATCH_SIZE])
        update_columns = {
            column.name: getattr(insert_stmt.excluded, column.name)
            for column in table.columns
            if column.name not in {"id", "created_at"}
        }
        update_columns["updated_at"] = func.now()
        statement = insert_stmt.on_conflict_do_update(
            index_elements=["source", "source_id"],
            index_where=table.c.source.is_not(None) & table.c.source_id.is_not(None),
            set_=update_columns,
        )
        session.execute(statement)
        session.commit()


async def _fetch_state(state: str) -> tuple[list[dict], list[dict], list[str]]:
    """Fetch both sources for one state, returning the records plus one message per failure."""
    errors: list[str] = []

    try:
        ridb_records = await fetch_facilities(state)
    except Exception as exc:
        ridb_records = []
        errors.append(f"{state} ridb: {exc!r}")
        logger.warning("RIDB fetch failed for %s: %r", state, exc)

    try:
        nps_records = await fetch_parks(state)
    except Exception as exc:
        nps_records = []
        errors.append(f"{state} nps: {exc!r}")
        logger.warning("NPS fetch failed for %s: %r", state, exc)

    return ridb_records, nps_records, errors


async def run_sync(session: Session) -> dict:
    deduped: dict[str, dict] = {}
    failed_states: list[str] = []
    errors: list[str] = []

    for state in STATE_CODES:
        ridb_records, nps_records, state_errors = await _fetch_state(state)
        if state_errors:
            failed_states.append(state)
            errors.extend(state_errors)

        for raw in ridb_records:
            experience = ridb_to_experience(raw)
            key = dedupe_key(experience)
            deduped[key] = experience

        for raw in nps_records:
            experience = nps_to_experience(raw)
            key = dedupe_key(experience)
            if key in deduped:
                deduped[key] = merge_prefer_nps(deduped[key], experience)
            else:
                deduped[key] = experience

    # Every state failing means the run fetched nothing at all - bad keys, no network, an
    # upstream contract change. Returning rows=0 as a success hides that, and would let a
    # "fast" run that fetched nothing look like a throughput win.
    if len(failed_states) == len(STATE_CODES):
        raise RuntimeError(
            f"sync failed for all {len(STATE_CODES)} states; first errors: {errors[:3]}"
        )

    rows = list(deduped.values())
    _upsert_experiences(session, rows)

    return {
        "rows": len(rows),
        "states": len(STATE_CODES),
        "failed_states": failed_states,
        "errors": errors,
    }
