import os
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.security import create_access_token, get_password_hash
from app.db.database import Base, get_db
from app.db.models import User
from app.main import app

# --- In-memory SQLite for test isolation ---
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)


# --- Create / drop all tables per test ---
@pytest.fixture(autouse=True)
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# --- Override the app's DB dependency to use the test database ---
async def override_get_db():
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


# --- Prevent the real OCR pipeline from running during API tests ---
@pytest.fixture(autouse=True)
def mock_ai_pipeline():
    with patch("app.api.receipts.process_receipt_task", new_callable=AsyncMock):
        yield


# --- Seed a test user directly in the DB and return auth headers ---
@pytest.fixture
async def user_a():
    async with TestSessionLocal() as db:
        user = User(
            email_address="usera@test.com",
            hashed_password=get_password_hash("Password1"),
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user


@pytest.fixture
async def user_b():
    async with TestSessionLocal() as db:
        user = User(
            email_address="userb@test.com",
            hashed_password=get_password_hash("Password1"),
            is_active=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user


@pytest.fixture
async def auth_headers_a(user_a):
    token = create_access_token({"sub": user_a.email_address})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def auth_headers_b(user_b):
    token = create_access_token({"sub": user_b.email_address})
    return {"Authorization": f"Bearer {token}"}


# --- Async HTTP client wired to the FastAPI app ---
@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# --- Path to test receipt images ---
ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets", "test_receipts")
