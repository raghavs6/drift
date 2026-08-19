"""Seed the experiences table with a deterministic synthetic catalog.

The benchmark measures how `/api/experiences` behaves under load, so it needs a
catalog that is identical on every machine and every re-run. A real sync produces
a different row count each time (upstream APIs change), which would make the
baseline and the post-tuning run incomparable — the whole point of Phase 2 is that
the only thing differing between those two runs is our code.

Usage:
    python benchmarks/seed.py --rows 2000
    python benchmarks/seed.py --clear
"""
import argparse
import random
import sys
from pathlib import Path

# Lets the script run as `python benchmarks/seed.py` from the backend directory,
# the same way pytest.ini's `pythonpath = .` does it for the test suite.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlmodel import Session, delete, select, func

from app.core.database import engine
from app.models.experience import Experience
from app.services.sync import STATE_CODES, _upsert_experiences

# Bumping this changes every generated row, which invalidates comparability with
# any baseline already recorded. Treat it as frozen.
RANDOM_SEED = 1337

SOURCE = "bench"

CATEGORIES = [
    ("hiking", "Hiking"),
    ("biking", "Biking"),
    ("water", "On the Water"),
    ("camping", "Camping"),
    ("scenic", "Scenic Drives"),
    ("climbing", "Climbing"),
]
DIFFICULTIES = ["Easy", "Moderate", "Hard"]
COSTS = ["Free", "$", "$$", "$$$"]
TIMES = ["1-2 hrs", "2-3 hrs", "half day", "full day"]
SEASONS = ["Year-round", "Spring-Fall", "Summer", "Winter"]
DISTANCES = ["20 min", "45 min", "1 hr", "1.5 hrs", "2 hrs", "3 hrs"]
GEAR = ["Water", "Snacks", "Sunscreen", "Layers", "Map", "Headlamp", "Bug spray"]
PALETTES = [
    ["#5A8F6E", "#3D6B4E", "#8BB89A"],
    ["#4A6FA5", "#2E4A73", "#7FA3CC"],
    ["#A5744A", "#73512E", "#CCA37F"],
]
FEATURES = ["Ridge", "Falls", "Hollow", "Bluff", "Basin", "Point", "Glen", "Pass"]
PLACES = ["Cedar", "Granite", "Willow", "Eagle", "Sunset", "Copper", "Birch", "Otter"]


def _condition(score: float) -> tuple[str, str]:
    """Mirror the badge thresholds the frontend renders against."""
    if score >= 70:
        return "Great conditions", "good"
    if score >= 40:
        return "Fair conditions", "fair"
    return "Check conditions", "check"


def build_rows(count: int) -> list[dict]:
    rng = random.Random(RANDOM_SEED)
    rows = []
    for i in range(count):
        category, category_label = rng.choice(CATEGORIES)
        state = rng.choice(STATE_CODES)
        title = f"{rng.choice(PLACES)} {rng.choice(FEATURES)} {i}"
        score = rng.randint(0, 100)
        condition, condition_type = _condition(score)
        kid_friendly = rng.random() < 0.4

        rows.append(
            {
                "id": f"{SOURCE}:{i}",
                "title": title,
                "hook": f"A {rng.choice(['quiet', 'popular', 'rugged', 'easygoing'])} {category} spot in {state}.",
                "location": f"{rng.choice(PLACES)}ville, {state}",
                "state": state,
                "distance": rng.choice(DISTANCES),
                "difficulty": rng.choice(DIFFICULTIES),
                "cost": rng.choice(COSTS),
                "time": rng.choice(TIMES),
                "season": rng.choice(SEASONS),
                "category": category,
                "category_label": category_label,
                # Length matters: response payload size is part of what we measure.
                "description": (
                    f"{title} sits about {rng.choice(DISTANCES)} out of town and rewards the drive. "
                    f"The route is {rng.choice(DIFFICULTIES).lower()} and stays interesting the whole way, "
                    f"with enough shade to make a warm afternoon comfortable."
                ),
                "description2": (
                    "Check current conditions, hours, and access details before you head out. "
                    "Parking fills up on weekends, so an early start is worth it."
                ),
                "condition": condition,
                "condition_type": condition_type,
                "kid_friendly": kid_friendly,
                "min_age": 0 if kid_friendly else rng.choice([8, 12, 16]),
                "condition_score": score,
                "what_to_bring": rng.sample(GEAR, k=rng.randint(3, 5)),
                "images": rng.choice(PALETTES),
                "source": SOURCE,
                "source_id": str(i),
                "latitude": round(rng.uniform(25.0, 49.0), 5),
                "longitude": round(rng.uniform(-124.0, -67.0), 5),
            }
        )
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rows", type=int, default=2000, help="rows to seed (default 2000)")
    parser.add_argument("--clear", action="store_true", help="delete seeded rows and exit")
    args = parser.parse_args()

    with Session(engine) as session:
        if args.clear:
            session.execute(delete(Experience).where(Experience.source == SOURCE))
            session.commit()
            print(f"Cleared all source={SOURCE!r} rows.")
            return

        # Reuses the sync path's batched ON CONFLICT upsert, so re-running is
        # idempotent rather than a duplicate-key crash.
        _upsert_experiences(session, build_rows(args.rows))
        total = session.exec(select(func.count()).select_from(Experience)).one()
        seeded = session.exec(
            select(func.count()).select_from(Experience).where(Experience.source == SOURCE)
        ).one()

    print(f"Seeded {seeded} benchmark rows ({total} rows in experiences total).")


if __name__ == "__main__":
    main()
