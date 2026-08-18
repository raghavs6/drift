from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, delete, select

from app.core.auth import get_current_user
from app.core.database import get_session
from app.models.collection import Collection, CollectionItem
from app.models.experience import Experience
from app.models.user import User

router = APIRouter(prefix="/api/collections", tags=["collections"])

# Default collections shown even before the user saves anything (mirrors the
# frontend `normalizeCollections` defaults).
DEFAULT_COLLECTIONS = [
    {"id": "saved", "label": "Saved", "icon": "💚"},
    {"id": "bucket", "label": "Bucket List", "icon": "⭐"},
]


class CollectionPayload(BaseModel):
    id: str
    label: str
    icon: str | None = None
    itemIds: list[str] = []


class CollectionsPayload(BaseModel):
    collections: list[CollectionPayload]


class PutCollectionsResult(BaseModel):
    status: str = "ok"
    # Ids that referenced experiences no longer in the catalog. They are skipped
    # rather than rejected: a full-replace PUT carrying one dead id would
    # otherwise become a poison pill that permanently breaks that user's sync.
    droppedIds: list[str] = []


def _db_id(user_id: UUID, frontend_id: str) -> str:
    """Namespace a frontend collection id under the user so ids are globally unique."""
    return f"{user_id}:{frontend_id}"


def _frontend_id(db_id: str) -> str:
    """Strip the `{user_id}:` namespace. Tolerates an id stored without one."""
    return db_id.split(":", 1)[-1]


@router.get("")
def get_collections(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> CollectionsPayload:
    collections = session.exec(
        select(Collection).where(Collection.user_id == user.id)
    ).all()

    if not collections:
        return CollectionsPayload(
            collections=[CollectionPayload(**c, itemIds=[]) for c in DEFAULT_COLLECTIONS]
        )

    items = session.exec(
        select(CollectionItem).where(
            CollectionItem.collection_id.in_([c.id for c in collections])
        )
    ).all()
    items_by_collection: dict[str, list[str]] = {}
    for item in items:
        items_by_collection.setdefault(item.collection_id, []).append(item.experience_id)

    return CollectionsPayload(
        collections=[
            CollectionPayload(
                id=_frontend_id(c.id),
                label=c.label,
                icon=c.icon,
                itemIds=items_by_collection.get(c.id, []),
            )
            for c in collections
        ]
    )


@router.put("")
def put_collections(
    payload: CollectionsPayload,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> PutCollectionsResult:
    """Replace all of the user's collections with the posted set."""
    existing = session.exec(
        select(Collection.id).where(Collection.user_id == user.id)
    ).all()
    if existing:
        session.exec(
            delete(CollectionItem).where(CollectionItem.collection_id.in_(existing))
        )
        session.exec(delete(Collection).where(Collection.user_id == user.id))

    # CollectionItem.experience_id is a foreign key, so an id missing from the
    # catalog would abort the whole transaction with an IntegrityError (a 500).
    # Check once up front and skip the strays instead.
    posted_ids = {eid for c in payload.collections for eid in c.itemIds}
    known_ids: set[str] = set()
    if posted_ids:
        known_ids = set(
            session.exec(select(Experience.id).where(Experience.id.in_(posted_ids))).all()
        )
    dropped = posted_ids - known_ids

    for c in payload.collections:
        db_id = _db_id(user.id, c.id)
        session.add(Collection(id=db_id, user_id=user.id, label=c.label, icon=c.icon))
        for experience_id in dict.fromkeys(c.itemIds):
            if experience_id not in known_ids:
                continue
            session.add(
                CollectionItem(collection_id=db_id, experience_id=experience_id)
            )

    session.commit()
    return PutCollectionsResult(droppedIds=sorted(dropped))
