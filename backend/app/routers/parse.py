"""AliExpress parsing endpoint — protected, admins only."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from ..config import settings
from ..deps import get_current_user
from ..models import User
from ..parser.aliexpress import scrape
from ..schemas import ParseRequest, ParseResponse

logger = logging.getLogger("ethereal.parse")

router = APIRouter(prefix="/parse", tags=["parse"])


# NOTE: declared with `def` (not `async def`) on purpose. The parser uses
# Playwright's *sync* API, which cannot run inside the event loop; FastAPI runs
# sync endpoints in a threadpool, so the blocking scrape is safe here.
@router.post("", response_model=ParseResponse)
def parse(body: ParseRequest, _: User = Depends(get_current_user)):
    if not body.url.startswith("http"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="url must be an absolute http(s) AliExpress search URL",
        )
    try:
        products = scrape(
            body.url,
            pages=body.pages,
            headless=settings.parser_headless,
            no_sandbox=settings.parser_no_sandbox,
        )
    except Exception as exc:  # Playwright/network failures -> 502 with the reason
        # Log the full traceback to the server console so the operator can see
        # the real cause (missing browser, network block, timeout, …); the HTTP
        # response only carries a one-line summary.
        logger.exception("Parser failed for url=%s pages=%s", body.url, body.pages)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Parser failed: {type(exc).__name__}: {exc}",
        ) from exc
    return ParseResponse(count=len(products), products=products)
