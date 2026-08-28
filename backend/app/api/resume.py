import os
import uuid

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.models import User, Resume, CandidateProfile, Job
from app.schemas.schemas import (
    ResumeOut, CandidateProfileOut, ResumeImproveRequest, ResumeImproveResponse,
)
from app.utils.security import get_current_user
from app.utils.resume_extractor import validate_upload, extract_text
from app.utils.rate_limit import limiter
from app.services.ai_resume_service import analyze_resume
from app.services.ai_assistant_service import improve_resume_for_job

router = APIRouter(prefix="/api/resume", tags=["resume"])


@router.post("/upload", response_model=ResumeOut)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = await file.read()
    ext = validate_upload(file, content)

    upload_dir = os.path.abspath(settings.UPLOAD_DIR)
    os.makedirs(upload_dir, exist_ok=True)

    safe_name = f"{current_user.id}_{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(upload_dir, safe_name)
    with open(filepath, "wb") as f:
        f.write(content)

    raw_text = extract_text(filepath, ext)

    resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        filepath=filepath,
        file_type=ext.lstrip("."),
        raw_text=raw_text,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


@router.post("/analyze", response_model=CandidateProfileOut)
@limiter.limit("10/minute")
def analyze(request: Request, resume_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
    if not resume.raw_text:
        raise HTTPException(status_code=422, detail="This resume has no extractable text.")

    result = analyze_resume(resume.raw_text)

    profile = db.query(CandidateProfile).filter(CandidateProfile.resume_id == resume.id).first()
    if not profile:
        profile = CandidateProfile(resume_id=resume.id, user_id=current_user.id)
        db.add(profile)

    for key, value in result.items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.get("/profile", response_model=CandidateProfileOut)
def get_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = (
        db.query(CandidateProfile)
        .filter(CandidateProfile.user_id == current_user.id)
        .order_by(CandidateProfile.updated_at.desc())
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="No candidate profile yet. Upload and analyze a resume first.")
    return profile


@router.post("/improve", response_model=ResumeImproveResponse)
@limiter.limit("15/minute")
def improve_resume(
    request: Request,
    payload: ResumeImproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = (
        db.query(CandidateProfile)
        .filter(CandidateProfile.user_id == current_user.id)
        .order_by(CandidateProfile.updated_at.desc())
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="No candidate profile yet. Upload and analyze a resume first.")

    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    return improve_resume_for_job(profile, job)
