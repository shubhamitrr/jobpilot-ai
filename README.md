***# JobPilot AI — AI Resume Analyzer \& Job Search Agent***



***JobPilot AI reads your resume, builds a structured candidate profile, searches***

***real job listings, and scores every job against your profile using a***

***transparent, rule-based matching engine. It tracks saved jobs and***

***applications, and can suggest resume improvements and draft application***

***content — all grounded strictly in your real resume data.***



***\*\*Live demo:\*\* deployed on Render (backend) + Vercel (frontend). See***

***"Deployment" section below for how this project is hosted for free.***



***## 1. Features***



***- Resume upload (PDF/DOCX) with AI-powered extraction: skills, education, experience, projects, certifications, ATS score***

***- Real job search via Adzuna (India-focused) and Remotive (remote jobs)***

***- Transparent, explainable match scoring — not an AI-guessed percentage***

***- Save jobs, track applications (Saved → Applied → Interview → Selected)***

***- AI resume-improvement suggestions per job***

***- AI application assistant (intro, cover letter, "why hire you", etc.)***

***- Dashboard, notifications, daily job-agent preferences***

***- JWT auth, rate limiting, magic-byte upload validation***



***## 2. Tech Stack***



***- Frontend: React, Vite, Tailwind CSS***

***- Backend: Python, FastAPI, SQLAlchemy***

***- Database: PostgreSQL (production) / SQLite (local dev default)***

***- AI: Groq (free, OpenAI-compatible)***

***- Job data: Adzuna API (requires free key), Remotive API (no key needed)***



***## 3. AI Provider Note***



***This project was originally built for Anthropic's Claude API, but the code is provider-agnostic through backend/app/utils/llm\_client.py, which talks to any OpenAI-compatible endpoint. This deployment uses Groq's free tier (https://api.groq.com/openai/v1) since it requires no credit card and has no restrictive key-format issues.***



***Important: Groq periodically deprecates models. If you see a model\_not\_found error, check https://console.groq.com/docs/models for a current model name and update LLM\_MODEL accordingly. At the time of this deployment, openai/gpt-oss-120b was used.***



***Google Gemini was also tried, but its newly-issued AQ.-prefixed API keys currently fail on OpenAI-compatible endpoints (a known, unresolved Google-side issue as of mid-2026) — hence the switch to Groq.***



***## 4. Local Setup***



***### Prerequisites***

***- Python 3.11+ (3.14 has build issues with some dependencies — stick to 3.11)***

***- Node.js 18+***



***### Backend***



***cd backend***

***python -m venv venv***

***venv\\Scripts\\activate***

***pip install -r requirements.txt***



***Copy .env.example to backend/.env and fill in:***



***JWT\_SECRET=some-random-long-string***

***LLM\_API\_KEY=your-groq-key***

***LLM\_MODEL=openai/gpt-oss-120b***

***LLM\_BASE\_URL=https://api.groq.com/openai/v1***

***ADZUNA\_APP\_ID=your-adzuna-app-id***

***ADZUNA\_APP\_KEY=your-adzuna-app-key***

***DATABASE\_URL=sqlite:///./jobpilot.db***



***Note on bcrypt: if you hit "password cannot be longer than 72 bytes" on register, pin bcrypt to a compatible version:***



***pip install "bcrypt<4.1" --force-reinstall***



***Run the backend:***



***uvicorn app.main:app --reload --port 8000***



***Check: http://localhost:8000/api/health***



***### Frontend***



***cd frontend***

***npm install***

***npm run dev***



***App: http://localhost:5173***



***## 5. Deployment (how this project is hosted for free)***



***### Backend to Render***

***1. Push this repo to GitHub***

***2. Render, New, Web Service, connect the repo, root directory backend***

***3. Build command: pip install -r requirements.txt***

***4. Start command: uvicorn app.main:app --host 0.0.0.0 --port $PORT***

***5. Add environment variables (same as .env above) plus:***

&#x20;  ***- PYTHON\_VERSION=3.11.9***

&#x20;  ***- DATABASE\_URL = the Internal Database URL from a Render PostgreSQL instance***

***6. Render's free tier spins the service down after 15 min of inactivity — the first request after that takes \~30-60s to wake it back up***



***### Frontend to Vercel***

***1. Vercel, Add New, Project, import the same GitHub repo***

***2. Root directory: frontend***

***3. Environment variable: VITE\_API\_BASE = https://your-backend.onrender.com/api***

***4. frontend/vercel.json (already in this repo) handles SPA routing***

***5. Deploy — Vercel gives a permanent \*.vercel.app URL***



***### Backend CORS***

***backend/app/main.py has allow\_origins=\["\*"] to allow the Vercel frontend to call the Render backend. Restrict this to your actual frontend domain in a real production setup.***



***## 6. Demo Mode***



***If no real job provider is reachable, job search falls back to a small set of clearly labeled sample jobs (is\_demo: true, shown with a DEMO DATA badge). Never presented as live listings.***



***## 7. Troubleshooting***



***- AI provider request failed: Invalid Auth key -> Check LLM\_API\_KEY/LLM\_BASE\_URL/LLM\_MODEL match your actual provider***

***- model\_not\_found from Groq -> Model was deprecated, check console.groq.com/docs/models for current names***

***- CORS error in browser console -> Confirm backend allow\_origins includes your frontend's domain, and latest code is deployed***

***- 404 on page refresh (Vercel) -> Ensure frontend/vercel.json exists and is deployed***

***- Register fails with bcrypt error -> pip install "bcrypt<4.1" --force-reinstall***

***- Backend slow on first request -> Normal, Render free tier sleeps after 15 min inactivity***

***- psycopg2 / Postgres connection errors -> Ensure psycopg2-binary is in requirements.txt***



***## 8. Security Notes***



***- Never commit real API keys — .env is gitignored***

***- Environment variables are stored securely in Render/Vercel dashboards, not in code***

***- Passwords are bcrypt-hashed; JWT tokens expire after 24h by default***

***- File uploads are validated by extension AND magic bytes (not just filename)***



***## 9. Project Structure***



***jobpilot-ai/***

***- frontend/  (React + Vite + Tailwind SPA, includes vercel.json for routing)***

***- backend/   (FastAPI + SQLAlchemy)***

&#x20; ***- app/api/       Route handlers***

&#x20; ***- app/models/    SQLAlchemy models***

&#x20; ***- app/schemas/   Pydantic schemas***

&#x20; ***- app/services/  AI, job providers, matching, email***

&#x20; ***- app/agents/    Daily job agent scheduler***

&#x20; ***- app/utils/     Auth, rate limiting, LLM client, file validation***

***- uploads/   (Uploaded resume files, local dev only)***

***- .env.example***

