import os
from tests.conftest import ASSETS_DIR


# --- Helper: valid receipt JSON for manual creation ---
VALID_RECEIPT = {
    "merchant_name": "Test Store",
    "total_amount": "29.99",
    "tax_amount": "2.50",
    "receipt_date": "2025-11-13",
}


# =====================================================================
#  1. CRUD — Manual Create (POST /receipts/)
# =====================================================================

async def test_create_manual_receipt_returns_201(client, auth_headers_a):
    response = await client.post("/receipts/", json=VALID_RECEIPT, headers=auth_headers_a)

    assert response.status_code == 201
    data = response.json()
    assert data["merchant_name"] == "Test Store"
    assert data["status"] == "APPROVED"


# =====================================================================
#  2. CRUD — Read All (GET /receipts/)
# =====================================================================

async def test_get_receipts_returns_list(client, auth_headers_a):
    # seed two receipts
    await client.post("/receipts/", json=VALID_RECEIPT, headers=auth_headers_a)
    await client.post("/receipts/", json=VALID_RECEIPT, headers=auth_headers_a)

    response = await client.get("/receipts/", headers=auth_headers_a)

    assert response.status_code == 200
    assert len(response.json()) == 2


# =====================================================================
#  3. CRUD — Read One (GET /receipts/{id})
# =====================================================================

async def test_get_single_receipt_returns_200(client, auth_headers_a):
    create_resp = await client.post("/receipts/", json=VALID_RECEIPT, headers=auth_headers_a)
    receipt_id = create_resp.json()["id"]

    response = await client.get(f"/receipts/{receipt_id}", headers=auth_headers_a)

    assert response.status_code == 200
    assert response.json()["id"] == receipt_id


# =====================================================================
#  4. CRUD — Delete (DELETE /receipts/{id})
# =====================================================================

async def test_delete_receipt_returns_204(client, auth_headers_a):
    create_resp = await client.post("/receipts/", json=VALID_RECEIPT, headers=auth_headers_a)
    receipt_id = create_resp.json()["id"]

    response = await client.delete(f"/receipts/{receipt_id}", headers=auth_headers_a)

    assert response.status_code == 204

    # confirm it's gone
    get_resp = await client.get(f"/receipts/{receipt_id}", headers=auth_headers_a)
    assert get_resp.status_code == 404


# =====================================================================
#  5. Security — No Auth Token → 401
# =====================================================================

async def test_no_auth_returns_401(client):
    response = await client.get("/receipts/")

    assert response.status_code == 401


# =====================================================================
#  6. Security — User A cannot see User B's receipts
# =====================================================================

async def test_user_a_cannot_see_user_b_receipts(client, auth_headers_a, auth_headers_b):
    # User A creates a receipt
    create_resp = await client.post("/receipts/", json=VALID_RECEIPT, headers=auth_headers_a)
    receipt_id = create_resp.json()["id"]

    # User B tries to access it
    response = await client.get(f"/receipts/{receipt_id}", headers=auth_headers_b)

    assert response.status_code == 404


# =====================================================================
#  7. Validation — Upload valid JPEG → 202
# =====================================================================

async def test_upload_jpeg_returns_202(client, auth_headers_a):
    image_path = os.path.join(ASSETS_DIR, "receipt_realistic_snapshot.jpg")
    with open(image_path, "rb") as f:
        response = await client.post(
            "/receipts/upload",
            files={"file": ("receipt.jpg", f, "image/jpeg")},
            headers=auth_headers_a,
        )

    assert response.status_code == 202
    assert response.json()["status"] == "UPLOADED"


# =====================================================================
#  8. Validation — Upload non-image file → 400
# =====================================================================

async def test_upload_non_image_returns_400(client, auth_headers_a):
    fake_txt = b"this is not an image"
    response = await client.post(
        "/receipts/upload",
        files={"file": ("evil.txt", fake_txt, "text/plain")},
        headers=auth_headers_a,
    )

    assert response.status_code == 400
    assert "image" in response.json()["detail"].lower()


# =====================================================================
#  9. FSM — Valid transition: REVIEW_NEEDED → APPROVED (200)
# =====================================================================

async def test_approve_review_needed_receipt_returns_200(client, auth_headers_a):
    # Create via upload to get UPLOADED status, then manually set to REVIEW_NEEDED
    # Easiest: use the DB directly via a helper. Instead, we create manually
    # and patch the status through the test DB.
    from tests.conftest import TestSessionLocal
    from app.db.models import Receipt, ReceiptStatus

    create_resp = await client.post("/receipts/", json=VALID_RECEIPT, headers=auth_headers_a)
    receipt_id = create_resp.json()["id"]

    # Force the receipt into REVIEW_NEEDED state via DB
    async with TestSessionLocal() as db:
        from sqlalchemy import update
        await db.execute(
            update(Receipt)
            .where(Receipt.id == receipt_id)
            .values(status=ReceiptStatus.REVIEW_NEEDED)
        )
        await db.commit()

    update_data = {"merchant_name": "Corrected Store"}
    response = await client.put(
        f"/receipts/{receipt_id}",
        json=update_data,
        headers=auth_headers_a,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "APPROVED"
    assert response.json()["merchant_name"] == "Corrected Store"


# =====================================================================
# 10. FSM — Blocked transition: UPLOADED → APPROVED (409)
# =====================================================================

async def test_approve_uploaded_receipt_returns_409(client, auth_headers_a):
    from tests.conftest import TestSessionLocal
    from app.db.models import Receipt, ReceiptStatus

    create_resp = await client.post("/receipts/", json=VALID_RECEIPT, headers=auth_headers_a)
    receipt_id = create_resp.json()["id"]

    # Force the receipt into UPLOADED state (simulating an upload path)
    async with TestSessionLocal() as db:
        from sqlalchemy import update
        await db.execute(
            update(Receipt)
            .where(Receipt.id == receipt_id)
            .values(status=ReceiptStatus.UPLOADED)
        )
        await db.commit()

    update_data = {"merchant_name": "Hacked Store"}
    response = await client.put(
        f"/receipts/{receipt_id}",
        json=update_data,
        headers=auth_headers_a,
    )

    assert response.status_code == 409


# =====================================================================
# 11. Validation — GET missing receipt → 404
# =====================================================================

async def test_get_nonexistent_receipt_returns_404(client, auth_headers_a):
    response = await client.get("/receipts/nonexistent-id-123", headers=auth_headers_a)

    assert response.status_code == 404


# =====================================================================
# 12. Security — Login rate limiting → 429 after 5 attempts
# =====================================================================

async def test_login_rate_limit_returns_429(client, user_a):
    login_data = {"username": "usera@test.com", "password": "WrongPassword"}

    for _ in range(5):
        await client.post("/auth/login", data=login_data)

    # 6th attempt should be blocked
    response = await client.post("/auth/login", data=login_data)
    assert response.status_code == 429
