from app.api.collections import router as collections_router
from app.api.preferences import router as preferences_router
from app.api.swipes import router as swipes_router

__all__ = ["preferences_router", "swipes_router", "collections_router"]
