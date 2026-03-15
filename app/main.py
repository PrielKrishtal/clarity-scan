from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from fastapi.middleware.cors import CORSMiddleware
from app.api import receipts, auth
from app.core.limiter import limiter

app = FastAPI(
    title="ClarityScan API",
    description="Backend for the ClarityScan Expense Management SaaS",
    version="1.0.0",
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    # Add your Vercel URL here after deploying frontend, e.g.:
    # "https://clarityscan.vercel.app",
]

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

# Note: StaticFiles removed — images are now served via Supabase Storage signed URLs


@app.get("/health")
async def health_check():
    """
    Sanity check endpoint to verify the API is running.
    """
    return {"status": "ok", "message": "ClarityScan API is up and running!"}