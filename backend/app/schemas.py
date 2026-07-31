"""Pydantic request/response models."""

from typing import Optional

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    username: str


class ParseRequest(BaseModel):
    url: str = Field(..., description="AliExpress /wholesale search URL to scrape")
    pages: int = Field(1, ge=1, le=20, description="How many pages to walk, starting at page 1")


class ParsedProduct(BaseModel):
    url: Optional[str] = None
    product_id: Optional[str] = None
    sku_id: Optional[str] = None
    title: Optional[str] = None
    price: Optional[float] = None
    old_price: Optional[float] = None
    discount: Optional[str] = None
    currency: Optional[str] = None
    rating: Optional[float] = None
    orders: Optional[int] = None
    delivery: Optional[str] = None
    images: list[str] = []


class ParseResponse(BaseModel):
    count: int
    products: list[ParsedProduct]


# ----- storefront products (persisted in the DB) -----

CATEGORIES = {"skincare", "makeup", "bodyhair"}


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    price: float = Field(..., ge=0)
    cat: str = Field(..., description="One of: skincare, makeup, bodyhair")
    desc: str = ""
    img: str = ""


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    # All optional so the admin can PATCH a subset of fields.
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    price: Optional[float] = Field(None, ge=0)
    cat: Optional[str] = None
    desc: Optional[str] = None
    img: Optional[str] = None


class ProductOut(ProductBase):
    id: int

    model_config = {"from_attributes": True}


class BulkProductCreate(BaseModel):
    products: list[ProductCreate]


class BulkDeleteRequest(BaseModel):
    ids: Optional[list[int]] = None
    all: bool = False


class BulkDeleteResult(BaseModel):
    deleted: int
