"""Turn a k6 summary export into a readable per-endpoint, per-level table.

The raw k6 output is exhaustive but hard to diff by eye, and the whole value of the
baseline is being able to put it next to a later run and see what moved.

Usage:
    python benchmarks/summarize.py results/baseline/summary.json
"""
import argparse
import json
import re

LEVELS = ["10", "50", "200"]
ENDPOINTS = ["catalog", "prefs", "swipes", "collections"]
KEY = re.compile(r"^http_req_duration\{endpoint:(?P<endpoint>[^,]+),level:(?P<level>[^}]+)\}$")


def fmt(ms: float) -> str:
    if ms is None:
        return "—"
    return f"{ms/1000:.2f} s" if ms >= 1000 else f"{ms:.0f} ms"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("summary", help="path to a k6 --summary-export JSON file")
    args = parser.parse_args()

    metrics = json.load(open(args.summary))["metrics"]

    durations: dict[tuple[str, str], dict] = {}
    for key, value in metrics.items():
        match = KEY.match(key)
        if match:
            durations[(match["endpoint"], match["level"])] = value

    failed = {
        level: metrics.get(f"http_req_failed{{level:{level}}}", {}).get("value")
        for level in LEVELS
    }

    lines = ["## Latency by endpoint and concurrency", ""]
    for level in LEVELS:
        rate = failed.get(level)
        note = ""
        if rate is not None and rate > 0.01:
            note = f"  ·  **{rate*100:.1f}% of requests failed or timed out**"
        lines += [
            f"### {level} virtual users{note}",
            "",
            "| Endpoint | p50 | p95 | p99 | max |",
            "|---|---|---|---|---|",
        ]
        for endpoint in ENDPOINTS:
            d = durations.get((endpoint, level))
            if not d:
                lines.append(f"| `{endpoint}` | — | — | — | — |")
                continue
            lines.append(
                f"| `{endpoint}` | {fmt(d.get('p(50)'))} | {fmt(d.get('p(95)'))} "
                f"| {fmt(d.get('p(99)'))} | {fmt(d.get('max'))} |"
            )
        lines.append("")

    plantrip = metrics.get("http_req_duration{endpoint:plantrip}")
    if plantrip:
        lines += [
            "### plan-trip (constant low rate across every level)",
            "",
            "| p50 | p95 | p99 | max |",
            "|---|---|---|---|",
            f"| {fmt(plantrip.get('p(50)'))} | {fmt(plantrip.get('p(95)'))} "
            f"| {fmt(plantrip.get('p(99)'))} | {fmt(plantrip.get('max'))} |",
            "",
        ]

    print("\n".join(lines))


if __name__ == "__main__":
    main()
