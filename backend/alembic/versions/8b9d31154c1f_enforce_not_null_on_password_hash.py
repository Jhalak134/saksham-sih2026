"""enforce NOT NULL on password_hash

Revision ID: 8b9d31154c1f
Revises: f02569da78c9
Create Date: 2026-09-12
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "8b9d31154c1f"
down_revision = "f02569da78c9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Provide a fallback hash for any legacy records missing one
    op.execute("UPDATE users SET password_hash = 'legacy_no_password' WHERE password_hash IS NULL")
    
    # 2. Enforce NOT NULL constraint
    op.alter_column(
        "users", 
        "password_hash", 
        existing_type=sa.String(), 
        nullable=False
    )


def downgrade() -> None:
    op.alter_column(
        "users", 
        "password_hash", 
        existing_type=sa.String(), 
        nullable=True
    )
