from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_async_session
from app.models.swipe import Swipe
from app.models.user import User

router = APIRouter(prefix="/api/swipes", tags=["swipes"])

VALID_ACTIONS = {"save", "skip"}


class SwipePayload(BaseModel):
    experience_id: str
    action: str


@router.post("")
async def record_swipe(
    payload: SwipePayload,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
) -> dict[str, str]:
    if payload.action not in VALID_ACTIONS:
        raise HTTPException(status_code=422, detail="action must be 'save' or 'skip'")

    swipe = Swipe(
        user_id=user.id,
        experience_id=payload.experience_id,
        action=payload.action,
    )
    session.add(swipe)
    await session.commit()
    return {"status": "ok"}


@router.get("")
async def list_swipes(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session),
) -> dict[str, list[str]]:
    """Return the experience ids the user has skipped, for hiding them in the deck."""
    statement = select(Swipe.experience_id).where(
        Swipe.user_id == user.id, Swipe.action == "skip"
    )
    skipped = (await session.exec(statement)).all()
    return {"skippedIds": list(dict.fromkeys(skipped))}
