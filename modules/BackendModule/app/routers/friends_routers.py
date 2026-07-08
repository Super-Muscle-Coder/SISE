"""
Friends workflow routers.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from ..dependencies import get_async_db_session, get_auth_service
from ..entities.auth_entities import User
from ..entities.friends_entities import FriendRequestBody, FriendResponse
from ..services.auth_services import AuthService
from ..services.friends_services import (
    FriendRelationshipAlreadyExistsError,
    FriendRelationshipNotFoundError,
    FriendTargetNotFoundError,
    FriendsService,
    SelfFriendshipError,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/friends", tags=["Friends"])
bearer_scheme = HTTPBearer(auto_error=False)


async def get_friends_service(
    db_session: AsyncSession = Depends(get_async_db_session),
) -> FriendsService:
    return FriendsService(db_session=db_session)


async def get_current_authenticated_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Authentication required"},
        )

    current_user = await auth_service.get_current_user(credentials.credentials)
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Invalid or expired token"},
        )

    return current_user


@router.get("")
async def list_friends(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1),
    current_user: User = Depends(get_current_authenticated_user),
    friends_service: FriendsService = Depends(get_friends_service),
) -> dict[str, Any]:
    try:
        return await friends_service.list_friends(
            user_id=current_user.id,
            offset=offset,
            limit=limit,
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error while listing friends")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "Internal server error"},
        )


@router.post("/request", status_code=status.HTTP_201_CREATED, response_model=FriendResponse)
async def send_friend_request(
    body: FriendRequestBody,
    current_user: User = Depends(get_current_authenticated_user),
    friends_service: FriendsService = Depends(get_friends_service),
) -> FriendResponse:
    try:
        return await friends_service.send_friend_request(
            current_user_id=current_user.id,
            target_user_id=body.target_user_id,
        )
    except SelfFriendshipError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "SELF_FRIENDSHIP_NOT_ALLOWED", "message": str(exc)},
        ) from exc
    except FriendTargetNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TARGET_USER_NOT_FOUND", "message": str(exc)},
        ) from exc
    except FriendRelationshipAlreadyExistsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "FRIEND_RELATIONSHIP_EXISTS", "message": str(exc)},
        ) from exc
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error while sending friend request")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "Internal server error"},
        )


@router.delete("/{friend_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def remove_friend(
    friend_id: int,
    current_user: User = Depends(get_current_authenticated_user),
    friends_service: FriendsService = Depends(get_friends_service),
) -> Response:
    try:
        await friends_service.remove_friend(current_user_id=current_user.id, friend_id=friend_id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except FriendRelationshipNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "FRIEND_RELATIONSHIP_NOT_FOUND", "message": str(exc)},
        ) from exc
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error while removing friend")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "Internal server error"},
        )


__all__ = ["router"]