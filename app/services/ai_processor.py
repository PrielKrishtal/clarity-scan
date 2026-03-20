import logging
import os
import re
import tempfile
import cv2
import numpy as np
from google.cloud import vision
from fastapi.concurrency import run_in_threadpool
from app.crud import receipt as crud_receipt
from app.db.database import AsyncSessionLocal
from app.db.models import ReceiptStatus
from app.schemas.receipt import ReceiptUpdate
from app.core.storage import download_file
from datetime import datetime, date, timezone
from app.services.ocr_config import (
    TOTAL_KEYWORDS, SUBTOTAL_KEYWORDS, IGNORE_WORDS_BASE, 
    EXCLUDE_KEYWORDS, TOTAL_NEGATIVE_FILTERS, SUBTOTAL_BREAK_KEYWORDS,
    TAX_KEYWORDS
)

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class ReceiptScanner:
    def __init__(self):
        self.client = vision.ImageAnnotatorClient()
        # Compiled patterns for optimal performance
        self.total_pattern = re.compile("|".join(TOTAL_KEYWORDS), re.IGNORECASE)
        self.subtotal_pattern = re.compile("|".join(SUBTOTAL_KEYWORDS), re.IGNORECASE)
        self.exclude_pattern = re.compile("|".join(EXCLUDE_KEYWORDS), re.IGNORECASE)
        self.total_negative_pattern = re.compile("|".join(TOTAL_NEGATIVE_FILTERS), re.IGNORECASE)
        self.subtotal_break_pattern = re.compile("|".join(SUBTOTAL_BREAK_KEYWORDS), re.IGNORECASE)
        self.tax_pattern = re.compile("|".join(TAX_KEYWORDS), re.IGNORECASE)

    def _order_points(self, corners_lst):
        pts = corners_lst.reshape((4, 2))

        sums = np.sum(pts, axis=1)

        top_left_index = np.argmin(sums)
        top_left = pts[top_left_index]

        bottom_right_index = np.argmax(sums)
        bottom_right = pts[bottom_right_index]

        # x - y gives us the other two corners
        diffs = np.diff(pts, axis=1).flatten()

        top_right_index = np.argmin(diffs)
        top_right = pts[top_right_index]

        bottom_left_index = np.argmax(diffs)
        bottom_left = pts[bottom_left_index]

        return np.array([top_left, top_right, bottom_right, bottom_left])

    def _clean_price_string(self, raw_str: str) -> float:
        # strip everything except the actual number characters
        cleaned = re.sub(r"[^\d.,]", "", raw_str)

        last_comma = cleaned.rfind(",")
        last_dot = cleaned.rfind(".")
        last_sep_index = max(last_comma, last_dot)

        # standard price format: rightmost separator followed by exactly 2 digits
        if last_sep_index == len(cleaned) - 3:
            integer_part = cleaned[:last_sep_index]
            decimal_part = cleaned[last_sep_index + 1:]
            integer_part = integer_part.replace(",", "").replace(".", "")
            return float(f"{integer_part}.{decimal_part}")
        else:
            # no clear decimal found, just strip all separators and hope for the best
            return float(cleaned.replace(",", "").replace(".", ""))

    def _extract_total_amount(self, text_list: list[str]) -> float | None:
        price_pattern = r"[\d,]+\s*[.,]\s*\d{1,2}(?!\s*%)"

        for i, line in enumerate(text_list):
            if self.total_pattern.search(line) and not self.total_negative_pattern.search(line):
                for j in range(i, min(i + 6, len(text_list))):
                    matches = re.findall(price_pattern, text_list[j])
                    if matches:
                        return self._clean_price_string(matches[-1])

        for line in reversed(text_list):
            if self.exclude_pattern.search(line):
                continue
            matches = re.findall(price_pattern, line)
            if matches:
                candidate = self._clean_price_string(matches[-1])
                if candidate > 0:
                    return candidate
        return None

    def _extract_subtotal_amount(self, text_list: list[str]) -> float | None:
        price_pattern = r"[\d,]+\s*[.,]\s*\d{1,2}(?!\s*%)"

        for i, line in enumerate(text_list):
            if self.subtotal_pattern.search(line):
                matches = re.findall(price_pattern, line)
                if matches:
                    return self._clean_price_string(matches[-1])

                for j in range(i + 1, min(i + 4, len(text_list))):
                    next_line = text_list[j]
                    if self.subtotal_break_pattern.search(next_line):
                        break
                    matches = re.findall(price_pattern, next_line)
                    if matches:
                        return self._clean_price_string(matches[-1])
        return None
    


    def _extract_company_name(self, text_list: list[str]) -> str:
        ignore_words = IGNORE_WORDS_BASE
        for line in text_list[:10]:
            clean_line = line.strip()
            
            # Aggressive validation: length > 3, max 2 digits, must contain letters (Hebrew or English)
            if len(clean_line) < 4 or sum(c.isdigit() for c in clean_line) > 2:
                continue
            if not re.search(r'[a-zA-Zא-ת]{2,}', clean_line):
                continue
            if re.search(r'www\.|\.com|\.co', clean_line, re.IGNORECASE):
                continue
            if any(word in clean_line.lower() for word in ignore_words):
                continue
            return clean_line
        return "Unknown Company"

    def _extract_date(self, text_list: list[str]) -> date | None:
        date_pattern = r"\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b"
        formats = ["%d/%m/%y", "%d/%m/%Y", "%d-%m-%Y", "%d.%m.%y", "%d.%m.%Y", "%m/%d/%y", "%m/%d/%Y", "%Y-%m-%d"]
        
        for line in text_list:
            matches = re.findall(date_pattern, line)
            if matches:
                for fmt in formats:
                    try:
                        return datetime.strptime(matches[0], fmt).date()
                    except ValueError:
                        continue
        return None

    def _extract_tax_amount(self, text_list: list[str]) -> float | None:
        price_pattern = r"[\d,]+\s*[.,]\s*\d{1,2}(?!\s*%)"
        for line in text_list:
            # Look for explicit VAT/Tax labels defined in config
            if self.tax_pattern.search(line):
                matches = re.findall(price_pattern, line)
                if matches:
                    return self._clean_price_string(matches[-1])
        return None


    def _extract_currency(self, text_list: list[str]) -> str:
        from app.services.ocr_config import CURRENCY_MAPPING
        
        full_text = " ".join(text_list).lower()
        
        # Check for ILS keywords
        ils_pattern = re.compile("|".join(CURRENCY_MAPPING["ILS"]), re.IGNORECASE)
        if ils_pattern.search(full_text):
            return "ILS"
            
        # Check for USD keywords
        usd_pattern = re.compile("|".join(CURRENCY_MAPPING["USD"]), re.IGNORECASE)
        if usd_pattern.search(full_text):
            return "USD"
            
        # Fallback default currency
        return "ILS"
    

    def scan(self, image_filename: str) -> dict:
        """
        Downloads the image from Supabase Storage to a temp file,
        runs OCR, then cleans up the temp file.
        """
        # Download from Supabase into a temporary file
        image_bytes = download_file(image_filename)

        suffix = "." + image_filename.rsplit(".", 1)[-1]
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(image_bytes)
            tmp_path = tmp.name

        try:
            img = cv2.imread(tmp_path)
            if img is None:
                raise ValueError(f"Failed to decode image downloaded from Supabase: {image_filename}")

            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            blur = cv2.GaussianBlur(gray, (5, 5), 0)

            # Otsu figures out the threshold automatically — works well for paper on a table
            _, thresh_blob = cv2.threshold(
                blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
            )

            contours, _ = cv2.findContours(
                thresh_blob, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )

            biggest_contour = max(contours, key=cv2.contourArea)

            perimeter = cv2.arcLength(biggest_contour, True)
            epsilon = 0.02 * perimeter  # 2% tolerance
            approx_corners = cv2.approxPolyDP(biggest_contour, epsilon, True)

            # Fallback: If the contour doesn't yield exactly 4 corners (e.g., wrinkled receipt, fingers in frame),
            # force a minimum area bounding rectangle to mathematically guarantee exactly 4 corners.
            if len(approx_corners) != 4:
                rect = cv2.minAreaRect(biggest_contour)
                approx_corners = cv2.boxPoints(rect)

            # At this point, approx_corners is guaranteed to represent exactly 4 points.
            ordered_corners = self._order_points(approx_corners)

            width_top = np.linalg.norm(ordered_corners[0] - ordered_corners[1])
            width_bottom = np.linalg.norm(ordered_corners[2] - ordered_corners[3])
            width = max(width_top, width_bottom)  # Picks the larger number

            height_top = np.linalg.norm(ordered_corners[0] - ordered_corners[3])
            height_bottom = np.linalg.norm(ordered_corners[1] - ordered_corners[2])
            height = max(height_top, height_bottom)

            dest_points = np.float32(
                [[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]]
            )
            ordered_corners = np.float32(ordered_corners)
            transform_matrix = cv2.getPerspectiveTransform(ordered_corners, dest_points)
            aligned_image = cv2.warpPerspective(
                img, transform_matrix, (int(width), int(height))
            )

            _, encoded_image = cv2.imencode('.jpg', aligned_image)
            image_content = encoded_image.tobytes()
            vision_image = vision.Image(content=image_content)

            response = self.client.document_text_detection(image=vision_image)

            full_text = response.full_text_annotation.text
            clean_text_list = [line.strip() for line in full_text.split('\n') if line.strip()]

            final_total = self._extract_total_amount(clean_text_list)
            subtotal = self._extract_subtotal_amount(clean_text_list)
            company = self._extract_company_name(clean_text_list)
            receipt_date = self._extract_date(clean_text_list)
            detected_currency = self._extract_currency(clean_text_list)
            extracted_tax = self._extract_tax_amount(clean_text_list)
            
            if extracted_tax is not None:
                final_tax = extracted_tax
            elif final_total and subtotal and final_total >= subtotal: 
                final_tax = round(final_total - subtotal, 2)
            else:
                final_tax = None

            # VAT Sanity Check (Moved to the end): In Israel, VAT is currently 18%. 
            # Reject the FINAL calculated tax if it represents an impossible percentage (e.g., > 35%).
            if final_tax is not None and final_total and final_total > 0:
                if final_tax >= final_total or (final_tax / final_total) > 0.35:
                    final_tax = None

            return {
                "merchant_name": company,
                "total_amount": final_total,
                "tax_amount": final_tax,
                "currency": detected_currency,
                "receipt_date": receipt_date,
            }

        finally:
            os.unlink(tmp_path)


async def process_receipt_task(receipt_id: str, user_id: int):
    """
    Background task to process an uploaded receipt image.
    Creates an independent DB session, runs the OCR, and updates the DB.
    """
    logger.debug(
        f"process_receipt_task STARTED — receipt_id={receipt_id} user_id={user_id}"
    )
    async with AsyncSessionLocal() as db:
        try:
            receipt = await crud_receipt.get_receipt_by_id(db, receipt_id, user_id)
            if not receipt:
                logger.error(f"Receipt {receipt_id} not found in DB.")
                return
            receipt.status = ReceiptStatus.PROCESSING
            await db.commit()

            scan_results = await run_in_threadpool(
                receipt_scanner.scan, receipt.image_path
            )

            update_data = ReceiptUpdate(**scan_results)
            receipt.status = ReceiptStatus.REVIEW_NEEDED
            receipt.processed_at = datetime.now(timezone.utc)
            await crud_receipt.update_user_receipt(
                db=db, db_receipt=receipt, update_data=update_data
            )

        except Exception as e:
            logger.exception(f"Failed to process receipt {receipt_id}: {str(e)}")
            if "receipt" in locals() and receipt:
                receipt.status = ReceiptStatus.FAILED
                await db.commit()


receipt_scanner = ReceiptScanner()