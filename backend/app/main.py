"""FastAPI entrypoint for the Ethereal admin backend.

Run with:
    uvicorn app.main:app --reload    (from the backend/ directory)
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth import hash_password
from .config import settings
from .database import Base, SessionLocal, engine
from .models import Product, User
from .routers import auth as auth_router
from .routers import parse as parse_router
from .routers import products as products_router
from .seed_data import SEED_PRODUCTS


def init_db() -> None:
    """Create tables, ensure the bootstrap admin exists, and seed demo products."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == settings.admin_username).first()
        if existing is None:
            db.add(
                User(
                    username=settings.admin_username,
                    hashed_password=hash_password(settings.admin_password),
                )
            )
            db.commit()

        # Seed demo products only when the table is empty, so we never clobber
        # or duplicate cards the admin has already created.
        if db.query(Product).count() == 0:
            db.add_all(Product(**p) for p in SEED_PRODUCTS)
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Ethereal Admin API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=settings.cors_origin_regex or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(parse_router.router)
app.include_router(products_router.router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}
