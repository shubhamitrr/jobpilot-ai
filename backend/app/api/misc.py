from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import (
    User, Job, JobMatch, SavedJob, Application, ApplicationStatus,
    SearchPreference, CandidateProfile, Notification,
)
from app.schemas.schemas import (
    SavedJobOut, ApplicationCreate, ApplicationUpdate, ApplicationOut,
    SearchPreferenceIn, SearchPreferenceOut, DashboardOut,
    AssistantRequest, AssistantResponse, NotificationOut,
)
from app.utils.security import get_current_user
from app.utils.rate_limit import limiter
from app.services.ai_assistant_service import generate_assistant_content

router = APIRouter(prefix="/api", tags=["saved-jobs-applications-dashboard"])


# ------------------------------------------------------------ Saved Jobs --
@router.get("/saved-jobs", response_model=List[SavedJobOut])
def list_saved_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(SavedJob)
        .filter(SavedJob.user_id == current_user.id)
        .order_by(SavedJob.saved_at.desc())
        .all()
    )


@router.delete("/saved-jobs/{saved_job_id}")
def unsave_job(saved_job_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    saved = db.query(SavedJob).filter(SavedJob.id == saved_job_id, SavedJob.user_id == current_user.id).first()
    if not saved:
        raise HTTPException(status_code=404, detail="Saved job not found.")
    db.delete(saved)
    db.commit()
    return {"success": True}


# ---------------------------------------------------------- Applications --
@router.post("/applications", response_model=ApplicationOut)
def create_application(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    try:
        status_enum = ApplicationStatus(payload.status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status value.")

    existing = (
        db.query(Application)
        .filter(Application.job_id == payload.job_id, Application.user_id == current_user.id)
        .first()
    )
    if existing:
        existing.status = status_enum
        existing.notes = payload.notes
        db.commit()
        db.refresh(existing)
        return existing

    application = Application(
        job_id=payload.job_id,
        user_id=current_user.id,
        status=status_enum,
        notes=payload.notes,
    )
    if status_enum == ApplicationStatus.APPLIED:
        import datetime as dt
        application.applied_at = dt.datetime.utcnow()
    db.add(application)
    db.commit()
    db.refresh(application)
    return application


@router.get("/applications", response_model=List[ApplicationOut])
def list_applications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Application)
        .filter(Application.user_id == current_user.id)
        .order_by(Application.updated_at.desc())
        .all()
    )


@router.put("/applications/{application_id}", response_model=ApplicationOut)
def update_application(
    application_id: str,
    payload: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_id == current_user.id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    if payload.status:
        try:
            application.status = ApplicationStatus(payload.status)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid status value.")
        if application.status == ApplicationStatus.APPLIED and not application.applied_at:
            import datetime as dt
            application.applied_at = dt.datetime.utcnow()

    if payload.notes is not None:
        application.notes = payload.notes

    db.commit()
    db.refresh(application)
    return application


# ------------------------------------------------------- Search Preference
@router.get("/preferences", response_model=SearchPreferenceOut)
def get_preferences(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pref = db.query(SearchPreference).filter(SearchPreference.user_id == current_user.id).first()
    if not pref:
        raise HTTPException(status_code=404, detail="No search preferences set yet.")
    return pref


@router.put("/preferences", response_model=SearchPreferenceOut)
def update_preferences(
    payload: SearchPreferenceIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pref = db.query(SearchPreference).filter(SearchPreference.user_id == current_user.id).first()
    if not pref:
        pref = SearchPreference(user_id=current_user.id)
        db.add(pref)
    for key, value in payload.model_dump().items():
        setattr(pref, key, value)
    db.commit()
    db.refresh(pref)
    return pref


# ------------------------------------------------------------- Dashboard --
@router.get("/dashboard", response_model=DashboardOut)
def dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    profile = (
        db.query(CandidateProfile)
        .filter(CandidateProfile.user_id == current_user.id)
        .order_by(CandidateProfile.updated_at.desc())
        .first()
    )

    matches = db.query(JobMatch).filter(JobMatch.user_id == current_user.id).all()
    highly = sum(1 for m in matches if m.overall_match >= 85)
    good = sum(1 for m in matches if 65 <= m.overall_match < 85)
    low = sum(1 for m in matches if m.overall_match < 65)

    saved_count = db.query(SavedJob).filter(SavedJob.user_id == current_user.id).count()

    applications = db.query(Application).filter(Application.user_id == current_user.id).all()
    by_status = {s.value: 0 for s in ApplicationStatus}
    for a in applications:
        by_status[a.status.value] = by_status.get(a.status.value, 0) + 1

    return DashboardOut(
        total_jobs_found=len(matches),
        highly_matched=highly,
        good_matches=good,
        low_matches=low,
        saved_count=saved_count,
        applications_by_status=by_status,
        resume_score=profile.resume_score if profile else None,
    )


# --------------------------------------------------- Application Assistant
@router.post("/assistant/generate", response_model=AssistantResponse)
@limiter.limit("15/minute")
def assistant_generate(
    request: Request,
    payload: AssistantRequest,
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

    content = generate_assistant_content(profile, job, payload.kind)
    return AssistantResponse(content=content)


# --------------------------------------------------------- Notifications --
@router.get("/notifications", response_model=List[NotificationOut])
def list_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.is_read == False)  # noqa: E712
    return query.order_by(Notification.created_at.desc()).limit(100).all()


@router.put("/notifications/{notification_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    notif = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


@router.put("/notifications/read-all")
def mark_all_notifications_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(
        Notification.user_id == current_user.id, Notification.is_read == False  # noqa: E712
    ).update({"is_read": True})
    db.commit()
    return {"success": True}
