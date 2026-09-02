"""Diagnostic: how long does each state's crawl take on its own?

If the slowest single state is close to the whole run's wall clock, the bound has stopped
being the constraint and the critical path is that one state's sequential pagination.
"""

import asyncio
import time

import httpx

from app.services.nps_client import fetch_parks
from app.services.ridb_client import fetch_facilities
from app.services.sync import STATE_CODES, REQUEST_TIMEOUT_SECONDS


async def time_state(client, state):
    start = time.monotonic()
    facilities = await fetch_facilities(client, state)
    mid = time.monotonic()
    parks = await fetch_parks(client, state)
    end = time.monotonic()
    return state, end - start, mid - start, len(facilities), len(parks)


async def main():
    limits = httpx.Limits(max_connections=32, max_keepalive_connections=32)
    semaphore = asyncio.Semaphore(16)

    async def bounded(client, state):
        async with semaphore:
            return await time_state(client, state)

    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS, limits=limits) as client:
        started = time.monotonic()
        rows = await asyncio.gather(*(bounded(client, s) for s in STATE_CODES))
        total = time.monotonic() - started

    rows.sort(key=lambda r: r[1], reverse=True)
    print(f"total wall clock: {total:.1f}s   (bound 16)\n")
    print(f"{'state':6} {'total':>7} {'ridb':>7} {'pages~':>7} {'ridb n':>7} {'nps n':>6}")
    for state, dur, ridb_dur, n_fac, n_parks in rows[:12]:
        print(f"{state:6} {dur:6.1f}s {ridb_dur:6.1f}s {n_fac / 50:7.0f} {n_fac:7d} {n_parks:6d}")

    slowest = rows[0]
    print(f"\nslowest state {slowest[0]} takes {slowest[1]:.1f}s of a {total:.1f}s run "
          f"({100 * slowest[1] / total:.0f}% of the critical path)")


asyncio.run(main())
