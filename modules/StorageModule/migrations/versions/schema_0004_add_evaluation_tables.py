"""add evaluation_runs and evaluation_metrics tables

Revision ID: 0004_add_evaluation_tables
Revises: 0003_add_role_deleted_at
Create Date: 2026-07-18 12:00:00.000000

Changes (data_schema.yaml v1.2.3, Clause D — append-only):
  - Create table evaluation_runs (benchmark run history)
  - Create index idx_evaluation_runs_status ON evaluation_runs (status)
  - Create table evaluation_metrics (computed MRR/HitRate/Precision/Recall
    per run, 1:1 with evaluation_runs via PK = FK)

Rationale: T003-07 (evaluation workflow) trước đây dùng SQLite
(./data/evaluation.db) — vi phạm kiến trúc (không có volume bền vững,
không nằm trong backup_and_dr, không nhất quán với các workflow khác đều
dùng PostgreSQL qua AsyncSession). data_schema.yaml v1.2.3 đã APPEND 2
bảng này và openapi.yaml/Backend code (T003-07 REBUILD) đã chuyển sang
query PostgreSQL — nhưng migration Alembic tạo bảng thật trong DB chưa
từng được chạy. Migration này khép lại khoảng trống đó, đúng nguyên tắc
append-only (không sửa/xóa migration 0001/0002/0003).

Note: cột `precision` là reserved keyword trong SQL (numeric precision),
nên được quote bằng dấu ngoặc kép trong DDL để PostgreSQL hiểu đây là tên
cột, không phải cú pháp kiểu dữ liệu. Backend code (SQLAlchemy raw text())
truy vấn qua `m.precision` — cần xác nhận Backend cũng quote/alias đúng
cách nếu dùng ORM Column thay vì raw SQL, nhưng đây là phạm vi audit
BackendModule, không phải phạm vi migration này.
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "0004_add_evaluation_tables"
down_revision = "0003_add_role_deleted_at"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. evaluation_runs — phải tạo trước vì evaluation_metrics FK trỏ tới nó
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS evaluation_runs (
            eval_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            status        VARCHAR(20) NOT NULL
                          CHECK (status IN ('pending','running','completed','failed')),
            query_count   INTEGER DEFAULT 0,
            limit_images  INTEGER,
            seed          INTEGER,
            created_by    INTEGER REFERENCES users(id),
            started_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            completed_at  TIMESTAMP WITH TIME ZONE NULL
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_evaluation_runs_status "
        "ON evaluation_runs (status)"
    )

    # 2. evaluation_metrics — FK ON DELETE CASCADE tới evaluation_runs.eval_id
    #    "precision" phải quote kép vì là reserved keyword trong PostgreSQL
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS evaluation_metrics (
            eval_id      UUID PRIMARY KEY
                         REFERENCES evaluation_runs(eval_id) ON DELETE CASCADE,
            mrr          REAL NOT NULL,
            hit_rate     REAL NOT NULL,
            "precision"  REAL NOT NULL,
            recall       REAL NOT NULL,
            computed_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
        """
    )


def downgrade() -> None:
    # Xóa theo thứ tự ngược: evaluation_metrics trước (con), evaluation_runs sau (cha)
    op.execute("DROP TABLE IF EXISTS evaluation_metrics")
    op.execute("DROP INDEX IF EXISTS idx_evaluation_runs_status")
    op.execute("DROP TABLE IF EXISTS evaluation_runs")