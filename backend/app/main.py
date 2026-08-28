import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import Base, engine
from app.api import auth, resume, jobs, misc
from app.agents.daily_agent import start_scheduler, stop_scheduler
from app.utils.rate_limit import limiter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("jobpilot")

# Create tables (SQLite for v1; swap DATABASE_URL for Postgres later — models are DB-agnostic)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="AI Resume Analyzer & Job Search Agent",
    version="1.0.0",
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Rate limiting ---
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please slow down and try again shortly."},
    )


# --- Routers ---
app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(jobs.router)
app.include_router(misc.router)


@app.on_event("startup")
def on_startup():
    start_scheduler()


@app.on_event("shutdown")
def on_shutdown():
    stop_scheduler()


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url)
    return JSONResponse(status_code=500, content={"detail": "An unexpected error occurred. Please try again."})


@app.get("/")
def root():
    return {"app": settings.APP_NAME, "status": "running", "docs": "/docs"}


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "ai_configured": bool(settings.LLM_API_KEY),
        "job_providers_configured": bool(settings.REMOTIVE_ENABLED or (settings.ADZUNA_APP_ID and settings.ADZUNA_APP_KEY)),
        "smtp_configured": bool(settings.SMTP_HOST and settings.SMTP_USERNAME),
    }
