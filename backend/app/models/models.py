"""
SQLAlchemy ORM models for JobPilot AI.

Tables: User, Resume, CandidateProfile, Job, JobMatch, SavedJob,
        Application, Notification, SearchPreference
"""
import enum
import uuid
import datetime as dt

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Enum, JSON, UniqueConstraint
)
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


def utcnow():
    return dt.datetime.utcnow()


# ---------------------------------------------------------------- User ----
class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    is_active = Column(Boolean, default=True)

    resumes = relationship("Resume", back_populates="owner", cascade="all, delete-orphan")
    saved_jobs = relationship("SavedJob", back_populates="owner", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="owner", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="owner", cascade="all, delete-orphan")
    search_preference = relationship("SearchPreference", back_populates="owner", uselist=False,
                                      cascade="all, delete-orphan")


# -------------------------------------------------------------- Resume ----
class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # pdf / docx
    raw_text = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=utcnow)

    owner = relationship("User", back_populates="resumes")
    profile = relationship("CandidateProfile", back_populates="resume", uselist=False,
                            cascade="all, delete-orphan")


# ---------------------------------------------------- CandidateProfile ----
class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(String, primary_key=True, default=gen_uuid)
    resume_id = Column(String, ForeignKey("resumes.id"), nullable=False, unique=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)

    education = Column(JSON, default=list)
    cgpa = Column(String, nullable=True)
    skills = Column(JSON, default=list)
    programming_languages = Column(JSON, default=list)
    tools = Column(JSON, default=list)
    projects = Column(JSON, default=list)
    experience = Column(JSON, default=list)
    certifications = Column(JSON, default=list)
    target_roles = Column(JSON, default=list)
    preferred_locations = Column(JSON, default=list)

    resume_score = Column(Integer, default=0)
    strengths = Column(JSON, default=list)
    weaknesses = Column(JSON, default=list)
    missing_keywords = Column(JSON, default=list)
    recommended_roles = Column(JSON, default=list)

    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    resume = relationship("Resume", back_populates="profile")


# ----------------------------------------------------------------- Job ----
class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (UniqueConstraint("source", "source_id", name="uq_source_sourceid"),)

    id = Column(String, primary_key=True, default=gen_uuid)
    title = Column(String, nullable=False)
    company = Column(String, nullable=True)
    location = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    required_skills = Column(JSON, default=list)
    experience_required = Column(String, nullable=True)
    salary = Column(String, nullable=True)
    job_type = Column(String, nullable=True)      # full-time/part-time/internship
    work_mode = Column(String, nullable=True)      # remote/onsite/hybrid
    source = Column(String, nullable=False)         # e.g. "adzuna", "remotive", "demo"
    source_id = Column(String, nullable=True)       # provider's job id for de-dup
    source_url = Column(String, nullable=True)
    application_url = Column(String, nullable=True)
    posted_date = Column(DateTime, nullable=True)
    is_demo = Column(Boolean, default=False)         # NEVER shown as a real listing when True
    created_at = Column(DateTime, default=utcnow)

    matches = relationship("JobMatch", back_populates="job", cascade="all, delete-orphan")


# ------------------------------------------------------------- JobMatch ---
class JobMatch(Base):
    __tablename__ = "job_matches"
    __table_args__ = (UniqueConstraint("job_id", "user_id", name="uq_job_user_match"),)

    id = Column(String, primary_key=True, default=gen_uuid)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    overall_match = Column(Float, default=0.0)
    skills_match = Column(Float, default=0.0)
    experience_match = Column(Float, default=0.0)
    education_match = Column(Float, default=0.0)
    location_match = Column(Float, default=0.0)
    role_match = Column(Float, default=0.0)

    matched_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    recommendation = Column(String, nullable=True)  # HIGHLY RECOMMENDED / RECOMMENDED / NOT RECOMMENDED

    created_at = Column(DateTime, default=utcnow)

    job = relationship("Job", back_populates="matches")


# ------------------------------------------------------------- SavedJob ---
class SavedJob(Base):
    __tablename__ = "saved_jobs"
    __table_args__ = (UniqueConstraint("job_id", "user_id", name="uq_job_user_saved"),)

    id = Column(String, primary_key=True, default=gen_uuid)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    saved_at = Column(DateTime, default=utcnow)

    owner = relationship("User", back_populates="saved_jobs")
    job = relationship("Job")


# ---------------------------------------------------------- Application ---
class ApplicationStatus(str, enum.Enum):
    SAVED = "Saved"
    APPLIED = "Applied"
    ASSESSMENT = "Assessment"
    INTERVIEW = "Interview"
    REJECTED = "Rejected"
    SELECTED = "Selected"


class Application(Base):
    __tablename__ = "applications"

    id = Column(String, primary_key=True, default=gen_uuid)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.SAVED)
    notes = Column(Text, nullable=True)
    applied_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
    created_at = Column(DateTime, default=utcnow)

    owner = relationship("User", back_populates="applications")
    job = relationship("Job")


# --------------------------------------------------------- Notification ---
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

    owner = relationship("User", back_populates="notifications")


# ----------------------------------------------------- SearchPreference ---
class SearchPreference(Base):
    __tablename__ = "search_preferences"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)

    target_role = Column(String, nullable=True)
    location = Column(String, nullable=True)
    experience_level = Column(String, nullable=True)  # fresher / 1-3 yrs / etc
    work_mode = Column(String, nullable=True)
    minimum_match = Column(Integer, default=70)
    daily_agent_enabled = Column(Boolean, default=False)

    owner = relationship("User", back_populates="search_preference")
