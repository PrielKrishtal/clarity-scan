from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import User
from app.schemas import user as user_schema
from app.core.security import get_password_hash
from sqlalchemy import select


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    stmt = select(User).where(User.email_address == email)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

    


async def create_user(db: AsyncSession, user: user_schema.UserCreate) -> User:
    hashed_pwd = get_password_hash(user.password)
    db_user = User(email_address=user.email_address, hashed_password=hashed_pwd)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user
  
