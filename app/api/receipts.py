import os
import uuid
from typing import List

import aiofiles
import magic
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession


from app.api.auth import get_current_user
from app.crud import receipt as crud_receipt
from app.db.database import get_db
from app.db.models import User
from app.schemas import receipt as schemas
# TODO: Import the wrapper function for the AI scanner once it's built
# from app.services.ai_processor import process_receipt_task

# --- Constants & Setup ---
UPLOAD_DIR = "app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(
    prefix="/receipts",
    tags=["Receipts"]
)

# 1. CREATE - Path A: Manual Entry (JSON)
@router.post("/", response_model=schemas.ReceiptResponse, status_code=status.HTTP_201_CREATED)
async def create_receipt_manual(
    receipt: schemas.ReceiptCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):

    return await crud_receipt.create_manual_receipt(db=db, receipt=receipt, user_id=current_user.id)


# 1. CREATE - Path B: Image Upload (Multipart/form-data)
@router.post("/upload", response_model=schemas.ReceiptResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_receipt_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)):
    head = await file.read(2048)
    await file.seek(0)
    mime = magic.from_buffer(head, mime=True)
    if mime not in ["image/jpeg","image/png",]:
        raise HTTPException(status_code=400, detail="File must be an image")

   
    file_type = file.filename.split(".")[-1] #extract the last str after '.'
    unique_filename = f"{uuid.uuid4().hex}.{file_type}"
    full_path = os.path.join(UPLOAD_DIR, unique_filename)


    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    async with aiofiles.open(full_path, mode='wb') as f:
        await f.write(content)
        
    
    new_receipt = await crud_receipt.create_receipt_from_upload(db, full_path, current_user.id)


    # TODO: Connect this to the actual AI wrapper function
    # background_tasks.add_task(process_receipt_task, new_receipt.id)

    return new_receipt




# 2. READ ALL
@router.get("/", response_model=List[schemas.ReceiptResponse])
async def get_receipts(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    return await crud_receipt.get_user_receipts(db=db, user_id=current_user.id)


# 3. READ ONE
@router.get("/{receipt_id}", response_model=schemas.ReceiptResponse)
async def get_receipt(receipt_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    receipt = await crud_receipt.get_receipt_by_id(db=db, receipt_id=receipt_id, user_id=current_user.id)
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt


# 4. UPDATE(put)
@router.put("/{receipt_id}", response_model=schemas.ReceiptResponse)
async def update_receipt(receipt_id: str, receipt_update: schemas.ReceiptUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
   
    db_receipt = await crud_receipt.get_receipt_by_id(db=db, receipt_id=receipt_id, user_id=current_user.id)
    if not db_receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return await crud_receipt.update_user_receipt(db=db, db_receipt=db_receipt, update_data=receipt_update)


# 5. DELETE
@router.delete("/{receipt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_receipt(receipt_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_receipt = await crud_receipt.get_receipt_by_id(db=db, receipt_id=receipt_id, user_id=current_user.id)
    if not db_receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    await crud_receipt.delete_user_receipt(db=db, db_receipt=db_receipt)
