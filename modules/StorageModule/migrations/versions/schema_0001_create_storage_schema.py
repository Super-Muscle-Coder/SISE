"""create storage schema

Revision ID: 0001_create_storage_schema
Revises:
Create Date: 2026-05-12 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0001_create_storage_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False, unique=True),
        sa.Column("email", sa.String(length=100), nullable=False, unique=True),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )

    op.create_table(
        "friends",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("friend_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["friend_id"], ["users.id"], ondelete="CASCADE"),
        sa.CheckConstraint("user_id <> friend_id", name="ck_friends_not_self"),
        sa.PrimaryKeyConstraint("user_id", "friend_id", name="pk_friends"),
    )

    op.create_index("idx_friends_user_id", "friends", ["user_id"], unique=False)
    op.create_index(
        "idx_friends_friend_id", "friends", ["friend_id"], unique=False
    )

    op.create_table(
        "albums",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_public", sa.Boolean(), server_default=sa.text("FALSE")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "images",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            nullable=False,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("album_id", sa.Integer(), nullable=True),
        sa.Column("minio_object_name", sa.Text(), nullable=False, unique=True),
        sa.Column("minio_bucket", sa.Text(), nullable=False),
        sa.Column(
            "privacy_level",
            sa.SmallInteger(),
            server_default=sa.text("2"),
            nullable=False,
        ),
        sa.Column("tags", postgresql.JSONB(), nullable=True),
        sa.Column(
            "index_status",
            sa.String(length=20),
            server_default=sa.text("'pending'"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["album_id"], ["albums.id"]),
        sa.CheckConstraint(
            "privacy_level IN (0, 1, 2)", name="ck_images_privacy_level"
        ),
        sa.CheckConstraint(
            "index_status IN ('pending', 'ready', 'failed')",
            name="ck_images_index_status",
        ),
    )

    op.create_index("idx_images_user_id", "images", ["user_id"], unique=False)
    op.create_index(
        "idx_images_privacy_level", "images", ["privacy_level"], unique=False
    )
    op.create_index("idx_images_created_at", "images", ["created_at"], unique=False)
    op.create_index(
        "idx_images_tags_gin",
        "images",
        ["tags"],
        unique=False,
        postgresql_using="gin",
    )
    op.create_index(
        "idx_images_index_status", "images", ["index_status"], unique=False
    )


def downgrade() -> None:
    op.drop_index("idx_images_index_status", table_name="images")
    op.drop_index("idx_images_tags_gin", table_name="images")
    op.drop_index("idx_images_created_at", table_name="images")
    op.drop_index("idx_images_privacy_level", table_name="images")
    op.drop_index("idx_images_user_id", table_name="images")
    op.drop_table("images")

    op.drop_table("albums")

    op.drop_index("idx_friends_friend_id", table_name="friends")
    op.drop_index("idx_friends_user_id", table_name="friends")
    op.drop_table("friends")

    op.drop_table("users")

    op.execute('DROP EXTENSION IF EXISTS "pgcrypto"')
    op.execute('DROP EXTENSION IF EXISTS "uuid-ossp"')
