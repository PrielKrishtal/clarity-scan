from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models import Receipt
from app.schemas import receipt as schemas

# 1. CREATE
async def create_user_receipt(db: AsyncSession, receipt: schemas.ReceiptCreate, user_id: int):
    new_receipt = Receipt(**receipt.model_dump(), user_id=user_id)
    db.add(new_receipt)
    await db.commit()
    await db.refresh(new_receipt)
    return new_receipt

# 2. READ ALL
async def get_user_receipts(db: AsyncSession, user_id: int):
    result = await db.execute(select(Receipt).where(Receipt.user_id == user_id))
    return result.scalars().all()

# 3. READ ONE (Internal helper for Update/Delete/Get)
async def get_receipt_by_id(db: AsyncSession, receipt_id: int, user_id: int):
    result = await db.execute(
        select(Receipt).where(Receipt.id == receipt_id, Receipt.user_id == user_id)
    )
    return result.scalar_one_or_none()

# 4. UPDATE
async def update_user_receipt(db: AsyncSession, db_receipt: Receipt, update_data: schemas.ReceiptCreate):
    db_receipt.merchant_name = update_data.merchant_name
    db_receipt.total_amount = update_data.total_amount
    db_receipt.tax_amount = update_data.tax_amount
    db_receipt.receipt_date = update_data.receipt_date
    
    await db.commit()
    await db.refresh(db_receipt)
    return db_receipt

# 5. DELETE
async def delete_user_receipt(db: AsyncSession, db_receipt: Receipt):
    await db.delete(db_receipt)
    await db.commit()
