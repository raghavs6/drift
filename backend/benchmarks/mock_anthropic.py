"""A stand-in for the Anthropic Messages API, for benchmark runs only.

`POST /api/plan-trip` calls the paid API. Load-testing it for real would cost money
and would fold Anthropic's own latency variance into a measurement that is supposed
to be about *our* backend, so this serves a canned response after a fixed sleep.

Point the app at it with no code change — the anthropic SDK reads ANTHROPIC_BASE_URL
from the environment:

    ANTHROPIC_BASE_URL=http://127.0.0.1:8787 uvicorn app.main:app

The defect under test survives the substitution. `app/main.py` calls the *synchronous*
Anthropic client from inside an `async def` handler, so the event loop is blocked for
the full sleep whether the far end is Anthropic or localhost. That block is precisely
what Phase 2 step 11 removes, and a fixed sleep makes the before/after readable
instead of noisy.

Usage:
    python benchmarks/mock_anthropic.py --port 8787 --delay 2.0
"""
import argparse
import json
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DELAY_SECONDS = 2.0

PLAN_TEXT = (
    "**Best time to go** — Early morning, late spring.\n"
    "**What to bring** — Water, snacks, layers, map, sunscreen.\n"
    "**Getting there** — Park in the north lot; it fills by 9am.\n"
    "**Itinerary** — Trailhead at 7, overlook by 9, back by noon.\n"
    "**Pro tips** — Go midweek. The east loop is quieter."
)


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def do_POST(self) -> None:
        # Drain the request body; leaving it unread wedges keep-alive connections.
        length = int(self.headers.get("Content-Length", 0))
        self.rfile.read(length)

        if not self.path.endswith("/v1/messages"):
            self.send_error(404, "only /v1/messages is mocked")
            return

        time.sleep(DELAY_SECONDS)

        body = json.dumps(
            {
                "id": "msg_bench",
                "type": "message",
                "role": "assistant",
                "model": "claude-sonnet-4-20250514",
                "content": [{"type": "text", "text": PLAN_TEXT}],
                "stop_reason": "end_turn",
                "stop_sequence": None,
                "usage": {"input_tokens": 180, "output_tokens": 120},
            }
        ).encode()

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args) -> None:
        """Silence per-request logging — it would compete with the app for stderr."""


def main() -> None:
    global DELAY_SECONDS

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8787)
    parser.add_argument("--delay", type=float, default=DELAY_SECONDS, help="seconds per call")
    args = parser.parse_args()

    DELAY_SECONDS = args.delay

    # Threading matters: a single-threaded server would serialise the sleeps and
    # become the bottleneck we are trying to attribute to the app.
    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print(f"mock anthropic on http://127.0.0.1:{args.port} (delay {args.delay}s)", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
