<div align="center">

<img src="assets/logo.png" alt="ClarityScan Logo" width="360"/>

### AI-Powered Receipt Management — OCR · Computer Vision · Multi-Currency Analytics

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-async-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-async-4169E1?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://docker.com)
[![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=flat&logo=githubactions&logoColor=white)](https://github.com/features/actions)

🔗 **[Live Demo](https://clarity-scan-three.vercel.app/)** &nbsp;·&nbsp; ⚠️ *Hosted on Render free tier — may take ~30s to wake up*

</div>

---

## Overview

ClarityScan is a fullstack SaaS application built with an async FastAPI backend, React 18 frontend, and a custom OCR pipeline — turning receipt images into structured, searchable financial data automatically.

Upload a receipt → **OpenCV** preprocesses and deskews the image → **Google Cloud Vision API** extracts the text → a custom heuristics engine parses the merchant, amount, tax, and currency → the data lands in a multi-currency expense dashboard. The architecture is designed for accuracy and scale: heavy aggregations and live exchange-rate conversions (ILS/USD) are handled entirely server-side, keeping the React client a pure presentation layer.

---

## Technical Highlights

**Non-Blocking OCR Pipeline**  
Upload requests return `202 Accepted` immediately. OCR runs as a FastAPI `BackgroundTask` — the server never blocks on processing. Receipts move through a typed finite state machine enforced at the database level:

```
UPLOADED → PROCESSING → REVIEW_NEEDED → APPROVED
                                      ↘ FAILED
```

**Computer Vision Preprocessing**  
Raw receipt photos are poor OCR input. Before Google Vision sees a single character, OpenCV runs a multi-step preprocessing pipeline: Gaussian blur → Otsu thresholding → contour detection → perspective correction via 4-corner homography. This step is what makes OCR on real-world, skewed, low-light photos reliable.

| Step | Technique |
|---|---|
| Noise reduction | Gaussian blur |
| Binarization | Otsu thresholding |
| Receipt boundary detection | Contour approximation + minAreaRect fallback |
| Deskew & crop | 4-point perspective transform |

**OCR Intelligence & Heuristics**  
After Google Vision extracts raw text, a custom Python heuristics engine applies several parsing layers — specifically tuned for bilingual (Hebrew/English) receipts:

- **Regex & negative filtering** — explicitly ignores tracking numbers, percentages (e.g. `18.00%`), and change/refund lines
- **Alpha-numeric merchant validation** — rejects corrupted headers (e.g. `*****`) and enforces letter-based merchant names
- **Smart fallbacks** — if no total keyword matches, scans backwards from the receipt bottom skipping tax and change lines
- **Multi-locale price parsing** — handles both `1,234.56` (US) and `1.234,56` (European) decimal formats
- **Tax sanity check** — mathematically derives missing tax as `total − subtotal`, but nullifies it automatically if the result exceeds the legal 18% VAT threshold, preventing DB corruption

**Backend-Driven Aggregation (Thin Client Architecture)**  
To support dynamic multi-currency reporting, the React frontend acts as a pure presentation layer. The FastAPI backend handles all heavy lifting:

- Live exchange rate fetching via the Frankfurter API, cached server-side for 24 hours
- Server-side conversion of individual receipts to prevent floating-point rounding loss
- Centralized generation of chart data, summary cards, and insight metrics

**Security & Auth**
- JWT authentication — every endpoint scopes queries to the authenticated user; cross-user access is impossible at the DB layer
- Passwords hashed with Argon2 via `passlib`; registration enforces confirmation + client-side validation
- File uploads validated with `python-magic` (reads first 2048 bytes to verify real MIME type, not just extension) — prevents disguised file attacks
- Login rate-limited to 5 requests/minute per IP via `slowapi`

**Data & Infrastructure**
- All monetary values stored as `Numeric(10, 2)` — never `float`; exact decimal representation to the cent
- Fully async database layer using SQLAlchemy `AsyncSession` — no thread blocking anywhere in the stack
- Schema migrations managed with Alembic
- `ruff` linting enforced on every push via GitHub Actions — pipeline fails on any linting error

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, FastAPI (async) |
| Database | PostgreSQL, SQLAlchemy Async ORM, Alembic |
| Validation | Pydantic v2 |
| Image Processing | OpenCV, NumPy |
| AI / OCR | Google Cloud Vision API |
| External APIs | Frankfurter API (live exchange rates) |
| Auth | JWT, passlib (Argon2), slowapi |
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Containerization | Docker, Docker Compose |
| CI | GitHub Actions |
| Linting | ruff |
| Testing | pytest, pytest-asyncio |

---

## Features

**Receipt Pipeline**
- 📂 Drag-and-drop or file-select image upload with live non-blocking status feedback
- 🤖 Automatic extraction of merchant name, total, tax, date, and currency via OCR
- ✏️ Side-by-side review UI — original image alongside extracted fields for correction before data hits the ledger
- ✅ Approve with a single click; approved receipts are locked and tracked
- 📝 Manual entry form for receipts without images — saved directly as `APPROVED`

**Multi-Currency Expense Dashboard**
- 💱 Real-time ILS/USD toggle — converts the entire dashboard instantly using live exchange rates
- 📊 6-month bar chart of approved spending, derived from real receipt data
- 🍩 Category donut chart for current month breakdown
- 💰 Dynamic monthly budget tracker — calculates remaining % mathematically regardless of display currency
- 🔍 Insight cards: top category, biggest receipt, average receipt, month-over-month delta
- 💡 Daily rotating financial tip (30 tips, cycles by day of month)

**Receipts Page**
- 🔎 Search by merchant name, filter by date range and status
- 📥 CSV export of all filtered receipts
- 📄 Paginated table with status badges and per-receipt detail view

---

## Testing

**12 pytest tests** — 6 API/auth flows, 3 FSM state transitions, 2 RBAC isolation, 1 CV pipeline — run against in-memory SQLite with the OCR pipeline mocked, no GPU or real database required.

OCR accuracy validated against **13 real-world receipt images** in `tests/assets/test_receipts/` — including flat scans, crumpled photos, dark backgrounds, partial crops, and mixed Hebrew/English layouts.

---

## Screenshots

| Dashboard | Receipt Review |
|---|---|
| ![Dashboard](assets/screenshots/dashboard.png) | ![Review](assets/screenshots/review.png) |

| Receipts List | Upload Modal |
|---|---|
| ![Receipts](assets/screenshots/receipts.png) | ![Upload](assets/screenshots/upload.png) |

---

## Project Structure

```
clarity-scan/
├── app/
│   ├── api/              # FastAPI route handlers (auth, receipts, dashboard)
│   ├── core/             # Config, JWT security, rate limiter, storage
│   ├── crud/             # Database query layer
│   ├── db/               # SQLAlchemy models & async engine
│   ├── schemas/          # Pydantic request/response schemas
│   └── services/         # Business logic (OCR pipeline, currency, dashboard)
├── alembic/              # Database migrations
├── tests/
│   ├── assets/
│   │   └── test_receipts/  # Real-world receipt images for OCR validation
│   └── ...               # pytest test suite
├── frontend/
│   └── src/
│       ├── api/          # Axios client + endpoint functions
│       ├── components/   # Shared UI components
│       ├── context/      # Auth context (JWT state)
│       ├── hooks/        # Custom React hooks
│       ├── pages/        # Route-level page components (thin client)
│       └── data/         # Static data (financial tips)
├── docker-compose.yml
└── .github/workflows/    # CI pipeline
```

---

<div align="center">

Built by [Priel Krishtal](https://www.linkedin.com/in/prielkrishtal) · 2026

</div>