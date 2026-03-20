# app/services/ocr_config.py

# Positive labels for final total amount
TOTAL_KEYWORDS = [
    r"total", r"amount\s*due", r"balance\s*due", r"grand\s*total", r"payment", r"final",
    r"סה[\"״]כ", r"לתשלום", r"סך\s*הכל", r"סכום\s*סופי", r"חשבון\s*סופי", r"סך\s*התשלום"
]


TAX_KEYWORDS = [
    r"tax", r"vat", r"מע[\"״]מ", r"מעמ"
]


SUBTOTAL_KEYWORDS = [
    r"sub\s*tota", r"סכום\s*ביניים", r"לפני\s*מע[\"״]מ", r"סה[\"״]כ\s*ללא\s*מע[\"״]מ", r"סכום",
    r"סכום\s*חייב\s*במע[\"״]מ", r"חייב\s*במע[\"״]מ"
]

# Words to ignore when identifying the merchant name
IGNORE_WORDS_BASE = [
    "receipt", "win", "survey", "chance", "welcome", "customer",
    "id", "save", "money", "street", "avenue", "ave", "road", "rd",
    "store", "manager", "cashier", "operator", "server",
    "חשבונית", "מס", "קבלה", "תודה", "שלום", "ביקור", "ניקוד", "לקוח",
    "שולחן", "ח.פ", "עוסק", "ע.מ", "מספר", "תאריך", "שעה", "טלפון", "פקס"
]

# Keywords used to skip irrelevant price lines during fallback search (bottom-up)
EXCLUDE_KEYWORDS = [
    r"tax", r"fee", r"change", r"cash", r"shipping",
    r"מע[\"״]מ", r"עודף", r"מזומן", r"משלוח", r"שירות"
]

# Words that disqualify a line from being the Grand Total
TOTAL_NEGATIVE_FILTERS = [
    r"sub", r"item", r"discount", r"saving", r"tax",
    r"מס", r"הנחה", r"ביניים", r"חיסכון",
    r"חייב", r"לפני"
]

# Keywords to stop look-ahead in subtotal (used in _extract_subtotal_amount)
SUBTOTAL_BREAK_KEYWORDS = [r"tax", r"total", r"מע[\"״]מ", r"סה[\"״]כ"]

CURRENCY_MAPPING = {
    "ILS": [r"₪", r"ש[\"״]ח", r"nis", r"ils", r"שקל"],
    "USD": [r"\$", r"usd", r"dollar"]
}