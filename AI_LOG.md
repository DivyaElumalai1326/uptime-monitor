# AI Collaboration Log

This log details the collaborative development process between the engineer and the AI coding assistant to build, debug, and polish the Uptime Monitor Console.

## The AI Tech Stack

*## AI Tools & Development Stack Used

- Claude 3.5 Sonnet: Used for initial architecture analysis, requirement breakdown, and deciding the best implementation approach for the uptime monitoring system.

- Google Antigravity: Used as the AI development environment to run, inspect, and iterate on the full-stack application.

- OpenAI Codex GPT-5: Used for final requirement validation, Docker Compose hardening, SQLite persistence verification, UI improvements, IST timestamp handling, graph enhancement, and end-to-end testing.

- Docker Desktop: Used to containerize and run the backend, frontend, and SQLite-backed application with one-command startup through Docker Compose.

- SQLite Viewer / SQLite inspection scripts: Used to verify stored monitored URLs, health check logs, response times, status codes, and timestamps.

- Git / GitHub: Used for version control, commit history, and final project submission.

## The Prompts That Shipped It

Here are the actual human-written prompts used during the development lifecycle:

### Phase 1: Core Backend Framework
> "Hey, set up a new FastAPI backend in Python. I need to monitor a list of URLs by periodically checking them (every 60 seconds). Use SQLite and SQLAlchemy to store the URLs and their health-check logs (status code, latency, UP/DOWN status, and error details if they fail). Add endpoints to create a URL, fetch all URLs with their latest summaries, and fetch check history. Keep the infrastructure simple: use APScheduler inside the main process so we don't have to spin up Celery or Redis for an MVP."

### Phase 2: Frontend Dashboard Setup
> "Now  build the frontend. Create a React app using Vite. I want a clean, responsive developer console style view. We should list all registered URLs in a table, displaying current status, HTTP code, latency, and uptime percentage. If I click a row, show a side detail panel with a line chart showing the latency trend of the last 20 checks, and a log list of recent checks. Polling should occur every 10 seconds. Use Recharts for the chart."

### Phase 3: Pause/Resume, Single Check, & Delete Features
> "The basic flow works, but in production, we need management capabilities. Let's add pause/resume monitoring and delete URL actions. Update the SQL models by adding an `is_active` boolean field to `MonitoredURL`. In the background worker, skip any URLs that aren't active. Write a startup migration hook so we don't crash with `no such column` errors if someone runs this with an existing database file. On the frontend, add action buttons to the table rows to trigger manual checks, toggle pause/resume, and delete the URLs."*

### Phase 4: UI Refactoring & Tetriz.ai Branding
> "The default beige/cream styling looks a bit plain. We're pitching this to veterans who are launching Tetriz.ai, an engineering intelligence platform. Let's completely redesign the CSS. Build a sleek, dark-themed developer dashboard using charcoal (#0b0f19) backgrounds, glassmorphism cards, glowing status neon dots for UP/DOWN/PAUSED states, and JetBrains Mono fonts for coding accents. Turn the Recharts LineChart into a smooth AreaChart with an indigo gradient fill, and write a custom dark-theme HTML tooltip component."

### Phase 5: Assignment Compliance and Docker/SQLite Audit
> "This is my updated code. Change everything in this updated file and, if anything is needed, add it here. Check if SQLite is being configured and everything is done as per the requirement."

> **Audit direction given to Codex**:
> Review the assignment PDF as a checklist, preserve the working product features, make Docker startup reproducible, verify SQLite creation and persistence, test healthy and invalid URLs, and package a clean submission without local virtual environments or `node_modules`.

### Phase 6: Readability, IST, Data Inspection, and Graph Detail
> "How do I view the SQLite database? Every record has to be stored. I want to see the logs and data, the time in IST, a lighter UI with readable text, a more detailed graph, a final requirements check, an explanation of UP/DOWN, and instructions for pushing to Git."

> **Implemented with Codex**:
> Added a container-friendly SQLite inspection command, documented tables and API access, preserved UTC storage while explicitly rendering `Asia/Kolkata` time, increased log/graph history, plotted failed attempts with status-colored points, added graph statistics and richer tooltips, improved contrast with a lighter slate theme, and added a requirement checklist plus GitHub instructions.

---

##  The Course Corrections

During development, the AI generated a few architectural and logic issues. Here is how we corrected course:

### 1. Database Schema Drift (SQLite Column Mismatch)
* **The Problem**: When adding the `is_active` field to the SQL database model, the AI assumed running `Base.metadata.create_all(bind=engine)` would update the existing SQLite schema. However, SQLAlchemy's `create_all` does not alter existing tables. Running `docker compose up` threw a database crash (`sqlalchemy.exc.OperationalError: no such column: urls.is_active`).
* **The Refactoring**: Instead of asking the evaluator to delete their database volume, we instructed the AI to add an inline startup hook:
  ```python
  from sqlalchemy import text
  with engine.begin() as conn:
      columns = [row[1] for row in conn.execute(text("PRAGMA table_info(urls)")).fetchall()]
      if "is_active" not in columns:
          conn.execute(text("ALTER TABLE urls ADD COLUMN is_active BOOLEAN DEFAULT 1 NOT NULL"))
  ```
  This performed an in-place migration gracefully.

### 2. React Event Bubbling (Table Row Clicks)
* **The Problem**: Clicking the **Delete** or **Pause** button inside a table cell triggered the `onClick` event of the parent `<tr>`, which updated the selected URL state. If a user clicked "Delete", the application threw an error because React tried to fetch the history of the URL that was just deleted.
* **The Refactoring**: We resolved this by wrapping the button group's click handler in a propagation barrier:
  ```jsx
  <div className="icon-btn-group" onClick={(e) => e.stopPropagation()}>
     <button onClick={() => onDelete(item.id)}>...</button>
  </div>
  ```
  This isolated row selection from action execution.

### 3. Recharts Container Collapsing in Flexboxes
* **The Problem**: Recharts `<ResponsiveContainer width="100%" height={280}>` collapsed to `0px` height because its parent container (`.chart-shell`) was a flex child without a fixed height constraint in the layout.
* **The Refactoring**: We updated the CSS to give `.chart-shell` a fixed height and padding, and set a dedicated container around the chart to establish a layout boundary.

### 4. Oversized and Non-Reproducible Docker Builds
* **The Problem**: The initial ZIP contained local dependency folders, and the Docker build had no `.dockerignore` files. Docker therefore transferred machine-specific `.venv` and `node_modules` content into the build context. The frontend image also used `npm install` without copying the lockfile, so dependency resolution could vary between builds.
* **The Refactoring**: We added backend and frontend `.dockerignore` files, changed the frontend image to `npm ci` with `package-lock.json`, added backend readiness checks in Compose, and made the browser API URL configurable through `VITE_API_URL`. SQLite was also configured with foreign-key enforcement, a busy timeout, Docker Desktop-safe rollback journaling, and a persisted `backend/data` bind mount. A live restart test caught that WAL mode could lose the newest bind-mounted write on Windows, so it was deliberately replaced before submission.
