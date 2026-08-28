from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.models import Job
from app.services.job_providers import get_active_providers, is_any_real_provider_configured, DemoProvider


class NoJobProviderConfigured(Exception):
    """Raised when no real job provider is configured and demo mode wasn't requested."""


def search_and_store_jobs(
    db: Session,
    title: Optional[str],
    location: Optional[str],
    use_demo_if_unconfigured: bool = True,
) -> List[Job]:
    """
    Searches all active (real) job providers, normalizes and de-dupes results,
    stores new jobs in the DB, and returns the full list of Job rows found.

    If no real provider is configured, either falls back to clearly-labeled
    demo data (if allowed) or raises NoJobProviderConfigured so the caller can
    show a clear configuration message instead of fabricating jobs.
    """
    providers = get_active_providers()

    if not providers:
        if not use_demo_if_unconfigured:
            raise NoJobProviderConfigured()
        providers = [DemoProvider()]

    all_raw_jobs = []
    for provider in providers:
        try:
            results = provider.search(title=title, location=location)
            all_raw_jobs.extend(results)
        except Exception:
            # A single provider failing should not break the whole search.
            continue

    # If every configured real provider came back empty (e.g. network issue,
    # rate limit, or no matching results), fall back to clearly-labeled demo
    # data only if the caller explicitly allows it — never silently invent
    # jobs otherwise.
    if not all_raw_jobs and use_demo_if_unconfigured:
        all_raw_jobs = DemoProvider().search(title=title, location=location)

    stored_jobs: List[Job] = []
    for raw in all_raw_jobs:
        existing = None
        if raw.get("source") and raw.get("source_id"):
            existing = (
                db.query(Job)
                .filter(Job.source == raw["source"], Job.source_id == raw["source_id"])
                .first()
            )
        if existing:
            stored_jobs.append(existing)
            continue

        job = Job(
            title=raw.get("title") or "Untitled role",
            company=raw.get("company"),
            location=raw.get("location"),
            description=raw.get("description"),
            required_skills=raw.get("required_skills") or [],
            experience_required=raw.get("experience_required"),
            salary=raw.get("salary"),
            job_type=raw.get("job_type"),
            work_mode=raw.get("work_mode"),
            source=raw.get("source", "unknown"),
            source_id=raw.get("source_id"),
            source_url=raw.get("source_url"),
            application_url=raw.get("application_url"),
            posted_date=raw.get("posted_date"),
            is_demo=raw.get("is_demo", False),
        )
        db.add(job)
        stored_jobs.append(job)

    db.commit()
    for j in stored_jobs:
        db.refresh(j)

    return stored_jobs


def real_provider_available() -> bool:
    return is_any_real_provider_configured()
