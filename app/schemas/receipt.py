from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from decimal import Decimal      
from datetime import date,datetime

# Base schema containing shared properties for all receipt operations.
# Serves as the core DTO (Data Transfer Object) to enforce the DRY principle.
class ReceiptBase(BaseModel):
    merchant_name: str = Field(..., min_length=2, max_length=100)
    total_amount: Decimal = Field(..., gt=0)
    tax_amount: Optional[Decimal] = Field(default=None, ge=0)
    receipt_date: Optional[date] = Field(default=None)

# Schema for the incoming payload when creating a new receipt.
# Strictly excludes system-generated fields (e.g., ID) to ensure data integrity and security.
class ReceiptCreate(ReceiptBase):
    pass


#handle stuff like id generation and time - stamps
# Schema for the outgoing response returned to the client.
# Includes database-generated fields and allows reading directly from SQLAlchemy ORM models.
class ReceiptResponse(ReceiptBase):
    id: int
    uploaded_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
    
    