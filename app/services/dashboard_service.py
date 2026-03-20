from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta
from app.schemas.dashboard import DashboardSummaryResponse, CategoryTotal, MonthlyTotal
from app.services.currency_service import currency_converter
from app.crud.receipt import get_user_receipts
from app.db.models import ReceiptStatus
import logging

logger = logging.getLogger(__name__)


async def get_dashboard_summary(
    db: AsyncSession,
    user_id: int,
    display_currency: str = "ILS"
) -> DashboardSummaryResponse:

    all_receipts = await get_user_receipts(db, user_id=user_id, skip=0, limit=1000)
    if not all_receipts:
        return DashboardSummaryResponse(
            total_receipts=0,
            total_tracked=0.0,
            this_month_spent=0.0,
            last_month_spent=0.0,
            approved_this_month_count=0,
            pending_review_count=0,
            biggest_receipt_merchant=None,
            biggest_receipt_amount=None,
            biggest_receipt_date=None,
            avg_receipt_amount=0.0,
            category_breakdown=[],
            monthly_chart_data=[]
        )

    approved_receipts = [r for r in all_receipts if r.status == ReceiptStatus.APPROVED]
    pending_receipts = [r for r in all_receipts if r.status == ReceiptStatus.REVIEW_NEEDED]

    this_month_spent = 0.0
    last_month_spent = 0.0
    total_tracked = 0.0
    approved_this_month = 0
    max_receipt = None
    max_price = 0.0

    category_sums = {}
    monthly_sums = {}

    now = datetime.now()
    current_month_prefix = _get_month_prefix(now)
    first_day_of_current = now.replace(day=1)
    prev_month_date = first_day_of_current - timedelta(days=1)
    prev_month_prefix = _get_month_prefix(prev_month_date)

    for receipt in approved_receipts:
        raw_amount = float(receipt.total_amount or 0)

        receipt_currency = receipt.currency.value if hasattr(receipt.currency, 'value') else str(receipt.currency)
        converted_amount = await _convert_amount(raw_amount, receipt_currency, display_currency)

        total_tracked += converted_amount
        receipt_prefix = _get_month_prefix(receipt.receipt_date)

        if converted_amount > max_price:
            max_receipt = receipt
            max_price = converted_amount

        if receipt_prefix == current_month_prefix:
            this_month_spent += converted_amount
            approved_this_month += 1
        elif receipt_prefix == prev_month_prefix:
            last_month_spent += converted_amount

        cat_name = receipt.category.value if hasattr(receipt.category, 'value') else str(receipt.category or "Other")
        category_sums[cat_name] = category_sums.get(cat_name, 0.0) + converted_amount

        monthly_sums[receipt_prefix] = monthly_sums.get(receipt_prefix, 0.0) + converted_amount

    avg_receipt = (this_month_spent / approved_this_month) if approved_this_month > 0 else 0.0

    category_breakdown_list = [CategoryTotal(name=k, value=round(v, 2)) for k, v in category_sums.items()]
    monthly_history_list = [MonthlyTotal(month=k, total=round(v, 2)) for k, v in sorted(monthly_sums.items())]

    return DashboardSummaryResponse(
        total_receipts=len(all_receipts),
        total_tracked=round(total_tracked, 2),
        this_month_spent=round(this_month_spent, 2),
        last_month_spent=round(last_month_spent, 2),
        approved_this_month_count=approved_this_month,
        pending_review_count=len(pending_receipts),
        biggest_receipt_merchant=max_receipt.merchant_name if max_receipt else None,
        biggest_receipt_amount=round(max_price, 2) if max_receipt else None,
        biggest_receipt_date=str(max_receipt.receipt_date) if max_receipt else None,
        avg_receipt_amount=round(avg_receipt, 2),
        category_breakdown=category_breakdown_list,
        monthly_chart_data=monthly_history_list
    )


async def _convert_amount(amount: float, from_currency: str, to_currency: str) -> float:
    """Convert amount between ILS and USD using the currency_converter singleton."""
    if from_currency == to_currency:
        return amount

    try:
        rate = await currency_converter.get_exchange_rate(from_currency, to_currency)
        return amount * rate
    except Exception as e:
        logger.warning(f"Currency conversion failed ({from_currency} → {to_currency}): {e}. Returning original amount.")
        return amount


def _get_month_prefix(date_obj) -> str:
    if not date_obj:
        return "Unknown"
    return date_obj.strftime("%Y-%m")