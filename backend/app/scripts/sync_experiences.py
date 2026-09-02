import asyncio

from sqlmodel import Session

from app.core.database import engine
from app.services.sync import run_sync


async def main() -> None:
    with Session(engine) as session:
        result = await run_sync(session)
    print(
        "Synced {rows} experiences from {states} states. Failed states: {failed}".format(
            rows=result["rows"],
            states=result["states"],
            failed=", ".join(result["failed_states"]) or "none",
        )
    )
    for error in result["errors"]:
        print(f"  {error}")


if __name__ == "__main__":
    asyncio.run(main())
