// Drift latency benchmark — Phase 2, step 10.
//
// Records p50/p95/p99 per endpoint at 10, 50, and 200 virtual users. Steps 11-14
// re-run this unchanged; the delta against the committed baseline is the number
// behind the "reduced query latency" claim, so nothing here may change between runs.
//
// Design notes that affect the numbers:
//
//  * Each VU level is its own `constant-vus` scenario at a fixed start time, not a
//    ramp. A ramp smears the percentiles across every concurrency it passes through,
//    which makes "p95 at 200 VUs" unanswerable.
//  * A warmup block runs first so connection-pool fill and first-query planning land
//    outside the measured windows.
//  * Response bodies are discarded. k6 still times the full transfer; skipping the
//    parse keeps the load generator cheap, which matters because it shares this
//    machine with the server under test.
//  * plan-trip runs at a deliberately low arrival rate. The story is that a handful
//    of slow blocking calls wreck latency for everyone else — turn it up and the
//    event loop simply never runs, which is true but tells you nothing.

import http from "k6/http";
import { check } from "k6";

const BASE = __ENV.BASE_URL || "http://127.0.0.1:8000";
const TOKENS = JSON.parse(open(__ENV.TOKENS_FILE || "./tokens.json"));
const CATALOG_LIMIT = __ENV.CATALOG_LIMIT || "500";
// k6 requires an integer arrival rate, so a sub-1/s cadence is expressed as
// "one request per PLANTRIP_PERIOD seconds".
const PLANTRIP_PERIOD = __ENV.PLANTRIP_PERIOD || "5";

// Each level gets a block long enough for requests to actually complete at that
// concurrency, plus a graceful window so in-flight iterations are recorded instead
// of interrupted. Sized from a first run: at 200 VUs a request can take ~30s, so a
// short block would report the block length as the latency rather than the latency.
const LEVELS = [
  { vus: 10, duration: 40, graceful: 20 },
  { vus: 50, duration: 60, graceful: 40 },
  { vus: 200, duration: 150, graceful: 120 },
];
const WARMUP_SEC = 20;
const GAP_SEC = 5;

const ENDPOINTS = ["catalog", "prefs", "swipes", "collections"];

// A request slower than this is recorded as a failure, not as a very large latency.
// Nobody waits a minute for a page, and letting timeouts land in the percentile
// buckets would report the timeout value as if it were a measured response time.
const REQUEST_TIMEOUT = __ENV.REQUEST_TIMEOUT || "60s";

// Blocks must not overlap: a level still draining its graceful window while the next
// one ramps would attribute one level's load to the other.
const SCHEDULE = [];
let cursor = WARMUP_SEC + GAP_SEC;
for (const level of LEVELS) {
  SCHEDULE.push({ ...level, startTime: cursor });
  cursor += level.duration + level.graceful + GAP_SEC;
}
const TOTAL_SEC = cursor;

function scenarios() {
  const out = {
    warmup: {
      executor: "constant-vus",
      vus: 5,
      duration: `${WARMUP_SEC}s`,
      startTime: "0s",
      exec: "mixedTraffic",
      gracefulStop: "0s",
      tags: { level: "warmup" },
    },
  };

  for (const level of SCHEDULE) {
    out[`level_${level.vus}`] = {
      executor: "constant-vus",
      vus: level.vus,
      duration: `${level.duration}s`,
      startTime: `${level.startTime}s`,
      exec: "mixedTraffic",
      gracefulStop: `${level.graceful}s`,
      tags: { level: String(level.vus) },
    };
  }

  // Spans every measured block so each level sees the same event-loop pressure.
  out.plantrip = {
    executor: "constant-arrival-rate",
    rate: 1,
    timeUnit: `${PLANTRIP_PERIOD}s`,
    duration: `${TOTAL_SEC - WARMUP_SEC}s`,
    startTime: `${WARMUP_SEC}s`,
    preAllocatedVUs: 20,
    maxVUs: 60,
    exec: "planTrip",
    gracefulStop: "30s",
    tags: { level: "mixed" },
  };

  return out;
}

// Thresholds are what make k6 print a per-tag percentile breakdown in the summary.
// The limits are deliberately loose — a slow baseline is the point of a baseline, so
// the run must not fail for being slow. Only correctness (non-2xx) fails it.
function thresholds() {
  // Failures are only a harness error at the levels the server can actually serve.
  // At the top level the baseline is expected to saturate, and the timeout rate there
  // is a result worth recording rather than a pass/fail gate.
  const t = {
    "http_req_failed{level:10}": [{ threshold: "rate<0.01", abortOnFail: false }],
    "http_req_failed{level:50}": [{ threshold: "rate<0.01", abortOnFail: false }],
    "http_req_failed{level:200}": [{ threshold: "rate<1.01", abortOnFail: false }],
  };
  for (const { vus } of LEVELS) {
    for (const endpoint of ENDPOINTS) {
      t[`http_req_duration{endpoint:${endpoint},level:${vus}}`] = [
        "p(50)<60000",
        "p(95)<60000",
        "p(99)<60000",
      ];
    }
  }
  t["http_req_duration{endpoint:plantrip}"] = ["p(95)<60000"];
  return t;
}

export const options = {
  discardResponseBodies: true,
  scenarios: scenarios(),
  thresholds: thresholds(),
  summaryTrendStats: ["avg", "min", "med", "p(50)", "p(95)", "p(99)", "max"],
};

function authHeaders() {
  // One token per VU: sharing a `sub` would serialise VUs on a single users row and
  // we would be measuring lock contention instead of latency.
  const token = TOKENS[(__VU - 1) % TOKENS.length];
  return { headers: { Authorization: `Bearer ${token}` } };
}

export function mixedTraffic() {
  // Half the traffic is the unauthenticated catalog read (the hot path step 14
  // caches); the rest spreads over the three authed reads that share the pool.
  const roll = Math.random();

  if (roll < 0.5) {
    const res = http.get(`${BASE}/api/experiences?limit=${CATALOG_LIMIT}`, {
      tags: { endpoint: "catalog" },
      timeout: REQUEST_TIMEOUT,
    });
    check(res, { "catalog 200": (r) => r.status === 200 });
  } else if (roll < 0.7) {
    const res = http.get(`${BASE}/api/preferences`, {
      ...authHeaders(),
      tags: { endpoint: "prefs" },
      timeout: REQUEST_TIMEOUT,
    });
    check(res, { "prefs 200": (r) => r.status === 200 });
  } else if (roll < 0.85) {
    const res = http.get(`${BASE}/api/swipes`, {
      ...authHeaders(),
      tags: { endpoint: "swipes" },
      timeout: REQUEST_TIMEOUT,
    });
    check(res, { "swipes 200": (r) => r.status === 200 });
  } else {
    const res = http.get(`${BASE}/api/collections`, {
      ...authHeaders(),
      tags: { endpoint: "collections" },
      timeout: REQUEST_TIMEOUT,
    });
    check(res, { "collections 200": (r) => r.status === 200 });
  }
}

export function planTrip() {
  const res = http.post(
    `${BASE}/api/plan-trip`,
    JSON.stringify({
      title: "Cedar Ridge sunset hike",
      category: "hiking",
      location: "Madison, WI",
      difficulty: "Moderate",
    }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { endpoint: "plantrip" },
      timeout: "120s",
    }
  );
  check(res, { "plantrip 200": (r) => r.status === 200 });
}
