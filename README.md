# JobPilot AI — AI Resume Analyzer & Job Search Agent

JobPilot AI reads your resume, builds a structured candidate profile, searches
configured job sources, and scores every job against your profile using a
transparent, rule-based matching engine (not an arbitrary AI-generated
percentage). It tracks saved jobs and applications, and can suggest
resume improvements and draft application content — all grounded strictly
in your real resume data.

## 1. Overview

- Upload a PDF/DOCX resume → AI extracts a structured candidate profile and an ATS score.
- Search real job sources (Remotive, Adzuna) for roles matching your profile.
- Every job gets a transparent match score: skills, experience, education, location, role.
- Save jobs, track application status (Saved → Applied → Interview → Selected/Rejected).
- Get AI resume-improvement suggestions and application content (cover letter, intro, etc.)
  per job — never fabricated, only from your actual resume.
- Optional daily agent + email report for new high-match jobs.
- Clearly labeled Demo Mode for local testing when no real job API is configured.

## 2. Features

| Area | What it does |
|---|---|
| Resume analysis | Extracts name, skills, education, experience, projects, certifications; ATS score 0-100 |
| Job search | Modular providers (Remotive - free, Adzuna - free tier); demo fallback clearly labeled |
| Job matching | Deterministic weighted scoring across 5 dimensions, matched/missing skills |
| Dashboard | Total jobs, highly/good/low matches, resume score, application funnel |
| Application tracker | Saved / Applied / Assessment / Interview / Rejected / Selected |
| Resume improvement | Per-job keyword gaps, bullet rewrites, skills to learn |
| Application assistant | Intro, "why hire you", "why this job", cover letter, resume summary |
| Daily agent | Optional scheduled search + email digest of new matches |
| Auth | Register/login, JWT, bcrypt password hashing, per-user data isolation |

## 3. Architecture

```
jobpilot-ai/
├── frontend/        React + Vite + Tailwind SPA
├── backend/          FastAPI + SQLAlchemy (SQLite by default)
│   └── app/
│       ├── api/       Route handlers (auth, resume, jobs, misc)
│       ├── models/     SQLAlchemy ORM models
│       ├── schemas/    Pydantic request/response schemas
│       ├── services/   AI analysis, job providers, matching, email
│       ├── agents/      Daily job agent scheduler
│       └── utils/       Auth/security, resume text extraction
├── uploads/          Uploaded resume files (gitignored)
├── .env.example
└── docker-compose.yml
```

## 4. Technologies

- **Frontend:** React 18, Vite, Tailwind CSS, React Router, Axios, lucide-react, recharts
- **Backend:** Python, FastAPI, SQLAlchemy, Pydantic, python-jose (JWT), passlib (bcrypt)
- **AI:** Anthropic API (Claude), structured JSON responses, validated before storage
- **Database:** SQLite (v1), structured for a straightforward swap to PostgreSQL
- **Resume parsing:** pypdf (PDF), python-docx (DOCX)
- **Scheduling:** APScheduler (daily job agent)

## 5. Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- (Optional) Docker + Docker Compose

### Clone / unzip and set up environment
```bash
cd jobpilot-ai
cp .env.example backend/.env
```
Edit `backend/.env` and fill in the values you have (see section 8).

## 6. Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Database setup
No manual step needed — SQLAlchemy creates `jobpilot.db` (SQLite) and all
tables automatically on first run. To move to PostgreSQL later, just change
`DATABASE_URL` in `.env` to a Postgres connection string; the models are
DB-agnostic. Add `alembic` migrations for schema changes in production.

### Run the backend
```bash
uvicorn app.main:app --reload --port 8000
```
API docs: http://localhost:8000/docs
Health check: http://localhost:8000/api/health

## 7. Frontend setup

```bash
cd frontend
npm install
npm run dev
```
App: http://localhost:5173 (proxies `/api` requests to `http://localhost:8000`)

Build for production:
```bash
npm run build
npm run preview
```

## 8. Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `JWT_SECRET` | Yes | Signs auth tokens — set a long random string in production |
| `DATABASE_URL` | No | Defaults to local SQLite file |
| `LLM_API_KEY` | Yes, for AI features | Anthropic API key — resume analysis, resume improvement, assistant all require this |
| `LLM_MODEL` | No | Defaults to `claude-sonnet-4-6` |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` | No | Free keys from https://developer.adzuna.com/ — enables broader real-job search beyond remote-only Remotive |
| `SMTP_HOST` / `SMTP_USERNAME` / `SMTP_PASSWORD` | No | Enables daily email reports; app works fully without this |
| `ALLOW_DEMO_MODE` | No | Set `false` to disable demo fallback entirely |

**Without `LLM_API_KEY`:** resume analysis, resume improvement, and the
application assistant return a clear 503 "AI not configured" error instead
of guessing or failing silently.

**Without any job provider configured/reachable:** job search either shows a
clear configuration message, or — if demo mode is allowed — returns a small
set of jobs clearly labeled `DEMO DATA`, never presented as live listings.

## 9. AI setup

1. Get an API key from https://console.anthropic.com/
2. Set `LLM_API_KEY=sk-ant-...` in `backend/.env`
3. Restart the backend

## 10. Job provider setup

- **Remotive** (remote jobs only): no setup needed, enabled by default.
- **Adzuna** (broader search): sign up free at https://developer.adzuna.com/,
  set `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` in `backend/.env`.
- To add another legitimate provider, implement a new `JobProvider` subclass
  in `backend/app/services/job_providers.py` and register it in
  `get_active_providers()`.

## 11. How to run everything

```bash
# Terminal 1
cd backend && uvicorn app.main:app --reload --port 8000

# Terminal 2
cd frontend && npm run dev
```
Or with Docker:
```bash
docker-compose up --build
```

## 12. Demo mode

If no real job provider is configured or reachable, job search results fall
back to a small, clearly labeled set of sample jobs (`is_demo: true`, shown
in the UI with a **DEMO DATA** badge). This is for local testing only and is
never presented as a live opportunity. Set `ALLOW_DEMO_MODE=false` to disable
this fallback and instead surface a configuration error.

## 13. Testing the complete workflow

1. Register an account at `/register`.
2. Upload a resume (PDF/DOCX) at `/resume`.
3. Click **Analyze resume** → review your profile and ATS score at `/resume/analysis`.
4. Go to `/jobs`, search a title/location → see ranked, scored matches.
5. Open a job → view the match breakdown, generate resume-improvement
   suggestions, and draft application content with the assistant.
6. Save jobs (`/saved`) and mark applications (`/applications`), updating
   status as you progress.
7. Check `/dashboard` for your overall funnel and resume score.

## 14. Troubleshooting

| Problem | Fix |
|---|---|
| `AI analysis is not configured` | Set `LLM_API_KEY` in `backend/.env` and restart |
| Job search only returns demo jobs | Configure `ADZUNA_APP_ID`/`ADZUNA_APP_KEY`, or check your network allows outbound calls to remotive.com / api.adzuna.com |
| `Could not extract text from this PDF` | The PDF is likely a scanned image with no text layer — try a DOCX or a text-based PDF |
| 401 errors in the frontend | Your token expired — log in again |
| CORS errors | Confirm the frontend origin is listed in `allow_origins` in `backend/app/main.py` |

## 15. Future improvements

- PostgreSQL + Alembic migrations for production deployments
- Vector-embedding based semantic skill matching alongside the rule-based engine
- More job providers (LinkedIn/Indeed only via their official partner APIs, not scraping)
- Resume rewriting exports (DOCX/PDF) incorporating accepted suggestions
- Team/recruiter view
- Rate limiting and audit logging for production hardening

---
**Development rules honored:** no fake "live" jobs are ever generated —
demo data is always flagged `is_demo`; no API keys are hard-coded; the
assistant never fabricates candidate experience; nothing is auto-submitted —
applying always opens the original listing for the user to complete.
