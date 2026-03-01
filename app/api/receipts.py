from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.models import User
from app.schemas import receipt as schemas
from app.api.auth import get_current_user
from app.crud import receipt as crud_receipt

router = APIRouter(
    prefix="/receipts",
    tags=["Receipts"]
)

# 1. CREATE
@router.post("/", response_model=schemas.ReceiptResponse, status_code=status.HTTP_201_CREATED)
async def create_receipt(receipt: schemas.ReceiptCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await crud_receipt.create_user_receipt(db=db, receipt=receipt, user_id=current_user.id)


# 2. READ ALL
@router.get("/", response_model=List[schemas.ReceiptResponse])
async def get_receipts(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await crud_receipt.get_user_receipts(db=db, user_id=current_user.id)


# 3. READ ONE
@router.get("/{receipt_id}", response_model=schemas.ReceiptResponse)
async def get_receipt(receipt_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    receipt = await crud_receipt.get_receipt_by_id(db=db, receipt_id=receipt_id, user_id=current_user.id)
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt


# 4. UPDATE(put)
@router.put("/{receipt_id}", response_model=schemas.ReceiptResponse)
async def update_receipt(receipt_id: int, receipt_update: schemas.ReceiptCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
   
    db_receipt = await crud_receipt.get_receipt_by_id(db=db, receipt_id=receipt_id, user_id=current_user.id)
    if not db_receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return await crud_receipt.update_user_receipt(db=db, db_receipt=db_receipt, update_data=receipt_update)


# 5. DELETE
@router.delete("/{receipt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_receipt(receipt_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_receipt = await crud_receipt.get_receipt_by_id(db=db, receipt_id=receipt_id, user_id=current_user.id)
    if not db_receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    await crud_receipt.delete_user_receipt(db=db, db_receipt=db_receipt)
