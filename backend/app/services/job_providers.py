"""
Modular job data providers.

Each provider implements `search(title, location, **kwargs) -> list[dict]`
returning normalized job dicts. Add new providers by subclassing
`JobProvider` and registering them in `get_active_providers()`.

Real providers used here are legitimate, permitted APIs:
  - Remotive (https://remotive.com/api-documentation) — free, no key required.
  - Adzuna (https://developer.adzuna.com/) — free tier, requires app_id/app_key.

No scraping of sites that prohibit automated access is performed.
"""
import datetime as dt
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

import httpx

from app.config import settings


class JobProvider(ABC):
    name: str = "base"
    is_demo: bool = False

    @abstractmethod
    def search(self, title: Optional[str], location: Optional[str], **kwargs) -> List[Dict[str, Any]]:
        ...


class RemotiveProvider(JobProvider):
    """Free public API for remote jobs. No API key required."""
    name = "remotive"
    BASE_URL = "https://remotive.com/api/remote-jobs"

    def search(self, title: Optional[str], location: Optional[str], **kwargs) -> List[Dict[str, Any]]:
        params = {}
        if title:
            params["search"] = title
        try:
            resp = httpx.get(self.BASE_URL, params=params, timeout=15)
            resp.raise_for_status()
            data = resp.json()
        except Exception:
            return []

        jobs = []
        for item in data.get("jobs", [])[:40]:
            jobs.append({
                "title": item.get("title"),
                "company": item.get("company_name"),
                "location": item.get("candidate_required_location") or "Remote",
                "description": _strip_html(item.get("description", "")),
                "required_skills": item.get("tags", []),
                "experience_required": None,
                "salary": item.get("salary") or None,
                "job_type": item.get("job_type"),
                "work_mode": "Remote",
                "source": self.name,
                "source_id": str(item.get("id")),
                "source_url": item.get("url"),
                "application_url": item.get("url"),
                "posted_date": _parse_date(item.get("publication_date")),
                "is_demo": False,
            })
        return jobs


class AdzunaProvider(JobProvider):
    """Free-tier job search API. Requires ADZUNA_APP_ID / ADZUNA_APP_KEY."""
    name = "adzuna"
    BASE_URL = "https://api.adzuna.com/v1/api/jobs/{country}/search/1"

    def __init__(self, country: str = "in"):
        self.country = country

    def search(self, title: Optional[str], location: Optional[str], **kwargs) -> List[Dict[str, Any]]:
        if not (settings.ADZUNA_APP_ID and settings.ADZUNA_APP_KEY):
            return []
        params = {
            "app_id": settings.ADZUNA_APP_ID,
            "app_key": settings.ADZUNA_APP_KEY,
            "results_per_page": 40,
            "what": title or "",
            "where": location or "",
            "content-type": "application/json",
        }
        url = self.BASE_URL.format(country=self.country)
        try:
            resp = httpx.get(url, params=params, timeout=15)
            resp.raise_for_status()
            data = resp.json()
        except Exception:
            return []

        jobs = []
        for item in data.get("results", []):
            jobs.append({
                "title": item.get("title"),
                "company": (item.get("company") or {}).get("display_name"),
                "location": (item.get("location") or {}).get("display_name"),
                "description": item.get("description"),
                "required_skills": [],
                "experience_required": None,
                "salary": _format_salary(item),
                "job_type": item.get("contract_time"),
                "work_mode": None,
                "source": self.name,
                "source_id": str(item.get("id")),
                "source_url": item.get("redirect_url"),
                "application_url": item.get("redirect_url"),
                "posted_date": _parse_date(item.get("created")),
                "is_demo": False,
            })
        return jobs


class DemoProvider(JobProvider):
    """
    Clearly labeled sample data for local testing / when no real provider
    is configured. NEVER returned unless explicitly requested, and every
    job is flagged is_demo=True so the UI can label it accordingly.
    """
    name = "demo"
    is_demo = True

    SAMPLE_JOBS = [
        {
            "title": "Junior Data Analyst",
            "company": "Demo Analytics Co.",
            "location": "Noida, India",
            "description": "Sample demo listing for local testing. Analyze data, build dashboards, "
                            "support business reporting using SQL, Excel, and Power BI.",
            "required_skills": ["Python", "SQL", "Excel", "Power BI"],
            "experience_required": "Fresher",
            "salary": "₹4,00,000 - ₹6,00,000 /yr",
            "job_type": "Full-time",
            "work_mode": "Hybrid",
        },
        {
            "title": "Data Science Intern",
            "company": "Demo Insights Labs",
            "location": "Bengaluru, India",
            "description": "Sample demo listing for local testing. Work with the data science team on "
                            "predictive models using Python, Pandas, and NumPy.",
            "required_skills": ["Python", "Pandas", "NumPy", "Statistics"],
            "experience_required": "0-1 years",
            "salary": "₹20,000/month",
            "job_type": "Internship",
            "work_mode": "Remote",
        },
        {
            "title": "Business Intelligence Analyst",
            "company": "Demo Metrics Inc.",
            "location": "Remote",
            "description": "Sample demo listing for local testing. Build BI dashboards and reports for "
                            "stakeholders using SQL and Tableau.",
            "required_skills": ["SQL", "Tableau", "Excel", "Communication"],
            "experience_required": "1-2 years",
            "salary": "₹6,00,000 - ₹9,00,000 /yr",
            "job_type": "Full-time",
            "work_mode": "Remote",
        },
    ]

    def search(self, title: Optional[str], location: Optional[str], **kwargs) -> List[Dict[str, Any]]:
        jobs = []
        for idx, sample in enumerate(self.SAMPLE_JOBS):
            job = dict(sample)
            job.update({
                "source": self.name,
                "source_id": f"demo-{idx}",
                "source_url": "https://example.com/demo-job",
                "application_url": "https://example.com/demo-job/apply",
                "posted_date": dt.datetime.utcnow(),
                "is_demo": True,
            })
            jobs.append(job)
        return jobs


def get_active_providers() -> List[JobProvider]:
    """Returns providers that are actually configured/usable."""
    providers: List[JobProvider] = []
    if settings.REMOTIVE_ENABLED:
        providers.append(RemotiveProvider())
    if settings.ADZUNA_APP_ID and settings.ADZUNA_APP_KEY:
        providers.append(AdzunaProvider())
    return providers


def is_any_real_provider_configured() -> bool:
    return len(get_active_providers()) > 0


def _strip_html(text: str) -> str:
    import re
    return re.sub(r"<[^>]+>", " ", text or "").strip()


def _parse_date(value) -> Optional[dt.datetime]:
    if not value:
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%SZ"):
        try:
            return dt.datetime.strptime(value[:19], fmt)
        except (ValueError, TypeError):
            continue
    return None


def _format_salary(item: dict) -> Optional[str]:
    lo, hi = item.get("salary_min"), item.get("salary_max")
    if lo and hi:
        return f"{int(lo):,} - {int(hi):,}"
    return None
