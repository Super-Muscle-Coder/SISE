"""
Auth workflow routers — HTTP endpoints for authentication.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..dependencies import get_auth_service
from ..entities.auth_entities import AuthRequest, AuthResponse, RegisterRequest, User
from ..services.auth_services import AuthService, UserAlreadyExistsError

router = APIRouter(prefix="/auth", tags=["Auth"])
bearer_scheme = HTTPBearer(auto_error=False)
logger = logging.getLogger(__name__)


@router.post(
    "/register",
    response_model=User,
    status_code=status.HTTP_201_CREATED,
    responses={
        201: {"description": "User created successfully"},
        400: {"description": "Invalid registration payload"},
        409: {"description": "Username/email already exists"},
        500: {"description": "Internal server error"},
    },
)
async def register_user(
    req: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    try:
        return await auth_service.register_user(req)
    except UserAlreadyExistsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "ERR_USER_ALREADY_EXISTS",
                "message": str(exc),
            },
        )
    except Exception:
        logger.exception("Unexpected error during /auth/register")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "ERR_INTERNAL",
                "message": "Registration failed",
            },
        )


@router.post(
    "/login",
    response_model=AuthResponse,
    responses={
        200: {"description": "Authentication successful"},
        400: {"description": "Invalid request payload"},
        401: {"description": "Invalid credentials"},
        500: {"description": "Internal server error"},
    },
)
async def login_user(
    req: AuthRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    try:
        auth_response = await auth_service.login_user(req)
        if not auth_response:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "UNAUTHORIZED", "message": "Invalid username or password"},
            )
        return auth_response
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error during /auth/login")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "ERR_INTERNAL",
                "message": "Login failed",
            },
        )


@router.get(
    "/me",
    response_model=User,
    responses={
        200: {"description": "Current user information"},
        401: {"description": "Unauthorized"},
        500: {"description": "Internal server error"},
    },
)
async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHORIZED", "message": "Authentication required"},
        )

    try:
        token = credentials.credentials
        user = await auth_service.get_current_user(token)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "UNAUTHORIZED", "message": "Invalid or expired token"},
            )
        return user
    except HTTPException:
        raise
    except Exception:
        logger.exception("Unexpected error during /auth/me")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "ERR_INTERNAL",
                "message": "Failed to retrieve user",
            },
        )


__all__ = ["router"]