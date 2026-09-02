import asyncio
from datetime import datetime, timedelta, timezone
from email.utils import format_datetime

import httpx
import pytest

from app.services import http_retry
from app.services.http_retry import (
    MAX_RETRIES,
    backoff_seconds,
    get_with_retry,
    parse_retry_after,
)


def test_retry_after_accepts_a_delay_in_seconds():
    assert parse_retry_after("120") == 120.0


def test_retry_after_accepts_an_http_date():
    when = datetime.now(timezone.utc) + timedelta(seconds=30)

    seconds = parse_retry_after(format_datetime(when, usegmt=True))

    assert seconds is not None
    assert 25 <= seconds <= 35


def test_retry_after_in_the_past_is_clamped_to_zero():
    when = datetime.now(timezone.utc) - timedelta(hours=1)

    assert parse_retry_after(format_datetime(when, usegmt=True)) == 0.0


@pytest.mark.parametrize("value", [None, "", "soon", "not-a-date"])
def test_retry_after_ignores_anything_unparseable(value):
    assert parse_retry_after(value) is None


def test_backoff_is_jittered_rather_than_a_fixed_interval():
    """The old backoff was 0.5 * (attempt + 1) for everyone. Concurrent workers that got
    429'd together then retried at the same instant and collided again."""
    delays = {backoff_seconds(2, None) for _ in range(50)}

    assert len(delays) > 1
    assert all(0 <= delay <= 2.0 for delay in delays)


def test_backoff_grows_with_the_attempt_number():
    early = max(backoff_seconds(0, None) for _ in range(200))
    late = max(backoff_seconds(3, None) for _ in range(200))

    assert late > early


def test_backoff_honours_retry_after_when_the_server_sends_one():
    delays = [backoff_seconds(0, 10.0) for _ in range(20)]

    # The server's value is respected, spread by up to a second so the resumption of many
    # workers is not itself synchronised.
    assert all(10.0 <= delay <= 11.0 for delay in delays)


def _client(handler):
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


def test_retries_a_429_and_returns_the_eventual_success(monkeypatch):
    monkeypatch.setattr(http_retry.asyncio, "sleep", _no_sleep)
    calls = []

    def handler(request):
        calls.append(request)
        if len(calls) < 3:
            return httpx.Response(429, headers={"Retry-After": "0"})
        return httpx.Response(200, json={"ok": True})

    async def run():
        async with _client(handler) as client:
            return await get_with_retry(client, "https://example.test/thing")

    response = asyncio.run(run())

    assert response.status_code == 200
    assert len(calls) == 3


def test_gives_up_after_max_retries_and_raises(monkeypatch):
    monkeypatch.setattr(http_retry.asyncio, "sleep", _no_sleep)
    calls = []

    def handler(request):
        calls.append(request)
        return httpx.Response(429)

    async def run():
        async with _client(handler) as client:
            return await get_with_retry(client, "https://example.test/thing")

    with pytest.raises(httpx.HTTPStatusError):
        asyncio.run(run())

    assert len(calls) == MAX_RETRIES


def test_a_non_429_error_is_raised_without_retrying(monkeypatch):
    monkeypatch.setattr(http_retry.asyncio, "sleep", _no_sleep)
    calls = []

    def handler(request):
        calls.append(request)
        return httpx.Response(401)

    async def run():
        async with _client(handler) as client:
            return await get_with_retry(client, "https://example.test/thing")

    with pytest.raises(httpx.HTTPStatusError):
        asyncio.run(run())

    assert len(calls) == 1


async def _no_sleep(seconds):
    """Keep the retry tests instant; the delay values are asserted directly above."""
    return None
