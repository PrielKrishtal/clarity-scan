from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.models import Receipt
from app.schemas import receipt as schemas

router = APIRouter(
    prefix="/receipts",
    tags=["Receipts"]
)

# 1. CREATE
@router.post("/", response_model=schemas.ReceiptResponse, status_code=status.HTTP_201_CREATED)
async def create_receipt(receipt: schemas.ReceiptCreate, db: AsyncSession = Depends(get_db)):
    new_receipt = Receipt(**receipt.model_dump())
    db.add(new_receipt)
    await db.commit()
    await db.refresh(new_receipt)
    return new_receipt

# 2. READ ALL
@router.get("/", response_model=List[schemas.ReceiptResponse])
async def get_receipts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Receipt))
    return result.scalars().all()
 

# 3. READ ONE
@router.get("/{receipt_id}", response_model=schemas.ReceiptResponse)
async def get_receipt(receipt_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Receipt).where(Receipt.id == receipt_id))
    receipt = result.scalar_one_or_none()
    if receipt is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receipt not found")
    return receipt

       
# 4. UPDATE
@router.put("/{receipt_id}", response_model=schemas.ReceiptResponse)
async def update_receipt(receipt_id: int, receipt_update: schemas.ReceiptCreate, db: AsyncSession = Depends(get_db)):

    stmt = await db.execute(select(Receipt).where(Receipt.id == receipt_id))
    receipt_to_alter = stmt.scalar_one_or_none()


    if  receipt_to_alter is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receipt not found")
    
    
    receipt_to_alter.merchant_name = receipt_update.merchant_name
    receipt_to_alter.total_amount = receipt_update.total_amount
    receipt_to_alter.tax_amount = receipt_update.tax_amount
    receipt_to_alter.receipt_date = receipt_update.receipt_date

    await db.commit()

    await db.refresh(receipt_to_alter)

    return receipt_to_alter

# 5. DELETE
@router.delete("/{receipt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_receipt(receipt_id: int, db: AsyncSession = Depends(get_db)):
   
    stmt = await db.execute(select(Receipt).where(Receipt.id == receipt_id))
    receipt_to_delete = stmt.scalar_one_or_none()


    if  receipt_to_delete is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receipt not found")
    
    
    await db.delete(receipt_to_delete)
    await db.commit()

    return

    
