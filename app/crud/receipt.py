from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.schemas import receipt as schemas
from app.db.models import Receipt, ReceiptStatus

# 1. CREATE
# Path A: Manual Entry (No Image)
async def create_manual_receipt(db: AsyncSession, receipt: schemas.ReceiptCreate, user_id: int):
    new_receipt = Receipt(
        **receipt.model_dump(), 
        user_id=user_id,
        status=ReceiptStatus.APPROVED # Bypass OCR pipeline
    )
    db.add(new_receipt)
    await db.commit()
    await db.refresh(new_receipt)
    return new_receipt

# Path B: Image Upload (Sprint 3)
async def create_receipt_from_upload(db: AsyncSession, file_path: str, user_id: int):
    new_receipt = Receipt(
        image_path=file_path,
        user_id=user_id,
        status=ReceiptStatus.UPLOADED # Ready for background task
    )
    db.add(new_receipt)
    await db.commit()
    await db.refresh(new_receipt)
    return new_receipt

# 2. READ ALL
async def get_user_receipts(db: AsyncSession, user_id: int):
    result = await db.execute(select(Receipt).where(Receipt.user_id == user_id))
    return result.scalars().all()

# 3. READ ONE (Internal helper for Update/Delete/Get)
async def get_receipt_by_id(db: AsyncSession, receipt_id: str, user_id: int):
    result = await db.execute(
        select(Receipt).where(Receipt.id == receipt_id, Receipt.user_id == user_id)
    )
    return result.scalar_one_or_none()

# 4. UPDATE
async def update_user_receipt(db: AsyncSession, db_receipt: Receipt, update_data: schemas.ReceiptUpdate):
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(db_receipt, key, value)
    db_receipt.status = ReceiptStatus.APPROVED
    await db.commit()
    await db.refresh(db_receipt)
    return db_receipt

# 5. DELETE
async def delete_user_receipt(db: AsyncSession, db_receipt: Receipt):
    await db.delete(db_receipt)
    await db.commit()
