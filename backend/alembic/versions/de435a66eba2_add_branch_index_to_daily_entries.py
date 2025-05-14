"""add_branch_index_to_daily_entries

Revision ID: de435a66eba2
Revises: 5794a4c1a5b2
Create Date: 2025-05-14 13:59:04.012934

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'de435a66eba2'
down_revision: Union[str, None] = '5794a4c1a5b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_index("idx_daily_entries_branch", "daily_entries", ["branch"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("idx_daily_entries_branch", "daily_entries")
