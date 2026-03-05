from app.db.database import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Numeric, func, String, Boolean, ForeignKey
from decimal import Decimal
from datetime import date, datetime
from typing import Optional, List
import enum
from sqlalchemy import Enum, DateTime
import uuid


class ReceiptStatus(enum.Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    REVIEW_NEEDED = "REVIEW_NEEDED"
    APPROVED = "APPROVED"
    FAILED = "FAILED"


class Receipt(Base):
    __tablename__ = "receipts"
    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    image_path: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    merchant_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    tax_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    total_amount: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    receipt_date: Mapped[Optional[date]] = mapped_column(nullable=True)
    status: Mapped[ReceiptStatus] = mapped_column(
        Enum(ReceiptStatus), default=ReceiptStatus.UPLOADED, nullable=False
    )
    # Creation date: Set once by the server, never updates
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    processed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    owner: Mapped["User"] = relationship(
        back_populates="receipts"
    )  # for fetching User obj
    # Update date: Set on creation, auto-updates on every change
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email_address: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str]
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # Creation date: Set once by the server, never updates
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    receipts: Mapped[List["Receipt"]] = relationship(back_populates="owner")

    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )
