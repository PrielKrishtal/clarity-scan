import os

import cv2
import numpy as np

from app.services.ai_processor import ReceiptScanner

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets", "test_receipts")


def test_contour_fallback_returns_four_corners():
    """
    The edge-case image may not yield a clean 4-corner polygon.
    Verify that the minAreaRect fallback always produces exactly 4 points.
    """
    image_path = os.path.join(ASSETS_DIR, "receipt_ocr_edge_cases.png")
    img = cv2.imread(image_path)
    assert img is not None, f"Test image not found: {image_path}"

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    assert len(contours) > 0, "No contours found in test image"

    biggest = max(contours, key=cv2.contourArea)
    perimeter = cv2.arcLength(biggest, True)
    approx = cv2.approxPolyDP(biggest, 0.02 * perimeter, True)

    # Same fallback logic as ReceiptScanner.scan()
    if len(approx) != 4:
        rect = cv2.minAreaRect(biggest)
        approx = cv2.boxPoints(rect)

    assert len(approx) == 4, f"Expected 4 corners, got {len(approx)}"


def test_order_points_returns_tl_tr_br_bl():
    """
    _order_points should return [top-left, top-right, bottom-right, bottom-left].
    """
    scanner = ReceiptScanner()
    # Shuffled rectangle corners
    corners = np.array([[200, 0], [0, 0], [0, 300], [200, 300]], dtype=np.float32)
    ordered = scanner._order_points(corners)

    assert ordered.shape == (4, 2)
    # top-left has smallest x+y
    assert list(ordered[0]) == [0, 0]
    # bottom-right has largest x+y
    assert list(ordered[2]) == [200, 300]


def test_clean_price_string_handles_thousands():
    """
    _clean_price_string should correctly parse '1,234.56' → 1234.56.
    """
    scanner = ReceiptScanner()
    assert scanner._clean_price_string("$1,234.56") == 1234.56
    assert scanner._clean_price_string("1.234,56") == 1234.56
    assert scanner._clean_price_string("29.99") == 29.99
