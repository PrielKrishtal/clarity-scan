"""update_currency_to_enum

Revision ID: d297b539fe88
Revises: fe9ab81faaee
Create Date: 2026-03-19 01:29:33.165939

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd297b539fe88'
down_revision: Union[str, None] = 'fe9ab81faaee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create the new Enum type in PostgreSQL
    op.execute("CREATE TYPE currencytype AS ENUM ('ILS', 'USD')")
    
    # 2. Drop the old default value ('₪')
    op.execute("ALTER TABLE receipts ALTER COLUMN currency DROP DEFAULT")
    
    # 3. Change the column type (and tell Postgres how to cast it)
    op.execute("ALTER TABLE receipts ALTER COLUMN currency TYPE currencytype USING currency::text::currencytype")
    
    # 4. Set the new correct default
    op.execute("ALTER TABLE receipts ALTER COLUMN currency SET DEFAULT 'ILS'")


def downgrade() -> None:
    # Revert back to VARCHAR
    op.execute("ALTER TABLE receipts ALTER COLUMN currency DROP DEFAULT")
    op.execute("ALTER TABLE receipts ALTER COLUMN currency TYPE VARCHAR USING currency::text")
    op.execute("ALTER TABLE receipts ALTER COLUMN currency SET DEFAULT '₪'")
    op.execute("DROP TYPE currencytype")
