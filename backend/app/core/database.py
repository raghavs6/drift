from collections.abc import AsyncIterator, Iterator

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlmodel import Session, create_engine
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings

# Pool sized against the two ceilings that actually bind:
#
#   1. FastAPI runs `def` (non-async) routes in AnyIO's thread pool, which holds
#      40 tokens. More than 40 requests can never be executing a query at once,
#      so a pool larger than 40 buys nothing.
#   2. Postgres `max_connections` is 100 (postgres:16 default).
#
# 20 + 20 = 40 matches the thread ceiling exactly, and with the single uvicorn
# worker the benchmarks pin, that is 40 of the 100 connections — leaving room for
# alembic, psql and the sync scripts. If worker count is ever raised, the product
# (pool_size + max_overflow) * workers is what must stay under 100.
#
# Left at SQLAlchemy's defaults this was pool_size=5, max_overflow=10: a hard
# ceiling of 15 connections for 40 threads, so requests queued for a connection
# before they could run a query at all.
engine = create_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=20,
    # Explicitly the SQLAlchemy default, not a tuning choice: the baseline ran at
    # 30s, so holding it fixed keeps pool *size* the only changed variable.
    pool_timeout=30,
    # Recycle before Postgres or anything in front of it drops a long-idle
    # connection, so pre-ping rarely has to discard one mid-request.
    pool_recycle=1800,
)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session


# The request path runs on this one. Same pool arithmetic as above, but the
# ceiling means something different: async routes are not capped by the 40-token
# thread pool, so concurrency is bounded by the pool alone rather than by both.
async_engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=20,
    pool_timeout=30,
    pool_recycle=1800,
)

# expire_on_commit=False: an expired attribute reloads itself on next access,
# which is IO. Under asyncio that raises MissingGreenlet instead of quietly
# issuing a second query, so anything read after commit() must stay loaded.
_async_session_factory = async_sessionmaker(
    async_engine, class_=AsyncSession, expire_on_commit=False
)


async def get_async_session() -> AsyncIterator[AsyncSession]:
    async with _async_session_factory() as session:
        yield session
