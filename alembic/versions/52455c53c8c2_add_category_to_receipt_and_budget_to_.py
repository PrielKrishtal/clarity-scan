"""add category to receipt and budget to user

Revision ID: 52455c53c8c2
Revises: 648dcc1b5264
Create Date: 2026-03-10 21:49:12.420389

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '52455c53c8c2'
down_revision: Union[str, None] = '648dcc1b5264'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
   
    category_enum = sa.Enum('FOOD', 'TRANSPORT', 'BILLS', 'SHOPPING', 'HEALTH', 'OTHER', name='receiptcategory')
    category_enum.create(op.get_bind(), checkfirst=True)

    
    op.add_column('receipts', sa.Column('category', category_enum, server_default='OTHER', nullable=False))
    op.add_column('users', sa.Column('monthly_budget', sa.Numeric(precision=10, scale=2), nullable=True))


def downgrade() -> None:
  
    op.drop_column('users', 'monthly_budget')
    op.drop_column('receipts', 'category')
    
   
    category_enum = sa.Enum('FOOD', 'TRANSPORT', 'BILLS', 'SHOPPING', 'HEALTH', 'OTHER', name='receiptcategory')
    category_enum.drop(op.get_bind(), checkfirst=True)