"""
Transparent job-matching scoring engine.

Deliberately rule-based (not "ask the AI for a percentage") so scores are
explainable and reproducible. Each sub-score is 0-100; overall is a
weighted average.
"""
import re
from typing import List, Dict, Any

from app.models.models import CandidateProfile, Job

WEIGHTS = {
    "skills": 0.40,
    "experience": 0.20,
    "education": 0.15,
    "location": 0.10,
    "role": 0.15,
}


def _normalize(items: List[str]) -> set:
    return {re.sub(r"[^a-z0-9+#.]", "", i.lower().strip()) for i in items if i and i.strip()}


def _skills_match(candidate_skills: List[str], job_skills: List[str], job_text: str):
    cand_set = _normalize(candidate_skills)
    job_set = _normalize(job_skills)

    # If the job listing didn't provide a structured skills list, infer likely
    # skill mentions by checking candidate skills against the free-text description.
    if not job_set and job_text:
        text_lower = job_text.lower()
        job_set = {s for s in cand_set if s and s in text_lower}

    if not job_set:
        # Nothing to compare against — treat as neutral/unknown rather than 0.
        return 50.0, sorted(candidate_skills), []

    matched = job_set & cand_set
    missing = job_set - cand_set

    score = (len(matched) / len(job_set)) * 100 if job_set else 50.0

    # map normalized tokens back to nice display names where possible
    display_map = {re.sub(r"[^a-z0-9+#.]", "", s.lower()): s for s in candidate_skills}
    matched_display = [display_map.get(m, m) for m in matched] or sorted(matched)
    missing_display = sorted(missing)

    return round(score, 1), matched_display, missing_display


def _experience_match(candidate_experience: List[str], required: str) -> float:
    if not required:
        return 70.0  # unspecified requirement — assume roughly compatible
    required_lower = required.lower()
    is_fresher_role = "fresher" in required_lower or "0-1" in required_lower or "entry" in required_lower
    has_experience = len(candidate_experience) > 0

    if is_fresher_role:
        return 100.0
    if has_experience:
        return 75.0
    return 40.0


def _education_match(candidate_education: List[str]) -> float:
    if not candidate_education:
        return 40.0
    text = " ".join(candidate_education).lower()
    if any(k in text for k in ["b.tech", "b.e", "bachelor", "bsc", "b.sc", "mca", "m.tech", "master"]):
        return 90.0
    return 65.0


def _location_match(preferred_locations: List[str], job_location: str, work_mode: str) -> float:
    if work_mode and "remote" in (work_mode or "").lower():
        return 100.0
    if not preferred_locations or not job_location:
        return 60.0
    job_loc_lower = job_location.lower()
    for loc in preferred_locations:
        if loc.lower().strip() in job_loc_lower:
            return 100.0
    return 35.0


def _role_match(target_roles: List[str], job_title: str) -> float:
    if not target_roles or not job_title:
        return 50.0
    title_lower = job_title.lower()
    for role in target_roles:
        role_words = [w for w in role.lower().split() if len(w) > 2]
        if role_words and all(w in title_lower for w in role_words):
            return 100.0
        if any(w in title_lower for w in role_words):
            return 70.0
    return 30.0


def _recommendation(overall: float) -> str:
    if overall >= 85:
        return "HIGHLY RECOMMENDED"
    if overall >= 65:
        return "RECOMMENDED"
    if overall >= 45:
        return "CONSIDER WITH CAUTION"
    return "NOT RECOMMENDED"


def score_job_match(profile: CandidateProfile, job: Job) -> Dict[str, Any]:
    candidate_skills = list(profile.skills or []) + list(profile.programming_languages or []) + \
        list(profile.tools or [])

    skills_score, matched_skills, missing_skills = _skills_match(
        candidate_skills, job.required_skills or [], job.description or ""
    )
    experience_score = _experience_match(profile.experience or [], job.experience_required or "")
    education_score = _education_match(profile.education or [])
    location_score = _location_match(profile.preferred_locations or [], job.location or "", job.work_mode or "")
    role_score = _role_match(profile.target_roles or [], job.title or "")

    overall = (
        skills_score * WEIGHTS["skills"]
        + experience_score * WEIGHTS["experience"]
        + education_score * WEIGHTS["education"]
        + location_score * WEIGHTS["location"]
        + role_score * WEIGHTS["role"]
    )
    overall = round(overall, 1)

    return {
        "overall_match": overall,
        "skills_match": skills_score,
        "experience_match": experience_score,
        "education_match": education_score,
        "location_match": location_score,
        "role_match": role_score,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "recommendation": _recommendation(overall),
    }
