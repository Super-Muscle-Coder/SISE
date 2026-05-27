"""
Auth workflow routers — HTTP endpoints for authentication.

File prefix: auth_routers.py
Layer: routers
Responsibility: FastAPI route handlers for /auth/register, /auth/login, /auth/me.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from starlette.authentication import AuthCredentials
from starlette.requests import HTTPConnection

from ..dependencies import get_auth_service
from ..services.auth_services import AuthService
from ..entities.auth_entities import RegisterRequest, AuthRequest, AuthResponse, User


router = APIRouter(prefix="/auth", tags=["Auth"])
security = HTTPBearer()


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    responses={
        201: {"description": "User created successfully"},
        400: {"description": "Invalid registration data (duplicate username/email)"},
        500: {"description": "Internal server error"},
    },
)
async def register_user(
    req: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    """
    Register a new user.

    - **username**: 3-50 characters, unique
    - **email**: Valid email format, unique
    - **password**: Minimum 8 characters

    Returns access token on success.
    """
    try:
        response = await auth_service.register_user(req)
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed",
        )


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Authenticate and obtain JWT",
    responses={
        200: {"description": "Authentication successful"},
        400: {"description": "Missing required fields"},
        401: {"description": "Invalid credentials"},
        500: {"description": "Internal server error"},
    },
)
async def login_user(
    req: AuthRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> AuthResponse:
    """
    Authenticate user and obtain JWT access token.

    - **username**: Registered username
    - **password**: User's password

    Returns access token on successful authentication.
    """
    try:
        auth_response = await auth_service.login_user(req)
        if not auth_response:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
            )
        return auth_response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed",
        )


@router.get(
    "/me",
    response_model=User,
    summary="Get current authenticated user",
    responses={
        200: {"description": "Current user information"},
        401: {"description": "Unauthorized - missing or invalid token"},
        500: {"description": "Internal server error"},
    },
)
async def get_current_user(
    credentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    """
    Get information about the currently authenticated user.

    Requires valid Bearer token in Authorization header.
    """
    try:
        token = credentials.credentials
        user = await auth_service.get_current_user(token)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user",
        )


__all__ = ["router"]
