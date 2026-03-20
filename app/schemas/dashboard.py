from pydantic import BaseModel
from typing import List, Optional

class CategoryTotal(BaseModel):
    name: str
    value: float

class MonthlyTotal(BaseModel):
    month: str
    total: float

class DashboardSummaryResponse(BaseModel):
    total_receipts: int
    total_tracked: float               
    this_month_spent: float
    last_month_spent: float
    approved_this_month_count: int     
    pending_review_count: int
    biggest_receipt_merchant: Optional[str] = None
    biggest_receipt_amount: Optional[float] = None
    biggest_receipt_date: Optional[str] = None      
    avg_receipt_amount: float
    category_breakdown: List[CategoryTotal]
    monthly_chart_data: List[MonthlyTotal]