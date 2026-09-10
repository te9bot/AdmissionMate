# AdmissionMate

Study-tracking platform for Bangladeshi HSC/SSC/admission-test students: exam countdowns, a public calendar, and a per-student study planner. See `AdmissionMateprojectspec.md` for the full product spec.

## Stack

- **Backend**: FastAPI + SQLAlchemy 2.0 (async) + PostgreSQL + Redis + Alembic + APScheduler
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind

## 1. Start infra (Postgres + Redis)

```bash
docker-compose up -d
```

Postgres is exposed on host port **5433** (not the default 5432) to avoid clashing with a Postgres you may already have installed locally. Redis is on the default 6379.

## 2. Backend

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

**Email in dev**: `EMAIL_BACKEND=console` (the default) prints OTP codes and notification emails to the backend's console log instead of sending real email — nothing to configure to try the full login flow locally. The `/auth/request-otp` response also echoes the code as `dev_code` while `DEBUG=true`, so the frontend can read it directly. Switch to `EMAIL_BACKEND=smtp` and fill in `SMTP_*` in `.env` to send real email.

Run tests (needs the Postgres/Redis containers running):

```bash
pytest
```

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

- App: http://localhost:3000
- Public calendar (`/`) requires no login. Log in at `/login` using the OTP printed in the backend console.
- The first user must be promoted to `admin` manually in the database to access `/admin`:
  ```sql
  UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
  ```

## Project layout

```
backend/    FastAPI app (see backend/app for structure)
frontend/   Next.js app
docker-compose.yml   Postgres + Redis for local dev
```
