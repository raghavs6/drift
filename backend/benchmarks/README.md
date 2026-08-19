# Drift latency benchmarks

Phase 2, step 10 of the performance work: a repeatable load test and a committed
baseline, recorded **before** any tuning.

The point is not the absolute numbers. It is that steps 11-14 (async Anthropic client,
connection-pool sizing, async-vs-threadpool, catalog caching) each get re-measured with
*the same command against the same data*, so the improvement is a measurement rather
than an assertion.

## Prerequisites

```bash
brew install k6
cd backend
docker compose up -d          # Postgres
.venv/bin/alembic upgrade head
```

`SUPABASE_JWT_SECRET` must be set in `backend/.env`. Without it every authenticated
route returns 500 (`app/core/auth.py`) and the run would be timing error paths — the
runner's preflight fails loudly rather than let that happen.

## Running

```bash
cd backend
./benchmarks/run.sh baseline      # writes benchmarks/results/baseline/
```

Takes about eight minutes. Everything that could drift between runs — worker count,
rate limit, catalog size, request timeout, plan-trip cadence, mock LLM delay — is
pinned at the top of `run.sh`. Change one and previous results stop being comparable.

Output lands in `benchmarks/results/<label>/`:

| File | What it is |
|---|---|
| `RESULTS.md` | percentile tables plus the exact conditions the run happened under |
| `summary.txt` | raw k6 console output |
| `summary.json` | machine-readable k6 export |
| `server.log`, `mock.log` | gitignored; for debugging a failed run |

## What it measures

| Scenario | Traffic | The bottleneck it targets |
|---|---|---|
| `catalog` | `GET /api/experiences?limit=500` | unauthenticated hot read path — step 14's cache |
| `prefs` / `swipes` / `collections` | the three authed reads | shared connection pool — step 12's sizing |
| `plantrip` | `POST /api/plan-trip`, one per 5s | event-loop blocking — step 11's async client |

Three concurrency levels — 10, 50, 200 virtual users — each its own fixed-VU block at a
scheduled start time. Deliberately **not** a ramp: a ramp smears each percentile across
every concurrency it passes through, which makes "p95 at 200 VUs" unanswerable.

## Design decisions worth knowing

**The load generator shares this machine with the server.** That is the harness's main
limitation, and it is why k6 (Go) was chosen over Locust (Python) — at 200 VUs a Python
client would compete with the server for CPU and inflate the very number being recorded.
Absolute values are still machine-specific; only the delta between two runs recorded
under the same conditions is claimable.

**Anthropic is mocked.** `mock_anthropic.py` answers `/v1/messages` after a fixed 2s
sleep. `run.sh` points the app at it with `ANTHROPIC_BASE_URL`, which the SDK reads from
the environment — **no application code changes for benchmarking**. This keeps the run
free and, more importantly, deterministic: real API latency would inject variance into a
measurement that is supposed to be about this backend. The defect under test survives
the substitution untouched, because `app/main.py` calls the *synchronous* client from an
`async def` handler and the event loop blocks either way.

**The rate limiter has to be raised.** `app/main.py` allows 5 requests per 60s keyed by
client IP. A localhost load test is a single IP, so every virtual user shares one bucket
and plan-trip would 429 within seconds. `run.sh` overrides it by environment variable —
again, no code change.

**Requests slower than 60s count as failures, not latencies.** Letting a timeout land in
the percentile buckets would report the timeout value as though it were a measured
response time. At 200 VUs the baseline hits this constantly, which is itself the result.

**Tokens are minted locally, one per virtual user.** Sharing a single `sub` across 200
VUs would serialise them on one `users` row and measure lock contention instead of
latency. `mint_token.py` also pre-creates the user rows, because `get_current_user`
INSERTs on first sight and otherwise the opening percentiles would measure one-time
writes. `benchmarks/tokens.json` is gitignored — they are signed credentials.

**The catalog is seeded, not synced.** `seed.py` generates rows from a frozen RNG seed so
the data is identical on every machine and every re-run. A real sync returns a different
row count each time, which would make two runs incomparable. Note that a real sync has
already been run against this database, so the table holds those rows *plus* the seeded
ones — `RESULTS.md` records the exact composition per run.
