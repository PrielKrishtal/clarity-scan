from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
  
from app.db.database import get_db
from app.schemas import user as user_schema
from app.crud import user as crud_user
from fastapi.security import OAuth2PasswordRequestForm,OAuth2PasswordBearer
from app.core import security
import jwt
from app.core.config import settings

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


@router.post("/login")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(),
                                 db: AsyncSession = Depends(get_db)):
   
   user = await crud_user.get_user_by_email(db=db, email=form_data.username)
   if not user or not security.verify_password(form_data.password,user.hashed_password):
     raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
   access_token = security.create_access_token({"sub": user.email_address})
    
   return {"access_token": access_token, "token_type": "bearer"}
   


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
    
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
            
    except jwt.InvalidTokenError:
        raise credentials_exception
        
  
    user = await crud_user.get_user_by_email(db=db, email=email)
    
    if user is None:
        raise credentials_exception
        
    return user


@router.get("/me")
async def read_users_me(current_user = Depends(get_current_user)):
    return current_user