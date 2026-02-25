from app.db.database import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Numeric,func
from decimal import Decimal      
from datetime import date,datetime
from typing import Optional

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
    
    # Update date: Set on creation, auto-updates on every change
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), 
        onupdate=func.now()
    )
