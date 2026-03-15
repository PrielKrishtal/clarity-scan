<div align="center">

<img src="assets/logo.png" alt="ClarityScan Logo" width="360"/>

### AI-Powered Receipt Management — OCR · Computer Vision · Expense Analytics

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

Upload an image of a receipt → **OpenCV** preprocesses and deskews the image → **PaddleOCR** extracts the text → the parsing pipeline identifies merchant, amount and date→ the data lands in your expense dashboard, ready for tracking, analysis, and CSV export. If the OCR makes a mistake, users review and correct it before final approval. The entire pipeline is async and non-blocking.

---

## Technical Highlights

**Non-Blocking OCR Pipeline**  
Upload requests return `202 Accepted` immediately. OCR runs as a FastAPI `BackgroundTask` — the server never blocks on processing. Receipts move through a typed finite state machine enforced at the database level:

```
UPLOADED → PROCESSING → REVIEW_NEEDED → APPROVED
                                      ↘ FAILED
```

**Computer Vision Preprocessing**  
Raw receipt photos are poor OCR input. Before PaddleOCR sees a single character, OpenCV runs a multi-step preprocessing pipeline: Gaussian blur → Otsu thresholding → contour detection → perspective correction via 4-corner homography.
This step is what makes OCR on real-world, skewed, low-light photos reliable.

| Step | Technique |
|---|---|
| Noise reduction | Gaussian blur |
| Binarization | Otsu thresholding |
| Receipt boundary detection | Contour approximation + minAreaRect fallback |
| Deskew & crop | 4-point perspective transform |

**OCR Intelligence**  
After text extraction, the pipeline applies several parsing layers before storing any data:
- **Confidence filtering** — results below 0.3 confidence are discarded before parsing
- **Expanded keyword matching** — catches `Total`, `Amount Due`, `Balance Due`, `Grand Total` across formats
- **Smart fallback** — if no keyword matches, scans backwards from the receipt bottom skipping tax/change lines
- **Multi-locale price parsing** — handles both `1,234.56` (US) and `1.234,56` (European) decimal formats
- **Multi-format date parsing** — tries 6 date formats until one succeeds
- **Tax auto-calculation** — derived automatically as `total − subtotal`; never entered manually

**Security & Auth**
- JWT authentication — every endpoint scopes queries to the authenticated user; cross-user access is impossible at the DB layer
- Passwords hashed with Argon2 via `passlib`
- File uploads validated with `python-magic` (reads first 2048 bytes to verify real MIME type, not just extension) — prevents disguised file attacks
- Files written to disk non-blocking via `aiofiles`
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
| Image Processing | OpenCV |
| OCR | PaddleOCR (PP-OCRv4) |
| Auth | JWT, passlib (Argon2), slowapi |
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Containerization | Docker, Docker Compose |
| CI | GitHub Actions |
| Linting | ruff |
| Testing | pytest, pytest-asyncio |

---

## Features

**Receipt Pipeline**
- 📂 Drag-and-drop or file-select image upload with live status feedback
- 🤖 Automatic extraction of merchant name, total, tax, date, and category via OCR
- ✏️ Side-by-side review UI — original image alongside extracted fields for correction
- ✅ Approve with a single click; approved receipts are locked and tracked
- 📝 Manual entry form for receipts without images — saved directly as `APPROVED`

**Expense Dashboard**
- 📊 6-month bar chart of approved spending, derived from real receipt data
- 🍩 Category donut chart for current month breakdown
- 💰 Monthly budget tracker with color-coded progress bar (teal → amber → red)
- 🔍 Insight cards: top category, biggest receipt, average receipt, month-over-month delta
- 💡 Daily rotating financial tip (30 tips, cycles by day of month)

**Receipts Page**
- 🔎 Search by merchant name, filter by date range and status
- 📥 CSV export of all filtered receipts
- 📄 Paginated table with status badges and per-receipt detail view

**Auth**
- JWT login/register with per-user data isolation enforced at the query layer
- Password confirmation on registration, show/hide toggle, client-side validation

---

## Testing

**12 pytest tests** — 6 API/auth flows, 3 FSM state transitions, 2 RBAC isolation, 1 CV pipeline — run against in-memory SQLite with the OCR pipeline mocked, no GPU or real database required.

OCR accuracy validated against **13 real-world receipt images** in `tests/assets/test_receipts/` — including flat scans, crumpled photos, dark backgrounds, partial crops, and mixed-layout formats. Images sourced from public sources for testing purposes only; all rights belong to their respective owners.

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
│   ├── api/              # FastAPI route handlers (auth, receipts)
│   ├── core/             # Config, JWT security, rate limiter
│   ├── crud/             # Database query layer
│   ├── db/               # SQLAlchemy models & async engine
│   ├── schemas/          # Pydantic request/response schemas
│   └── services/         # AI processor (OpenCV + PaddleOCR pipeline)
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
│       ├── pages/        # Route-level page components
│       └── data/         # Static data (financial tips)
├── docker-compose.yml
└── .github/workflows/    # CI pipeline
```

---

<div align="center">

Built by [Priel Krishtal](https://www.linkedin.com/in/prielkrishtal) · 2026

</div>