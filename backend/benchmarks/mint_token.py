"""Mint benchmark JWTs and pre-create their user rows.

Signs tokens with the same SUPABASE_JWT_SECRET the server verifies against, in the
claim shape `app/core/auth.py` expects — the same trick `tests/test_integration.py`
uses. No Supabase round-trip, no real user tokens in a load test.

Two details that keep the numbers honest:

* One token per virtual user. Sharing a single `sub` across 200 VUs would serialise
  them on one `users`/`user_preferences` row and we would be measuring row lock
  contention rather than request latency.
* The user rows are pre-created here. `get_current_user` INSERTs on first sight, so
  without this the first request from each VU is a write and the run's opening
  percentiles measure one-time setup.

Usage:
    python benchmarks/mint_token.py --count 200 --out benchmarks/tokens.json
"""
import argparse
import json
import sys
from pathlib import Path

# Lets the script run as `python benchmarks/mint_token.py` from the backend directory,
# the same way pytest.ini's `pythonpath = .` does it for the test suite.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from datetime import datetime, timedelta, timezone
from uuid import UUID, uuid5, NAMESPACE_URL

import jwt
from sqlmodel import Session

from app.core.config import settings
from app.core.database import engine
from app.models.user import User

# Derived from a fixed namespace so re-running reuses the same users instead of
# growing the table on every run.
def _user_id(index: int) -> UUID:
    return uuid5(NAMESPACE_URL, f"drift-benchmark-user-{index}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--count", type=int, default=200, help="tokens to mint (default 200)")
    parser.add_argument("--out", default="benchmarks/tokens.json", help="output JSON path")
    parser.add_argument("--hours", type=int, default=6, help="token lifetime (default 6h)")
    args = parser.parse_args()

    secret = settings.supabase_jwt_secret
    if not secret:
        raise SystemExit(
            "SUPABASE_JWT_SECRET is not set. The authed scenarios would measure 500s "
            "from app/core/auth.py, not latency. Set it in backend/.env and re-run."
        )

    expires = datetime.now(timezone.utc) + timedelta(hours=args.hours)
    tokens = []

    with Session(engine) as session:
        for i in range(args.count):
            user_id = _user_id(i)
            email = f"bench-{i}@example.invalid"
            if session.get(User, user_id) is None:
                session.add(User(id=user_id, email=email))
            tokens.append(
                jwt.encode(
                    {
                        "sub": str(user_id),
                        "email": email,
                        "aud": "authenticated",
                        "exp": expires,
                    },
                    secret,
                    algorithm="HS256",
                )
            )
        session.commit()

    with open(args.out, "w") as handle:
        json.dump(tokens, handle)

    print(f"Wrote {len(tokens)} tokens to {args.out} (valid until {expires:%Y-%m-%d %H:%M} UTC).")


if __name__ == "__main__":
    main()
