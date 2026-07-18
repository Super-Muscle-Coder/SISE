"""add users.role and albums.deleted_at

Revision ID: 0003_add_role_deleted_at
Revises: 0002_add_pgvector
Create Date: 2026-07-18 00:00:00.000000

Changes (data_schema.yaml v1.2.0, Clause B — append-only):
  - Add users.role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user','admin'))
  - Add index idx_users_role ON users (role)
  - Add albums.deleted_at TIMESTAMP WITH TIME ZONE NULL (soft delete)
  - Add index idx_albums_deleted_at ON albums (deleted_at)

Rationale: openapi.yaml (POST /eval/run, POST /admin/reindex, DELETE
/albums/{id}) đã cam kết hành vi phụ thuộc 2 cột này từ v1.1.0/v1.2.0,
nhưng DDL trước đó chưa có — migration này khép lại khoảng trống đó,
đúng nguyên tắc append-only (không sửa/xóa migration 0001/0002).

Note: revision id rút gọn còn "0003_add_role_deleted_at" (24 ký tự) thay vì
tên đầy đủ mô tả — do bảng nội bộ alembic_version.version_num giới hạn
VARCHAR(32), tên dài hơn sẽ gây lỗi StringDataRightTruncation khi Alembic
tự UPDATE bảng này.
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0003_add_role_deleted_at"
down_revision = "0002_add_pgvector"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. users.role
    op.execute(
        "ALTER TABLE users "
        "ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' "
        "CHECK (role IN ('user','admin'))"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_users_role ON users (role)"
    )

    # 2. albums.deleted_at
    op.execute(
        "ALTER TABLE albums "
        "ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_albums_deleted_at ON albums (deleted_at)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_albums_deleted_at")
    op.execute("ALTER TABLE albums DROP COLUMN IF EXISTS deleted_at")
    op.execute("DROP INDEX IF EXISTS idx_users_role")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS role")