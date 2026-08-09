"""add top_k and top1_cross_class_confusion_rate to evaluation_metrics

Revision ID: 0005_add_topk_confusion_rate
Revises: 0004_add_evaluation_tables
Create Date: 2026-08-08 00:00:00.000000

Changes (data_schema.yaml — Clause D table, migration owned by Clause B
per architecture decision: AG-03 may SQLAlchemy directly into
evaluation_metrics at runtime per backend_owned_resources, but schema
changes remain the sole responsibility of AG-02 via Alembic):
  - Add evaluation_metrics.top_k INTEGER (nullable, no default)
  - Add evaluation_metrics.top1_cross_class_confusion_rate REAL
    (nullable, no default)

Rationale (GVHD review finding, issue A3): evaluation_metrics only
persisted the 4 core IR metrics (mrr, hit_rate, precision, recall).
Two values returned in the POST /eval/run response — top_k (the cutoff
threshold used for the run) and top1_cross_class_confusion_rate (a
custom-designed metric) — were computed but never stored, making
benchmark results non-reproducible from system data alone. This
migration closes that gap, append-only, per Clause B evolution rules.

Nullable, no backfill: pre-existing evaluation_metrics rows (historical
benchmark results recorded before this migration) will have NULL in
both new columns. This is accepted — no historical top_k/confusion_rate
data exists to backfill, and inventing placeholder values would
misrepresent past results.
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0005_add_topk_confusion_rate"
down_revision = "0004_add_evaluation_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "evaluation_metrics",
        sa.Column("top_k", sa.Integer(), nullable=True),
    )
    op.add_column(
        "evaluation_metrics",
        sa.Column(
            "top1_cross_class_confusion_rate", sa.Float(), nullable=True
        ),
    )


def downgrade() -> None:
    op.drop_column("evaluation_metrics", "top1_cross_class_confusion_rate")
    op.drop_column("evaluation_metrics", "top_k")