"""
Friends workflow services.
"""

from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..entities.auth_entities import User
from ..entities.friends_entities import FriendResponse


class SelfFriendshipError(Exception):
    """Raised when user tries to friend themself."""


class FriendTargetNotFoundError(Exception):
    """Raised when target_user_id does not exist."""


class FriendRelationshipAlreadyExistsError(Exception):
    """Raised when friendship already exists in both directions."""


class FriendRelationshipNotFoundError(Exception):
    """Raised when friendship does not exist for delete."""


class FriendsService:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session

    async def list_friends(self, user_id: int, offset: int, limit: int) -> dict:
        total_stmt = text(
            """
            SELECT COUNT(*)::int AS total
            FROM friends
            WHERE user_id = :user_id
            """
        )
        list_stmt = text(
            """
            SELECT u.id, u.username, u.email, u.role, u.created_at
            FROM friends f
            JOIN users u ON u.id = f.friend_id
            WHERE f.user_id = :user_id
            ORDER BY u.id
            OFFSET :offset
            LIMIT :limit
            """
        )

        total_result = await self.db_session.execute(total_stmt, {"user_id": user_id})
        total = int(total_result.scalar_one())

        list_result = await self.db_session.execute(
            list_stmt,
            {"user_id": user_id, "offset": offset, "limit": limit},
        )
        rows = list_result.mappings().all()

        items = [
            User(
                id=row["id"],
                username=row["username"],
                email=row["email"],
                role=row["role"],
                created_at=row["created_at"],
            )
            for row in rows
        ]

        return {"items": items, "total": total}

    async def send_friend_request(self, current_user_id: int, target_user_id: int) -> FriendResponse:
        if target_user_id == current_user_id:
            raise SelfFriendshipError("Cannot add yourself as friend")

        target_exists_stmt = text(
            """
            SELECT id
            FROM users
            WHERE id = :target_user_id
            LIMIT 1
            """
        )
        target_exists_result = await self.db_session.execute(
            target_exists_stmt,
            {"target_user_id": target_user_id},
        )
        if target_exists_result.mappings().first() is None:
            raise FriendTargetNotFoundError("Target user not found")

        relation_check_stmt = text(
            """
            SELECT user_id, friend_id, created_at
            FROM friends
            WHERE (user_id = :current_user_id AND friend_id = :target_user_id)
               OR (user_id = :target_user_id AND friend_id = :current_user_id)
            """
        )
        relation_result = await self.db_session.execute(
            relation_check_stmt,
            {"current_user_id": current_user_id, "target_user_id": target_user_id},
        )
        existing_rows = relation_result.mappings().all()

        forward_row = next(
            (
                row
                for row in existing_rows
                if row["user_id"] == current_user_id and row["friend_id"] == target_user_id
            ),
            None,
        )
        reverse_row = next(
            (
                row
                for row in existing_rows
                if row["user_id"] == target_user_id and row["friend_id"] == current_user_id
            ),
            None,
        )

        if forward_row is not None and reverse_row is not None:
            raise FriendRelationshipAlreadyExistsError("Friend relationship already exists")

        insert_stmt = text(
            """
            INSERT INTO friends (user_id, friend_id)
            VALUES (:user_id, :friend_id)
            RETURNING user_id, friend_id, created_at
            """
        )

        created_at_for_response = forward_row["created_at"] if forward_row is not None else None

        try:
            if forward_row is None:
                forward_insert_result = await self.db_session.execute(
                    insert_stmt,
                    {"user_id": current_user_id, "friend_id": target_user_id},
                )
                inserted_forward = forward_insert_result.mappings().first()
                if inserted_forward is None:
                    raise RuntimeError("Failed to create forward friend relationship")
                created_at_for_response = inserted_forward["created_at"]

            if reverse_row is None:
                reverse_insert_result = await self.db_session.execute(
                    insert_stmt,
                    {"user_id": target_user_id, "friend_id": current_user_id},
                )
                inserted_reverse = reverse_insert_result.mappings().first()
                if inserted_reverse is None:
                    raise RuntimeError("Failed to create reverse friend relationship")

            await self.db_session.commit()

        except IntegrityError as exc:
            await self.db_session.rollback()
            lowered = str(exc).lower()

            if "unique" in lowered or "duplicate key" in lowered or "primary key" in lowered:
                raise FriendRelationshipAlreadyExistsError("Friend relationship already exists") from exc

            if "foreign key" in lowered:
                raise FriendTargetNotFoundError("Target user not found") from exc

            if "check" in lowered:
                raise SelfFriendshipError("Cannot add yourself as friend") from exc

            raise
        except Exception:
            await self.db_session.rollback()
            raise

        return FriendResponse(
            user_id=current_user_id,
            friend_id=target_user_id,
            created_at=created_at_for_response,
        )

    async def remove_friend(self, current_user_id: int, friend_id: int) -> None:
        delete_stmt = text(
            """
            DELETE FROM friends
            WHERE (user_id = :current_user_id AND friend_id = :friend_id)
               OR (user_id = :friend_id AND friend_id = :current_user_id)
            RETURNING user_id, friend_id
            """
        )

        try:
            delete_result = await self.db_session.execute(
                delete_stmt,
                {"current_user_id": current_user_id, "friend_id": friend_id},
            )
            deleted_rows = delete_result.mappings().all()

            if not deleted_rows:
                await self.db_session.rollback()
                raise FriendRelationshipNotFoundError("Friend relationship does not exist")

            await self.db_session.commit()

        except FriendRelationshipNotFoundError:
            raise
        except Exception:
            await self.db_session.rollback()
            raise


__all__ = [
    "FriendsService",
    "SelfFriendshipError",
    "FriendTargetNotFoundError",
    "FriendRelationshipAlreadyExistsError",
    "FriendRelationshipNotFoundError",
]