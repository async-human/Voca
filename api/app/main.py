import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.legacy import legacy
from app.api.v1.router import router as v1_router
from app.config import settings

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Vokal API", version="3.0.0", docs_url="/docs", redoc_url="/redoc")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router)
app.include_router(legacy)


@app.get("/")
def health():
    return {"ok": True, "service": "vokal-api", "version": "3.0.0"}
