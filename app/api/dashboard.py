from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db 
from app.api.auth import get_current_user
from app.db.models import User
from app.schemas.dashboard import DashboardSummaryResponse
from app.services.dashboard_service import get_dashboard_summary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    currency: str = Query("ILS", description="The currency to calculate the dashboard in (ILS or USD)") # <-- הוספנו את זה!
):
    return await get_dashboard_summary(
        db=db, 
        user_id=current_user.id,
        display_currency=currency
    )