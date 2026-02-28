from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
  
from app.db.database import get_db
from app.schemas import user as user_schema
from app.crud import user as crud_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=user_schema.UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: user_schema.UserCreate, db: AsyncSession = Depends(get_db)):
    existing_user = await crud_user.get_user_by_email(db=db, email=user.email_address)
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    return await crud_user.create_user(db=db, user=user)