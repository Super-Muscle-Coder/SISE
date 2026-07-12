"""
Auth workflow services — User registration, login, token validation.
"""

from typing import Optional

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..adapters.auth_adapters import PasswordHasher, TokenGenerator
from ..entities.auth_entities import AuthRequest, AuthResponse, RegisterRequest, User


class UserAlreadyExistsError(Exception):
    """Raised when username or email already exists."""


class AuthService:
    def __init__(
        self,
        db_session: AsyncSession,
        token_generator: TokenGenerator,
        expiration_seconds: int,
    ):
        if expiration_seconds <= 0:
            raise ValueError("expiration_seconds must be positive")
        self.db_session = db_session
        self.token_generator = token_generator
        self.expiration_seconds = expiration_seconds
        self.password_hasher = PasswordHasher()

    async def register_user(self, req: RegisterRequest) -> User:
        duplicate_stmt = text(
            """
            SELECT id, username, email
            FROM users
            WHERE username = :username OR email = :email
            LIMIT 1
            """
        )

        insert_stmt = text(
            """
            INSERT INTO users (username, email, password_hash)
            VALUES (:username, :email, :password_hash)
            RETURNING id, username, email, role, created_at
            """
        )

        try:
            duplicate_result = await self.db_session.execute(
                duplicate_stmt,
                {"username": req.username, "email": req.email},
            )
            duplicate_row = duplicate_result.mappings().first()
            if duplicate_row is not None:
                raise UserAlreadyExistsError("Username or email already exists")

            password_hash = self.password_hasher.hash_password(req.password)

            insert_result = await self.db_session.execute(
                insert_stmt,
                {
                    "username": req.username,
                    "email": req.email,
                    "password_hash": password_hash,
                },
            )
            inserted = insert_result.mappings().first()
            if inserted is None:
                raise RuntimeError("Failed to create user")

            await self.db_session.commit()

        except UserAlreadyExistsError:
            await self.db_session.rollback()
            raise
        except IntegrityError as exc:
            await self.db_session.rollback()
            lowered = str(exc).lower()
            if "unique" in lowered and ("username" in lowered or "email" in lowered):
                raise UserAlreadyExistsError("Username or email already exists") from exc
            raise
        except Exception:
            await self.db_session.rollback()
            raise

        return User(
            id=inserted["id"],
            username=inserted["username"],
            email=inserted["email"],
            role=inserted["role"],
            created_at=inserted["created_at"],
        )

    async def login_user(self, req: AuthRequest) -> Optional[AuthResponse]:
        select_stmt = text(
            """
            SELECT id, username, password_hash
            FROM users
            WHERE username = :username
            LIMIT 1
            """
        )

        result = await self.db_session.execute(select_stmt, {"username": req.username})
        row = result.mappings().first()
        if row is None:
            return None

        if not self.password_hasher.verify_password(req.password, row["password_hash"]):
            return None

        access_token = self.token_generator.generate_token(
            user_id=row["id"],
            username=row["username"],
            expires_in=self.expiration_seconds,
        )

        return AuthResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=self.expiration_seconds,
        )

    async def get_current_user(self, token: str) -> Optional[User]:
        payload = self.token_generator.verify_token(token)
        if not payload:
            return None

        select_stmt = text(
            """
            SELECT id, username, email, role, created_at
            FROM users
            WHERE id = :user_id
            LIMIT 1
            """
        )
        result = await self.db_session.execute(select_stmt, {"user_id": payload.user_id})
        row = result.mappings().first()
        if row is None:
            return None

        return User(
            id=row["id"],
            username=row["username"],
            email=row["email"],
            role=row["role"],
            created_at=row["created_at"],
        )


__all__ = ["AuthService", "UserAlreadyExistsError"]