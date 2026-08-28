"""
Daily Job Agent.

Runs on a schedule (APScheduler) for each user who has enabled it in their
SearchPreference. Searches configured job providers, computes matches
against the user's latest profile, stores a Notification for newly
discovered jobs above their minimum match threshold, and emails a daily
report if SMTP is configured. If SMTP isn't configured the app still works
normally — email is purely additive.
"""
import logging
import datetime as dt

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.models import User, SearchPreference, CandidateProfile, Notification, JobMatch
from app.services.job_search_service import search_and_store_jobs
from app.services.matching_service import score_job_match
from app.services.email_service import send_email, build_daily_report_html, is_smtp_configured

logger = logging.getLogger("jobpilot.agent")


def run_daily_agent_for_all_users():
    db: Session = SessionLocal()
    try:
        prefs = db.query(SearchPreference).filter(SearchPreference.daily_agent_enabled == True).all()  # noqa: E712
        for pref in prefs:
            try:
                _run_for_user(db, pref)
            except Exception as e:
                logger.error("Daily agent failed for user %s: %s", pref.user_id, e)
    finally:
        db.close()


def _run_for_user(db: Session, pref: SearchPreference):
    user = db.query(User).filter(User.id == pref.user_id).first()
    if not user:
        return

    profile = (
        db.query(CandidateProfile)
        .filter(CandidateProfile.user_id == user.id)
        .order_by(CandidateProfile.updated_at.desc())
        .first()
    )
    if not profile:
        return

    jobs = search_and_store_jobs(
        db, title=pref.target_role, location=pref.location, use_demo_if_unconfigured=False
    )

    new_top_matches = []
    for job in jobs:
        existing_match = db.query(JobMatch).filter(JobMatch.job_id == job.id, JobMatch.user_id == user.id).first()
        is_new = existing_match is None

        scored = score_job_match(profile, job)
        if not existing_match:
            existing_match = JobMatch(job_id=job.id, user_id=user.id)
            db.add(existing_match)
        for key, value in scored.items():
            setattr(existing_match, key, value)

        if is_new and scored["overall_match"] >= (pref.minimum_match or 70):
            notification = Notification(
                user_id=user.id,
                title=f"New match: {job.title} ({scored['overall_match']}%)",
                message=f"{job.title} at {job.company} — {scored['overall_match']}% match.",
            )
            db.add(notification)
            new_top_matches.append({
                "title": job.title,
                "company": job.company,
                "overall_match": scored["overall_match"],
                "application_url": job.application_url,
            })

    db.commit()

    if new_top_matches and is_smtp_configured():
        html = build_daily_report_html(len(jobs), sorted(new_top_matches, key=lambda m: -m["overall_match"])[:5])
        send_email(user.email, "JobPilot AI — Your Daily Job Report", html)


scheduler = BackgroundScheduler()


def start_scheduler():
    """Call once at app startup. Runs the daily agent every day at 08:00 server time."""
    if not scheduler.running:
        scheduler.add_job(run_daily_agent_for_all_users, "cron", hour=8, minute=0, id="daily_job_agent")
        scheduler.start()
        logger.info("Daily job agent scheduler started.")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
