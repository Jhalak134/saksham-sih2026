"""add password hash to users

Revision ID: f02569da78c9
Revises:
Create Date: 2026-09-11
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f02569da78c9"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("password_hash", sa.String(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "password_hash")