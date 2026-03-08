<div align="center">

<img src="YOUR_LOGO_URL_HERE" alt="ClarityScan Logo" width="380"/>

### Smart Receipt Management — Powered by OCR & Computer Vision

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-async-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://docker.com)
[![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=flat&logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

</div>

---

## What is ClarityScan?

ClarityScan is a fullstack SaaS platform that turns a photo of a receipt into structured financial data — automatically.

Photograph a receipt → the system preprocesses the image with **OpenCV**, extracts text with **EasyOCR**, and stores the data ready for expense tracking and tax reporting. If the AI makes a mistake, the user corrects it before final approval. No manual entry, no spreadsheets.

---

## Architecture Overview

**Async Upload Pipeline**  
Upload requests return `202 Accepted` immediately. OCR processing runs as a background task via FastAPI `BackgroundTasks`, keeping the server non-blocking. The client polls a status endpoint until processing completes.

**Receipt Lifecycle — Finite State Machine**  
Receipt state is enforced at the database level to prevent logical inconsistencies and ensure UI accuracy.
```
UPLOADED → PROCESSING → REVIEW_NEEDED → APPROVED
                                      ↘ FAILED
```

**Image Preprocessing Pipeline**  
Receipt photos vary significantly in quality. OpenCV applies deskewing, noise reduction, and contrast normalization before the image reaches EasyOCR. This preprocessing step is critical — OCR accuracy on raw, unprocessed photos is substantially lower.

**Authentication & Authorization**  
JWT-based auth with short-lived Access Tokens and long-lived Refresh Token rotation (`python-jose`). Credentials stored using Argon2/Bcrypt hashing (`passlib`). RBAC enforced at the API layer — users are scoped strictly to their own data.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.10+, FastAPI (async) |
| Database | PostgreSQL + SQLAlchemy Async ORM |
| Validation | Pydantic |
| Image Processing | OpenCV |
| OCR | EasyOCR |
| Auth | JWT (python-jose) + passlib |
| Frontend | React 18 + Vite + Tailwind CSS |
| Containerization | Docker + Docker Compose |
| CI | GitHub Actions |
| Logging | structlog (structured JSON) |

---

## Features

- 📷 **Live Camera Capture** — photograph receipts directly from mobile via HTML5 Camera API
- 🤖 **Automatic Data Extraction** — amount, merchant name, date, category
- ✏️ **Correction UI** — review and fix OCR errors before finalizing
- 📊 **Expense Dashboard** — monthly breakdown by category with charts
- 📥 **CSV Export** — export all approved receipts
- 🔒 **JWT Authentication** — secure login with refresh token rotation

---

## Getting Started

---

## Project Structure

```
clarity-scan/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers
│   │   ├── core/         # Config, security, JWT
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   └── cv/           # OpenCV + EasyOCR pipeline
│   ├── tests/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   └── Dockerfile
├── docker-compose.yml
└── .github/workflows/ci.yml
```




<div align="center">

Built by [Priel Krishtal](https://www.linkedin.com/in/prielkrishtal) · 2026

</div>
