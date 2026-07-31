"""Storefront product CRUD.

Reads are public (the storefront lists them); every mutation requires an
authenticated admin.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import Product, User
from ..schemas import (
    CATEGORIES,
    BulkDeleteRequest,
    BulkDeleteResult,
    BulkProductCreate,
    ProductCreate,
    ProductOut,
    ProductUpdate,
)

router = APIRouter(prefix="/products", tags=["products"])


def _validate_cat(cat: str) -> None:
    if cat not in CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"cat must be one of {sorted(CATEGORIES)}",
        )


def _get_or_404(db: Session, product_id: int) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.get("", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.id).all()


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    body: ProductCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    _validate_cat(body.cat)
    product = Product(**body.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.post("/bulk", response_model=list[ProductOut], status_code=status.HTTP_201_CREATED)
def create_products(
    body: BulkProductCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    for item in body.products:
        _validate_cat(item.cat)
    products = [Product(**item.model_dump()) for item in body.products]
    db.add_all(products)
    db.commit()
    for p in products:
        db.refresh(p)
    return products


@router.post("/bulk-delete", response_model=BulkDeleteResult)
def bulk_delete_products(
    body: BulkDeleteRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Delete many products at once: pass ``all: true`` to clear the whole
    catalogue, or ``ids: [...]`` to delete a specific selection."""
    if body.all:
        deleted = db.query(Product).delete(synchronize_session=False)
        db.commit()
        return BulkDeleteResult(deleted=deleted)
    if not body.ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide a non-empty 'ids' list or set 'all' to true",
        )
    deleted = (
        db.query(Product)
        .filter(Product.id.in_(body.ids))
        .delete(synchronize_session=False)
    )
    db.commit()
    return BulkDeleteResult(deleted=deleted)


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    body: ProductUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    product = _get_or_404(db, product_id)
    patch = body.model_dump(exclude_unset=True)
    if "cat" in patch and patch["cat"] is not None:
        _validate_cat(patch["cat"])
    for key, value in patch.items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    product = _get_or_404(db, product_id)
    db.delete(product)
    db.commit()
