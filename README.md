# Uptime Monitor MVP

A lightweight full-stack uptime monitor that stores URLs, checks them every 60 seconds, and shows live status on a React dashboard.

## Stack

- Frontend: React + Vite
- Backend: FastAPI + SQLAlchemy + APScheduler
- Database: SQLite
- Local orchestration: Docker Compose

## Project Structure

```text
uptime-monitor/
  backend/
  frontend/
  docker-compose.yml
  README.md
  AI_LOG.md
```

## Run With Docker

```bash
docker compose up --build
```

Open:

- Frontend: http://localhost:5173
- Backend Swagger: http://localhost:8000/docs

## Run In VS Code Without Docker

### 1. Backend

```bash
cd backend
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

## SQLite Database

You do not need to manually create the SQLite database file.

The backend automatically creates:

```text
backend/data/uptime_monitor.db
```

This happens when FastAPI starts and runs `Base.metadata.create_all(...)`.

If you want to inspect it manually in VS Code:

1. Install the SQLite extension in VS Code.
2. Start the backend once.
3. Open `backend/data/uptime_monitor.db`.

## Verification Steps

1. Open the dashboard.
2. Add `https://example.com`.
3. Add `https://invalid-url-123456.com`.
4. Wait for the scheduler or press refresh in the UI.

Expected result:

- `https://example.com` should show `UP`
- `https://invalid-url-123456.com` should show `DOWN`

## API Endpoints

- `POST /urls` to register a URL
- `GET /urls` to list URLs with latest status
- `GET /history/{url_id}` to fetch past checks
- `POST /checks/run` to trigger an immediate health-check cycle

## Deployment Sketch

For a simple cloud deployment:

- React frontend hosted on S3 + CloudFront or Vercel
- FastAPI backend hosted on ECS Fargate, Render, or Railway
- SQLite replaced with PostgreSQL on RDS
- A scheduled worker kept in the same backend service or moved to a background worker container

Example topology:

```text
React SPA
  -> CloudFront

FastAPI API
  -> ECS Fargate

Database
  -> RDS PostgreSQL
```

## GitHub Steps

From the `uptime-monitor` folder:

```bash
git init
git add .
git commit -m "Build uptime monitor MVP"
git branch -M main
git remote add origin https://github.com/<your-username>/uptime-monitor.git
git push -u origin main
```

## Docker Notes

- Backend runs on port `8000`
- Frontend runs on port `5173`
- SQLite file is persisted through the mounted `backend/data` folder
