"""
AI services for:
  - Resume improvement suggestions tailored to a specific job
  - Application assistant content (intro, why-hire, why-job, cover letter, summary)

Both are strictly grounded in the candidate's actual resume/profile data —
the system prompts explicitly forbid fabricating experience or skills.
"""
import json
import re
from typing import Dict, Any

from fastapi import HTTPException

from app.models.models import CandidateProfile, Job
from app.utils.llm_client import generate

GROUNDING_RULE = (
    "You must use ONLY information present in the candidate profile provided. "
    "NEVER invent, assume, or embellish employment history, education, certifications, "
    "projects, or skills the candidate does not actually have."
)


def _profile_to_text(profile: CandidateProfile) -> str:
    return json.dumps({
        "name": profile.name,
        "education": profile.education,
        "cgpa": profile.cgpa,
        "skills": profile.skills,
        "programming_languages": profile.programming_languages,
        "tools": profile.tools,
        "projects": profile.projects,
        "experience": profile.experience,
        "certifications": profile.certifications,
        "target_roles": profile.target_roles,
    }, ensure_ascii=False)


def _job_to_text(job: Job) -> str:
    return json.dumps({
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "description": (job.description or "")[:4000],
        "required_skills": job.required_skills,
        "experience_required": job.experience_required,
    }, ensure_ascii=False)


def improve_resume_for_job(profile: CandidateProfile, job: Job) -> Dict[str, Any]:
    system = f"""You are an expert resume coach. {GROUNDING_RULE}

Respond with ONLY a valid JSON object (no markdown fences) with exactly these keys:
{{
  "missing_keywords": [string],
  "skills_to_highlight": [string],
  "project_suggestions": [string],
  "bullet_improvements": [string],
  "skills_to_learn": [string]
}}

- "missing_keywords": important keywords from the job description absent from the resume.
- "skills_to_highlight": skills the candidate already has that should be emphasized for this role.
- "project_suggestions": how to reframe/describe EXISTING projects to better match this job (do not invent new projects).
- "bullet_improvements": suggested rewrites of existing resume bullets to be more impactful/quantified.
- "skills_to_learn": skills required by the job that the candidate does not currently have.
"""
    user_msg = f"Candidate profile:\n{_profile_to_text(profile)}\n\nJob:\n{_job_to_text(job)}"

    raw_text = generate(system=system, user_content=user_msg, max_tokens=1500)

    try:
        cleaned = re.sub(r"^```(json)?|```$", "", raw_text.strip()).strip()
        data = json.loads(cleaned)
    except Exception:
        raise HTTPException(status_code=502, detail="AI returned an invalid response. Please try again.")

    for key in ["missing_keywords", "skills_to_highlight", "project_suggestions",
                "bullet_improvements", "skills_to_learn"]:
        if not isinstance(data.get(key), list):
            data[key] = []

    return data


ASSISTANT_PROMPTS = {
    "intro": "Write a short (3-4 sentence) professional introduction the candidate could use "
             "when reaching out to a recruiter about this specific job.",
    "why_hire": "Write a concise 'Why should we hire you?' answer (max 150 words) for this job, "
                "grounded strictly in the candidate's real skills/experience.",
    "why_job": "Write a concise 'Why do you want this job?' answer (max 120 words), genuine and "
               "specific to the role and company.",
    "cover_letter": "Write a complete, professional cover letter (250-350 words) for this job application.",
    "summary": "Write a job-specific professional summary (2-3 sentences) tailored to this role, "
               "suitable for the top of a resume.",
}


def generate_assistant_content(profile: CandidateProfile, job: Job, kind: str) -> str:
    if kind not in ASSISTANT_PROMPTS:
        raise HTTPException(status_code=400, detail=f"Unknown assistant content type: {kind}")

    system = f"""You are a professional career-application writing assistant. {GROUNDING_RULE}
Write in a natural, confident, first-person voice as if written by the candidate. Do not use placeholders
like [Company Name] — use the actual company/job info given. Output plain text only, no markdown headers."""

    user_msg = (
        f"Task: {ASSISTANT_PROMPTS[kind]}\n\n"
        f"Candidate profile:\n{_profile_to_text(profile)}\n\n"
        f"Job:\n{_job_to_text(job)}"
    )

    return generate(system=system, user_content=user_msg, max_tokens=800).strip()