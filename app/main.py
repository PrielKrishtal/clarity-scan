import os
import json
from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from fastapi.middleware.cors import CORSMiddleware
from app.api import receipts, auth, dashboard
from app.core.limiter import limiter

app = FastAPI(
    title="ClarityScan API",
    description="Backend for the ClarityScan Expense Management SaaS",
    version="1.0.0",
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://clarity-scan-three.vercel.app", 
]

env_origins = os.environ.get("BACKEND_CORS_ORIGINS")
if env_origins:
    try:
        origins = json.loads(env_origins)
    except Exception as e:
        print(f"Warning: Could not parse BACKEND_CORS_ORIGINS. Using default origins. Error: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(receipts.router)
app.include_router(auth.router)
app.include_router(dashboard.router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "ClarityScan API is up and running!"}


@app.get("/")
async def root():
    return {"message": "ClarityScan API is Live!", "documentation": "/docs"}