from app.db.database import Base
from sqlalchemy.orm import Mapped, mapped_column,relationship
from sqlalchemy import Numeric,func,String,Boolean,ForeignKey
from decimal import Decimal      
from datetime import date,datetime
from typing import Optional,List

class Receipt(Base):
    __tablename__ = "receipts" 
    id: Mapped[int] = mapped_column(primary_key=True)
    merchant_name: Mapped[str]
    tax_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    receipt_date: Mapped[date] 
    # Creation date: Set once by the server, never updates
    uploaded_at: Mapped[datetime] = mapped_column(server_default=func.now())
    processed_at: Mapped[Optional[datetime]]
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    owner: Mapped["User"] = relationship(back_populates="receipts") #for fetching User obj
    # Update date: Set on creation, auto-updates on every change
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), 
        onupdate=func.now()
    )


class User(Base):
    __tablename__ = "users" 
    id: Mapped[int] = mapped_column(primary_key=True)
    email_address: Mapped[str] = mapped_column(String(255), unique=True,index=True)
    hashed_password: Mapped[str] 
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # Creation date: Set once by the server, never updates
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    receipts: Mapped[List["Receipt"]] = relationship(back_populates="owner")
    

    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), 
        onupdate=func.now()
    )
