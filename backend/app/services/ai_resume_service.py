"""
AI Resume Analyzer.

Sends extracted resume text to the configured LLM and parses a strict
JSON response into the CandidateProfile shape. Falls back to a clear
error (not fabricated data) if the AI is not configured or the response
is invalid.
"""
import json
import re
from typing import Any, Dict

from fastapi import HTTPException

from app.utils.llm_client import generate

RESUME_SCHEMA_KEYS = [
    "name", "email", "phone", "education", "cgpa", "skills",
    "programming_languages", "tools", "projects", "experience",
    "certifications", "target_roles", "preferred_locations",
    "resume_score", "strengths", "weaknesses", "missing_keywords",
    "recommended_roles",
]

SYSTEM_PROMPT = """You are an expert resume analyst and ATS (Applicant Tracking System) evaluator.
You will be given raw resume text. Extract structured information and evaluate resume quality.

Respond with ONLY a single valid JSON object (no markdown fences, no preamble, no commentary) with
EXACTLY these keys:

{
  "name": string,
  "email": string,
  "phone": string,
  "education": [string],
  "cgpa": string,
  "skills": [string],
  "programming_languages": [string],
  "tools": [string],
  "projects": [string],
  "experience": [string],
  "certifications": [string],
  "target_roles": [string],
  "preferred_locations": [string],
  "resume_score": integer between 0 and 100,
  "strengths": [string],
  "weaknesses": [string],
  "missing_keywords": [string],
  "recommended_roles": [string]
}

Rules:
- Only extract information that is actually present or reasonably inferable from the resume text.
- Never invent employment, degrees, certifications, or skills not evidenced in the text.
- "resume_score" must reflect ATS-friendliness: formatting clarity, use of measurable achievements,
  keyword relevance, and completeness — not just how impressive the candidate is.
- If a field cannot be determined, use an empty string or empty list.
- Output valid JSON only.
"""


def _extract_json(text: str) -> Dict[str, Any]:
    """Best-effort extraction of a JSON object from the model's text output."""
    text = text.strip()
    text = re.sub(r"^```(json)?", "", text.strip())
    text = re.sub(r"```$", "", text.strip())
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise


def analyze_resume(resume_text: str) -> Dict[str, Any]:
    """Calls the LLM to analyze resume text and returns a validated dict."""
    raw_text = generate(
        system=SYSTEM_PROMPT,
        user_content=f"Resume text:\n\n{resume_text[:15000]}",
        max_tokens=4000,
    )

    try:
        data = _extract_json(raw_text)
    except Exception:
        raise HTTPException(status_code=502, detail="AI returned an invalid response. Please try again.")

    return validate_profile(data)


def validate_profile(data: Dict[str, Any]) -> Dict[str, Any]:
    """Ensures all expected keys exist with correct basic types before persisting."""
    if not isinstance(data, dict):
        raise HTTPException(status_code=502, detail="AI response was not a JSON object.")

    list_fields = {
        "education", "skills", "programming_languages", "tools", "projects",
        "experience", "certifications", "target_roles", "preferred_locations",
        "strengths", "weaknesses", "missing_keywords", "recommended_roles",
    }
    str_fields = {"name", "email", "phone", "cgpa"}

    clean: Dict[str, Any] = {}
    for key in RESUME_SCHEMA_KEYS:
        value = data.get(key)
        if key in list_fields:
            clean[key] = value if isinstance(value, list) else []
            clean[key] = [str(v) for v in clean[key]]
        elif key in str_fields:
            clean[key] = str(value) if value else ""
        elif key == "resume_score":
            try:
                score = int(value)
            except (TypeError, ValueError):
                score = 0
            clean[key] = max(0, min(100, score))
        else:
            clean[key] = value

    return clean