import logging
import re

import cv2
import easyocr
import numpy as np
from fastapi.concurrency import run_in_threadpool

from app.crud import receipt as crud_receipt
from app.db.database import AsyncSessionLocal
from app.db.models import ReceiptStatus
from app.schemas.receipt import ReceiptUpdate
from datetime import datetime, date, timezone

# Force DEBUG on this specific logger regardless of uvicorn's root config
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

class ReceiptScanner:
    def __init__(self):
        self.reader = easyocr.Reader(['en'])

    def _order_points(self,corners_lst):
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
    
    def _clean_price_string(self,raw_str: str) -> float:
        # strip everything except the actual number characters
        cleaned = re.sub(r'[^\d.,]', '', raw_str)
        
        last_comma = cleaned.rfind(',')
        last_dot = cleaned.rfind('.')
        last_sep_index = max(last_comma, last_dot)
        
        # standard price format: rightmost separator followed by exactly 2 digits
        if last_sep_index == len(cleaned) - 3:
            
            integer_part = cleaned[:last_sep_index]
            decimal_part = cleaned[last_sep_index + 1:]
            
            integer_part = integer_part.replace(',', '').replace('.', '')
            
            return float(f"{integer_part}.{decimal_part}")
            
        else:
            # no clear decimal found, just strip all separators and hope for the best
            return float(cleaned.replace(',', '').replace('.', ''))


    def _extract_total_amount(self,text_list: list[str]) -> float | None:
        price_pattern = r'[\d,]+\s*[.,]\s*\d{2}' 
        
        for i, line in enumerate(text_list):
            if re.search(r'tota', line, re.IGNORECASE) and not re.search(r'sub', line, re.IGNORECASE):
                # price sometimes appears on the next line, so we look ahead a few rows
                for j in range(i, min(i + 4, len(text_list))):
                    matches = re.findall(price_pattern, text_list[j])
                    if matches:
                        return self._clean_price_string(matches[0])
        return None



    def _extract_subtotal_amount(self,text_list: list[str]) -> float | None:
        price_pattern = r'[\d,]+\s*[.,]\s*\d{2}'
        
        for i, line in enumerate(text_list):
            if re.search(r'sub\s*tota', line, re.IGNORECASE):
                matches = re.findall(price_pattern, line)
                if matches:
                    return self._clean_price_string(matches[-1])
                
                for j in range(i + 1, min(i + 4, len(text_list))):
                    next_line = text_list[j]
                    if re.search(r'tax|tota', next_line, re.IGNORECASE):
                        break
                    matches = re.findall(price_pattern, next_line)
                    if matches:
                        return self._clean_price_string(matches[-1])
        return None


    def _extract_company_name(self,text_list: list[str]) -> str:
        ignore_words = ['receipt', 'win', 'survey', 'chance', 'welcome', 'customer', 'id', 'save', 'money']
        
        for line in text_list[:10]:
            clean_line = line.strip()
            
            if len(clean_line) < 4:
                continue
                
            # phone numbers, zip codes, store IDs — skip anything number-heavy
            digits_count = sum(c.isdigit() for c in clean_line)
            if digits_count > 2:
                continue
                
            line_lower = clean_line.lower()
            if any(word in line_lower for word in ignore_words):
                continue
                
            
            return clean_line
            
        return "Unknown Company"


    def _extract_date(self,text_list: list[str]) -> date | None:
        date_pattern = r'\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b'
        
        formats_to_try = [
            "%m/%d/%y",   # 11/13/17
            "%m/%d/%Y",   # 11/13/2017
            "%d/%m/%Y",   # 13/11/2017
            "%d-%m-%Y",   # 13-11-2017
            "%Y-%m-%d",   # 2017-11-13
            "%Y.%m.%d",   # 2017.11.13
        ]
        
        for line in text_list:
            matches = re.findall(date_pattern, line)
            if matches:
                raw = matches[0]
                for fmt in formats_to_try:
                    try:
                        return datetime.strptime(raw, fmt).date()
                    except ValueError:
                        continue
        return None
    

    def scan(self, image_path: str) -> dict:        
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Failed to load image. File may be corrupted or missing at: {image_path}")
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        blur = cv2.GaussianBlur(gray, (5, 5), 0)

        # Otsu figures out the threshold automatically — works well for paper on a table
        _, thresh_blob = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        contours, _ = cv2.findContours(thresh_blob, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

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

        dest_points = np.float32([[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]])
        ordered_corners = np.float32(ordered_corners)
        transform_matrix = cv2.getPerspectiveTransform(ordered_corners, dest_points)
        aligned_image = cv2.warpPerspective(img, transform_matrix, (int(width), int(height)))


        gray_aligned = cv2.cvtColor(aligned_image, cv2.COLOR_BGR2GRAY)
        
        result = self.reader.readtext(gray_aligned)

        # drop anything the OCR model wasn't confident about
        clean_text_list = [item[1] for item in result if item[2] > 0.3]

        final_total = self._extract_total_amount(clean_text_list)
        subtotal = self._extract_subtotal_amount(clean_text_list)
        company = self._extract_company_name(clean_text_list)
        receipt_date = self._extract_date(clean_text_list)
        if final_total and subtotal:
            calculated_tax = round(final_total - subtotal, 2)
        else:
            calculated_tax = None

        return {
                "merchant_name": company,
                "total_amount": final_total,
                "tax_amount": calculated_tax,
                "receipt_date": receipt_date
            }
        
            


async def process_receipt_task(receipt_id: str, user_id: int):
    """
    Background task to process an uploaded receipt image.
    Creates an independent DB session, runs the OCR, and updates the DB.
    """
    logger.debug(f"process_receipt_task STARTED — receipt_id={receipt_id} user_id={user_id}")
    async with AsyncSessionLocal() as db:
        try:
            receipt = await crud_receipt.get_receipt_by_id(db, receipt_id, user_id)
            if not receipt:
                logger.error(f"Receipt {receipt_id} not found in DB.")
                return
            receipt.status = ReceiptStatus.PROCESSING
            await db.commit()

            scan_results = await run_in_threadpool(receipt_scanner.scan, receipt.image_path)
            
            update_data = ReceiptUpdate(**scan_results)
            receipt.status = ReceiptStatus.REVIEW_NEEDED
            receipt.processed_at = datetime.now(timezone.utc)
            await crud_receipt.update_user_receipt(db=db, db_receipt=receipt, update_data=update_data)

        except Exception as e:
            logger.exception(f"Failed to process receipt {receipt_id}: {str(e)}")
            if 'receipt' in locals() and receipt:
                receipt.status = ReceiptStatus.FAILED
                await db.commit()



receipt_scanner = ReceiptScanner()
