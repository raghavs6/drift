from uuid import UUID

import jwt
from fastapi import Depends, Header, HTTPException
from sqlmodel import Session

from app.core.config import settings
from app.core.database import get_session
from app.models.user import User


def _decode_token(token: str) -> dict:
    """Verify a Supabase JWT and return its claims, or raise 401."""
    secret = settings.supabase_jwt_secret
    if not secret:
        raise HTTPException(status_code=500, detail="SUPABASE_JWT_SECRET not configured")
    try:
        return jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_current_user(
    authorization: str | None = Header(default=None),
    session: Session = Depends(get_session),
) -> User:
    """Resolve the signed-in Supabase user, creating the local row on first sight.

    Reads the ``Authorization: Bearer <jwt>`` header, verifies the token's
    signature, and upserts a matching ``users`` row so foreign keys resolve.
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    claims = _decode_token(token)

    user_id = UUID(claims["sub"])
    email = claims.get("email")

    user = session.get(User, user_id)
    if user is None:
        user = User(id=user_id, email=email)
        session.add(user)
        session.commit()
        session.refresh(user)

    return user
