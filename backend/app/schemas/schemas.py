from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Candidate Profile ----------
class CandidateProfileOut(BaseModel):
    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    education: List[str] = []
    cgpa: Optional[str] = None
    skills: List[str] = []
    programming_languages: List[str] = []
    tools: List[str] = []
    projects: List[str] = []
    experience: List[str] = []
    certifications: List[str] = []
    target_roles: List[str] = []
    preferred_locations: List[str] = []
    resume_score: int = 0
    strengths: List[str] = []
    weaknesses: List[str] = []
    missing_keywords: List[str] = []
    recommended_roles: List[str] = []

    class Config:
        from_attributes = True


class ResumeOut(BaseModel):
    id: str
    filename: str
    file_type: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ---------- Jobs ----------
class JobOut(BaseModel):
    id: str
    title: str
    company: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    required_skills: List[str] = []
    experience_required: Optional[str] = None
    salary: Optional[str] = None
    job_type: Optional[str] = None
    work_mode: Optional[str] = None
    source: str
    source_url: Optional[str] = None
    application_url: Optional[str] = None
    posted_date: Optional[datetime] = None
    is_demo: bool = False

    class Config:
        from_attributes = True


class JobSearchRequest(BaseModel):
    title: Optional[str] = None
    location: Optional[str] = None
    experience_level: Optional[str] = None
    work_mode: Optional[str] = None
    use_demo_if_unconfigured: bool = True


class JobMatchOut(BaseModel):
    id: str
    job_id: str
    overall_match: float
    skills_match: float
    experience_match: float
    education_match: float
    location_match: float
    role_match: float
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    recommendation: Optional[str] = None

    class Config:
        from_attributes = True


class JobWithMatchOut(JobOut):
    match: Optional[JobMatchOut] = None


# ---------- Saved Jobs / Applications ----------
class SavedJobOut(BaseModel):
    id: str
    job: JobOut
    saved_at: datetime

    class Config:
        from_attributes = True


class ApplicationCreate(BaseModel):
    job_id: str
    status: str = "Saved"
    notes: Optional[str] = None


class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class ApplicationOut(BaseModel):
    id: str
    job: JobOut
    status: str
    notes: Optional[str] = None
    applied_at: Optional[datetime] = None
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------- Resume improvement / assistant ----------
class ResumeImproveRequest(BaseModel):
    job_id: str


class ResumeImproveResponse(BaseModel):
    missing_keywords: List[str] = []
    skills_to_highlight: List[str] = []
    project_suggestions: List[str] = []
    bullet_improvements: List[str] = []
    skills_to_learn: List[str] = []


class AssistantRequest(BaseModel):
    job_id: str
    kind: str  # "intro" | "why_hire" | "why_job" | "cover_letter" | "summary"


class AssistantResponse(BaseModel):
    content: str


# ---------- Search preferences ----------
class SearchPreferenceIn(BaseModel):
    target_role: Optional[str] = None
    location: Optional[str] = None
    experience_level: Optional[str] = None
    work_mode: Optional[str] = None
    minimum_match: int = 70
    daily_agent_enabled: bool = False


class SearchPreferenceOut(SearchPreferenceIn):
    id: str

    class Config:
        from_attributes = True


# ---------- Dashboard ----------
class DashboardOut(BaseModel):
    total_jobs_found: int
    highly_matched: int
    good_matches: int
    low_matches: int
    saved_count: int
    applications_by_status: dict
    resume_score: Optional[int] = None


# ---------- Notifications ----------
class NotificationOut(BaseModel):
    id: str
    title: str
    message: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
