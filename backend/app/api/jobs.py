from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User, Job, JobMatch, CandidateProfile, SavedJob
from app.schemas.schemas import (
    JobOut, JobSearchRequest, JobMatchOut, JobWithMatchOut, SavedJobOut,
)
from app.utils.security import get_current_user
from app.utils.rate_limit import limiter
from app.services.job_search_service import search_and_store_jobs, NoJobProviderConfigured, real_provider_available
from app.services.matching_service import score_job_match

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def _latest_profile(db: Session, user_id: str) -> Optional[CandidateProfile]:
    return (
        db.query(CandidateProfile)
        .filter(CandidateProfile.user_id == user_id)
        .order_by(CandidateProfile.updated_at.desc())
        .first()
    )


@router.post("/search", response_model=List[JobWithMatchOut])
@limiter.limit("10/minute")
def search_jobs(
    request: Request,
    payload: JobSearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = _latest_profile(db, current_user.id)

    title = payload.title or (profile.target_roles[0] if profile and profile.target_roles else None)
    location = payload.location or (profile.preferred_locations[0] if profile and profile.preferred_locations else None)

    if not real_provider_available() and not payload.use_demo_if_unconfigured:
        raise HTTPException(
            status_code=503,
            detail=(
                "No live job provider is configured. Set ADZUNA_APP_ID/ADZUNA_APP_KEY in the backend "
                ".env (Remotive works with no key but only covers remote roles), or enable demo mode "
                "for local testing."
            ),
        )

    try:
        jobs = search_and_store_jobs(db, title=title, location=location,
                                      use_demo_if_unconfigured=payload.use_demo_if_unconfigured)
    except NoJobProviderConfigured:
        raise HTTPException(status_code=503, detail="No live job provider is configured.")

    return _attach_matches(db, jobs, profile, current_user.id)


@router.get("", response_model=List[JobWithMatchOut])
def list_jobs(
    sort: str = Query("match", description="match|latest|location|salary"),
    min_match: Optional[float] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = _latest_profile(db, current_user.id)
    jobs = db.query(Job).order_by(Job.created_at.desc()).limit(200).all()
    results = _attach_matches(db, jobs, profile, current_user.id)

    if min_match is not None:
        results = [r for r in results if r.match and r.match.overall_match >= min_match]

    if sort == "latest":
        results.sort(key=lambda r: r.posted_date or r.created_at if hasattr(r, "created_at") else 0, reverse=True)
    elif sort == "location":
        results.sort(key=lambda r: (r.location or ""))
    else:  # match (default)
        results.sort(key=lambda r: r.match.overall_match if r.match else 0, reverse=True)

    return results


@router.get("/{job_id}", response_model=JobWithMatchOut)
def get_job(job_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    profile = _latest_profile(db, current_user.id)
    return _attach_matches(db, [job], profile, current_user.id)[0]


@router.post("/{job_id}/match", response_model=JobMatchOut)
def compute_match(job_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    profile = _latest_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="No candidate profile yet. Upload and analyze a resume first.")

    return _compute_and_store_match(db, job, profile, current_user.id)


@router.post("/{job_id}/save", response_model=SavedJobOut)
def save_job(job_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    existing = db.query(SavedJob).filter(SavedJob.job_id == job_id, SavedJob.user_id == current_user.id).first()
    if existing:
        return existing

    saved = SavedJob(job_id=job_id, user_id=current_user.id)
    db.add(saved)
    db.commit()
    db.refresh(saved)
    return saved


# ------------------------------------------------------------- helpers ---
def _compute_and_store_match(db: Session, job: Job, profile: CandidateProfile, user_id: str) -> JobMatch:
    scored = score_job_match(profile, job)
    match = db.query(JobMatch).filter(JobMatch.job_id == job.id, JobMatch.user_id == user_id).first()
    if not match:
        match = JobMatch(job_id=job.id, user_id=user_id)
        db.add(match)
    for key, value in scored.items():
        setattr(match, key, value)
    db.commit()
    db.refresh(match)
    return match


def _attach_matches(db: Session, jobs: List[Job], profile: Optional[CandidateProfile], user_id: str):
    results = []
    for job in jobs:
        match_out = None
        if profile:
            match = _compute_and_store_match(db, job, profile, user_id)
            match_out = JobMatchOut.model_validate(match)
        job_out = JobWithMatchOut.model_validate(job)
        job_out.match = match_out
        results.append(job_out)
    return results
