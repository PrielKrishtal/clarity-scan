import os
import uuid
from typing import List

import aiofiles
import magic
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession


from app.api.auth import get_current_user
from app.crud import receipt as crud_receipt
from app.db.database import get_db
from app.db.models import User
from app.schemas import receipt as schemas
from app.services.ai_processor import process_receipt_task
from app.db.models import ReceiptStatus

# --- Constants & Setup ---
UPLOAD_DIR = "app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(prefix="/receipts", tags=["Receipts"])

SAFE_EXTENSIONS = {"image/jpeg": "jpg", "image/png": "png"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


# 1. CREATE - Path A: Manual Entry (JSON)
@router.post(
    "/", response_model=schemas.ReceiptResponse, status_code=status.HTTP_201_CREATED
)
async def create_receipt_manual(
    receipt: schemas.ReceiptCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return await crud_receipt.create_manual_receipt(
        db=db, receipt=receipt, user_id=current_user.id
    )


# 1. CREATE - Path B: Image Upload (Multipart/form-data)
@router.post(
    "/upload",
    response_model=schemas.ReceiptResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def upload_receipt_image(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    head = await file.read(2048)
    await file.seek(0)
    mime = magic.from_buffer(head, mime=True)
    if mime not in SAFE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File must be an image")

    file_type = SAFE_EXTENSIONS[mime]

    unique_filename = f"{uuid.uuid4().hex}.{file_type}"
    full_path = os.path.join(UPLOAD_DIR, unique_filename)

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB)")

    async with aiofiles.open(full_path, mode="wb") as f:
        await f.write(content)

    new_receipt = await crud_receipt.create_receipt_from_upload(
        db, full_path, current_user.id
    )

    background_tasks.add_task(process_receipt_task, new_receipt.id, current_user.id)

    return new_receipt


# 2. READ ALL
@router.get("/", response_model=List[schemas.ReceiptResponse])
async def get_receipts(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crud_receipt.get_user_receipts(
        db=db, user_id=current_user.id, skip=skip, limit=limit
    )


# 3. READ ONE
@router.get("/{receipt_id}", response_model=schemas.ReceiptResponse)
async def get_receipt(
    receipt_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    receipt = await crud_receipt.get_receipt_by_id(
        db=db, receipt_id=receipt_id, user_id=current_user.id
    )
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt


# 4. UPDATE(put)
@router.put("/{receipt_id}", response_model=schemas.ReceiptResponse)
async def update_receipt(
    receipt_id: str,
    receipt_update: schemas.ReceiptUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    db_receipt = await crud_receipt.get_receipt_by_id(
        db=db, receipt_id=receipt_id, user_id=current_user.id
    )
    
    if not db_receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")

    if db_receipt.status == ReceiptStatus.REVIEW_NEEDED:
        db_receipt.status = ReceiptStatus.APPROVED

    return await crud_receipt.update_user_receipt(
        db=db, db_receipt=db_receipt, update_data=receipt_update
    )


# 5. DELETE
@router.delete("/{receipt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_receipt(
    receipt_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db_receipt = await crud_receipt.get_receipt_by_id(
        db=db, receipt_id=receipt_id, user_id=current_user.id
    )
    if not db_receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    await crud_receipt.delete_user_receipt(db=db, db_receipt=db_receipt)
