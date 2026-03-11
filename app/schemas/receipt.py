from typing import Optional

from pydantic import BaseModel, ConfigDict, Field
from decimal import Decimal
from datetime import date, datetime
from app.db.models import ReceiptStatus,ReceiptCategory


class ReceiptBase(BaseModel):
    merchant_name: str = Field(..., min_length=2, max_length=100)
    total_amount: Decimal = Field(..., gt=0)
    tax_amount: Decimal | None = Field(default=None, ge=0)
    receipt_date: date | None = Field(default=None)
    category: ReceiptCategory | None = Field(default=ReceiptCategory.OTHER)

class ReceiptCreate(ReceiptBase):
    pass


class ReceiptUpdate(BaseModel):
    merchant_name: str | None = Field(default=None, min_length=2, max_length=100)
    total_amount: Decimal | None = Field(default=None, gt=0)
    tax_amount: Decimal | None = Field(default=None, ge=0)
    receipt_date: date | None = Field(default=None)
    category: ReceiptCategory | None = Field(default=None)

class ReceiptResponse(BaseModel):
    id: str
    status: ReceiptStatus
    category: ReceiptCategory
    merchant_name: str | None = None
    total_amount: Decimal | None = None
    tax_amount: Decimal | None = None
    receipt_date: date | None = None
    image_path: Optional[str] = None
    uploaded_at: datetime | None = None
    processed_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)
