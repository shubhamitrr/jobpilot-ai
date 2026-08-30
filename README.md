# JobPilot AI — AI Resume Analyzer & Job Search Agent

JobPilot AI reads your resume, builds a structured candidate profile, searches real job listings, and scores every job against your profile using a transparent, rule-based matching engine. It tracks saved jobs and applications, and can suggest resume improvements and draft application content — all grounded strictly in your real resume data.

**Live demo:** deployed on Render (backend) + Vercel (frontend). See "Deployment" section below for how this project is hosted for free.

## 1. Overview

- Upload a PDF/DOCX resume → AI extracts a structured candidate profile and an ATS score.
- Search real job sources (Adzuna, Remotive) for roles matching your profile.
- Every job gets a transparent match score: skills, experience, education, location, role.
- Save jobs, track application status (Saved → Applied → Interview → Selected/Rejected).
- Get AI resume-improvement suggestions and application content (cover letter, intro, etc.) per job — never fabricated, only from your actual resume.
- Optional daily agent + notifications for new high-match jobs.
- Clearly labeled Demo Mode for local testing when no real job API is configured.

## 2. Features

| Area | What it does |
|---|---|
| Resume analysis | Extracts name, skills, education, experience, projects, certifications; ATS score 0-100 |
| Job search | Real job search via Adzuna (India-focused) and Remotive (remote jobs) |
| Job matching | Transparent, weighted scoring across 5 dimensions — not an AI-guessed percentage |
| Dashboard | Total jobs, highly/good/low matches, resume score, application funnel |
| Application tracker | Saved / Applied / Assessment / Interview / Rejected / Selected |
| Resume improvement | Per-job keyword gaps, bullet rewrites, skills to learn |
| Application assistant | Intro, "why hire you", "why this job", cover letter, resume summary |
| Daily agent | Optional scheduled search + notifications for new matches |
| Auth | Register/login, JWT, bcrypt password hashing, per-user data isolation |

## 3. Architecture

```
jobpilot-ai/
├── frontend/          React + Vite + Tailwind SPA
├── backend/           FastAPI + SQLAlchemy (SQLite/PostgreSQL)
│   └── app/
│       ├── api/         Route handlers (auth, resume, jobs, misc)
│       ├── models/      SQLAlchemy ORM models
│       ├── schemas/     Pydantic request/response schemas
│       ├── services/    AI analysis, job providers, matching, email
│       ├── agents/      Daily job agent scheduler
│       └── utils/       Auth/security, resume text extraction, LLM client
├── uploads/           Uploaded resume files (local dev only)
├── .env.example
└── README.md
```

## 4. Technologies

- **Frontend:** React 18, Vite, Tailwind CSS, React Router, Axios, lucide-react
- **Backend:** Python, FastAPI, SQLAlchemy, Pydantic, python-jose (JWT), passlib (bcrypt)
- **AI:** Groq (free, OpenAI-compatible endpoint) — see AI Provider Note below
- **Database:** PostgreSQL (production) / SQLite (local dev)
- **Resume parsing:** pypdf (PDF), python-docx (DOCX)
- **Job data:** Adzuna API (free key required), Remotive API (no key needed)

## 5. AI Provider Note

This project was originally built for Anthropic's Claude API, but the code is provider-agnostic through `backend/app/utils/llm_client.py`, which talks to any OpenAI-compatible endpoint. This deployment uses **Groq's free tier** (`https://api.groq.com/openai/v1`) since it requires no credit card and has no restrictive key-format issues.

**Important:** Groq periodically deprecates models. If you see a `model_not_found` error, check https://console.groq.com/docs/models for a current model name and update `LLM_MODEL` accordingly. At the time of this deployment, `openai/gpt-oss-120b` was used.

Google Gemini was also tried, but its newly-issued `AQ.`-prefixed API keys currently fail on OpenAI-compatible endpoints (a known, unresolved Google-side issue as of mid-2026) — hence the switch to Groq.

## 6. Local Setup

### Prerequisites

- Python 3.11+ (3.14 has build issues with some dependencies — stick to 3.11)
- Node.js 18+

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Copy `.env.example` to `backend/.env` and fill in:

```
JWT_SECRET=some-random-long-string
LLM_API_KEY=your-groq-key
LLM_MODEL=openai/gpt-oss-120b
LLM_BASE_URL=https://api.groq.com/openai/v1
ADZUNA_APP_ID=your-adzuna-app-id
ADZUNA_APP_KEY=your-adzuna-app-key
DATABASE_URL=sqlite:///./jobpilot.db
```

**Note on bcrypt:** if you hit `password cannot be longer than 72 bytes` on register:

```bash
pip install "bcrypt<4.1" --force-reinstall
```

Run the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

Check: http://localhost:8000/api/health

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

## 7. Deployment (how this project is hosted for free)

### Backend → Render

1. Push this repo to GitHub
2. Render → New → Web Service → connect the repo, root directory `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (same as `.env` above) plus:
   - `PYTHON_VERSION=3.11.9`
   - `DATABASE_URL` = the Internal Database URL from a Render PostgreSQL instance
6. Render's free tier spins the service down after 15 min of inactivity — the first request after that takes ~30-60s to wake it back up

### Frontend → Vercel

1. Vercel → Add New → Project → import the same GitHub repo
2. Root directory: `frontend`
3. Environment variable: `VITE_API_BASE` = `https://your-backend.onrender.com/api`
4. `frontend/vercel.json` (already in this repo) handles SPA routing so refreshing a page doesn't 404
5. Deploy — Vercel gives a permanent `*.vercel.app` URL

### Backend CORS

`backend/app/main.py` has `allow_origins=["*"]` to allow the Vercel frontend to call the Render backend. Restrict this to your actual frontend domain in a real production setup.

## 8. Demo Mode

If no real job provider is reachable, job search falls back to a small set of clearly labeled sample jobs (`is_demo: true`, shown with a **DEMO DATA** badge). Never presented as live listings.

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `AI provider request failed: Invalid Auth key` | Check `LLM_API_KEY`/`LLM_BASE_URL`/`LLM_MODEL` match your actual provider |
| `model_not_found` from Groq | Model was deprecated — check console.groq.com/docs/models for current names |
| CORS error in browser console | Confirm backend `allow_origins` includes your frontend's domain, and latest code is deployed |
| 404 on page refresh (Vercel) | Ensure `frontend/vercel.json` exists and is deployed |
| Register fails with bcrypt error | `pip install "bcrypt<4.1" --force-reinstall` |
| Backend slow on first request | Normal — Render free tier sleeps after 15 min inactivity |
| psycopg2 / Postgres connection errors | Ensure `psycopg2-binary` is in `requirements.txt` |

## 10. Security Notes

- Never commit real API keys — `.env` is gitignored
- Environment variables are stored securely in Render/Vercel dashboards, not in code
- Passwords are bcrypt-hashed; JWT tokens expire after 24h by default
- File uploads are validated by extension AND magic bytes (not just filename)

## 11. Future Improvements

- Alembic migrations for schema changes in production
- More job providers via official partner APIs
- Resume rewriting exports (DOCX/PDF) incorporating accepted suggestions
- Rate limiting tuned for production traffic
