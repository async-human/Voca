from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.legacy import legacy
from app.api.v1.auth import router as auth_router
from app.api.v1.delivery import router as delivery_router
from app.api.v1.router import router as v1_router
from app.config import settings
from app.services.scheduler import start_scheduler, stop_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="Vokal API",
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    logger.exception("Unhandled API error")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.include_router(v1_router)
app.include_router(auth_router)
app.include_router(delivery_router)
app.include_router(legacy)


@app.get("/")
def health():
    return {
        "ok": True,
        "service": "vokal-api",
        "version": "3.1.0",
        "auth": "google-jwt",
        "auth_routes": ["/api/v1/auth/google/start", "/api/v1/auth/google/complete"],
    }
