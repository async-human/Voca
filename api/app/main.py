import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import me, recordings, waitlist

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Vokal API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(waitlist.router)
app.include_router(me.router)
app.include_router(recordings.router)


@app.get("/")
def health():
    return {"ok": True, "service": "voca-api", "version": "2.0.0"}
