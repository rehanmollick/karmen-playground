from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

from app.routes import schedule, change_order, risk, export, chat

app = FastAPI(
    title="Karmen Playground API",
    description="AI-powered construction scheduling demo",
    version="1.0.0",
)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
# Allow both the configured URL and common Vercel preview/production patterns
allowed_origins = [
    frontend_url,
    "http://localhost:3000",
    "http://localhost:3001",
    "https://karmen-playground.vercel.app",
]
# Also allow any Vercel preview deploys for this project
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://karmen-playground-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(schedule.router, prefix="/api")
app.include_router(change_order.router, prefix="/api")
app.include_router(risk.router, prefix="/api")
app.include_router(export.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "karmen-playground-api"}
