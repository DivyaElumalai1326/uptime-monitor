# AI Collaboration Log

## AI Tech Stack

- Codex GPT-5 coding agent
- VS Code for local execution

## Backend Prompt That Shipped

Create a FastAPI uptime monitor backend with SQLite, SQLAlchemy, and APScheduler. It should let users add URLs, store health-check history, expose APIs for current status and history, and run URL checks every 60 seconds.

## Frontend Prompt That Shipped

Create a simple React dashboard that lets a user add a URL, shows current UP or DOWN state, latest response time, last checked timestamp, uptime percentage, and a small response-time history chart. Poll the backend every 10 seconds.

## Course Correction

An early implementation direction could have used extra infrastructure such as Celery and Redis, but that would have been unnecessary for the assignment's MVP scope. The approach was simplified to FastAPI + APScheduler + SQLite so the app stays easy to run locally with Docker Compose.
