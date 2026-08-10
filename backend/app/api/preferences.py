from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session

from app.core.auth import get_current_user
from app.core.database import get_session
from app.models.preference import UserPreference
from app.models.user import User

router = APIRouter(prefix="/api/preferences", tags=["preferences"])


class PreferencesPayload(BaseModel):
    """Onboarding preferences, camelCase to match the frontend `prefs` shape."""

    location: str | None = None
    distance: str | None = None
    age: str | None = None
    comfort: str | None = None
    kidFriendly: bool = False
    childAge: int | None = None
    vibes: list[str] = []
    onboardingComplete: bool = False


def _to_payload(pref: UserPreference) -> PreferencesPayload:
    return PreferencesPayload(
        location=pref.location,
        distance=pref.distance,
        age=pref.age,
        comfort=pref.comfort,
        kidFriendly=pref.kid_friendly,
        childAge=pref.child_age,
        vibes=pref.vibes,
        onboardingComplete=pref.onboarding_complete,
    )


@router.get("")
def get_preferences(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> PreferencesPayload:
    pref = session.get(UserPreference, user.id)
    if pref is None:
        return PreferencesPayload()
    return _to_payload(pref)


@router.put("")
def put_preferences(
    payload: PreferencesPayload,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> PreferencesPayload:
    pref = session.get(UserPreference, user.id)
    if pref is None:
        pref = UserPreference(user_id=user.id)

    pref.location = payload.location
    pref.distance = payload.distance
    pref.age = payload.age
    pref.comfort = payload.comfort
    pref.kid_friendly = payload.kidFriendly
    pref.child_age = payload.childAge
    pref.vibes = payload.vibes
    pref.onboarding_complete = payload.onboardingComplete

    session.add(pref)
    session.commit()
    session.refresh(pref)
    return _to_payload(pref)
