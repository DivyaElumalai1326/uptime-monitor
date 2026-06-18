# Tetriz Uptime Monitor Console

A high-fidelity, real-time developer console and full-stack uptime monitor tailored for engineering intelligence. It tracks endpoint availability, stores diagnostic logs, and maps response latencies dynamically on a readable slate-themed dashboard.



##  1-Line Setup

Run the following command from the root directory to spin up the backend API, frontend dashboard, and automatic health-checking scheduler:

```bash
docker compose up --build
```

* **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
* **Backend Swagger OpenAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **Backend REST API Root**: [http://localhost:8000](http://localhost:8000)

---

## ⚙️ Tech Stack & Architecture

```text
  React SPA (Vite)   <--->   FastAPI API Engine   <--->   SQLite Database
  (Port 5173)                 (Port 8000)                 (backend/data/uptime_monitor.db)
                                   |
                          APScheduler (Background Task)
                          (Pings active URLs every 60s)
```

- **Frontend**: React (v18), Vite, Axios, Recharts (custom Area charts with gradient mapping).
- **Backend**: FastAPI, SQLAlchemy (v2.0 Mapped attributes), Requests (with timeout boundaries), APScheduler (in-process periodic worker).
- **Database**: SQLite (mounted locally to `backend/data/uptime_monitor.db` for persistence).
- **Auto-Schema Migrations**: The backend automatically runs an in-place migration check during startup (`lifespan`) to alter existing tables and inject column dependencies (e.g. `is_active`) without breaking current database logs.

### SQLite Persistence

No database installation or manual setup is required. On first startup, FastAPI creates both tables (`urls` and `health_checks`) in:

```text
backend/data/uptime_monitor.db
```

Docker bind-mounts `backend/data` into the backend container, so URL and check history survives container restarts and `docker compose down`. SQLite runs with foreign keys, Docker Desktop-safe rollback journaling, and a 30-second busy timeout to support the scheduler and manual checks safely for this MVP workload.

Useful lifecycle commands:

```bash
# Run in the background
docker compose up --build -d

# Follow both services' logs
docker compose logs -f

# Stop containers without deleting SQLite data
docker compose down
```

To reset all application data, stop Compose and delete `backend/data/uptime_monitor.db` plus any adjacent `-shm` or `-wal` files. The database is recreated automatically on the next startup.

If every public URL reports `DOWN` with a `NameResolutionError`, the application is working but Docker Desktop DNS is not. Restart Docker Desktop (or run `wsl --shutdown`, then reopen Docker Desktop) and trigger another diagnostic cycle.

### Viewing SQLite Data and Logs

Every scheduled or manual check creates a row in `health_checks`, including failures. Registered endpoints are stored in `urls`. The dashboard shows the latest 50 log rows and latest 60 graph points for the selected URL; older rows remain in SQLite and are available through the API or database tools.

The simplest terminal view is:

```bash
docker compose exec backend python inspect_db.py --limit 50
```

You can also open `backend/data/uptime_monitor.db` using any SQLite desktop application or a SQLite viewer in VS Code. The important tables are:

| Table | Stored data |
| --- | --- |
| `urls` | URL, active/paused state, and registration timestamp |
| `health_checks` | URL ID, HTTP code, response time, UP/DOWN result, error, and check timestamp |

API alternatives are available at [http://localhost:8000/docs](http://localhost:8000/docs):

- `GET /urls` returns every URL with its latest state and lifetime uptime percentage.
- `GET /history/{url_id}` returns every stored check for one URL.
- `POST /checks/run` immediately checks all active URLs.

SQLite stores timestamps in UTC, which is the safest portable format. The dashboard explicitly converts them to Indian Standard Time (`Asia/Kolkata`) and labels them as `IST`.

### How UP and DOWN Are Measured

For each active URL, the backend performs an HTTP `GET` with a 10-second timeout and measures elapsed time with a monotonic high-resolution clock.

- **UP**: the server returns an HTTP status from `200` through `399`, including redirects.
- **DOWN**: the server returns `400` or higher, or the request raises a DNS, connection, TLS, or timeout error.
- **Response time**: time spent connecting and receiving the HTTP response, stored in milliseconds.
- **Uptime percentage**: successful stored checks divided by all stored checks for that URL, multiplied by 100.
- **Automatic schedule**: active URLs are checked every 60 seconds. Manual single-URL and global checks are also stored exactly like scheduled checks.

This is application-level HTTP availability, not ICMP `ping`. A URL can be network-reachable and still be marked `DOWN` if its HTTP response is an error.

### Assignment Requirement Checklist

- [x] FastAPI endpoint registration API.
- [x] Automatic one-minute checks plus manual checks.
- [x] HTTP status, response time, timestamp, result, and error persisted for every check.
- [x] Dynamic React dashboard with UP/DOWN status and latest latency.
- [x] Detailed latency graph and recent diagnostic logs.
- [x] SQLite persistence across container restarts.
- [x] Single-command Docker Compose startup.
- [x] Healthy and intentionally broken URL verification steps.
- [x] README cloud deployment sketch.
- [x] Dedicated `AI_LOG.md` with tools, prompts, and course corrections.

---

##  System Verification & Testing Steps

Follow these steps to verify that the up/down state tracking and latency mapping behave correctly:

1. **Open the Dashboard**: Go to [http://localhost:5173](http://localhost:5173).
2. **Register a Healthy Endpoint**:
   - In the **Register New Endpoint** input, enter: `https://example.com`
   - Click **Register URL**.
   - *Expected Behavior*: The URL is added to the table. A manual diagnostic check runs immediately. The status shows **`UP`** (emerald) with its HTTP status code (e.g., `200`) and latency (e.g., `120 ms`).
3. **Register a Broken Endpoint**:
   - In the input, enter: `https://does-not-exist-1234567.com`
   - Click **Register URL**.
   - *Expected Behavior*: The URL is added to the table. The status shows **`DOWN`** (rose) with no status code (marked as `--`).
4. **Inspect Diagnostic Logs**:
   - Click on `https://does-not-exist-1234567.com` in the table.
   - Look at the right panel under **Recent Diagnostic Cycles**.
   - *Expected Behavior*: You will see the check failure log entry. An error callout will display the raw request exception detail (e.g., `Failed to resolve domain / connection timeout`).
5. **Verify Pause/Resume State**:
   - Click the **Pause** icon button (amber) next to `https://example.com` in the table.
   - *Expected Behavior*: The status badge transitions to **`PAUSED`**. If you click the global **Run Diagnostic Cycle** button, this URL will be skipped by the scheduler.
   - Click the **Resume** icon button (play icon) to reactivate active monitoring.
6. **Trigger Manual Diagnosis**:
   - Click the **Refresh** icon button next to `https://example.com` to force an immediate, out-of-band diagnostic ping for that endpoint.
7. **Delete Endpoint**:
   - Click the **Delete** bin icon next to any URL to delete the URL record and its related health history from the database.

---

##  Deployment Sketch (AWS Topology)

To transition this MVP from local docker-compose orchestration to a highly available, secure, and production-ready cloud deployment, we recommend hosting it on AWS using the following architecture:

### Cloud Infrastructure Diagram
```text
  User Browser
       │
       ▼
  AWS Route 53 (DNS)
       │
  AWS CloudFront (Static SPA CDN) ──► AWS S3 Bucket (Vite Build Artifacts)
       │
       ▼ (Path: /api/*)
  Application Load Balancer (ALB)
       │
       ▼ (Private Subnets)
  AWS ECS Fargate Cluster (FastAPI Containers)
       │
       ├─► Amazon RDS PostgreSQL (Multi-AZ Database)
       └─► Amazon ElastiCache Redis (Shared state & worker locks)
```

- **Frontend Hosting**: Build the Vite React SPA (`npm run build`) and host static assets in an **S3 bucket** frontend-secured via **AWS CloudFront** (CDN) for caching, SSL termination, and minimal edge latencies.
- **Backend API**: Run FastAPI inside dockerized containers hosted on **AWS ECS Fargate** behind an **Application Load Balancer (ALB)**. ECS handles autoscaling across multiple availability zones.
- **Database**: Swap local SQLite for **Amazon RDS PostgreSQL** (configured with Multi-AZ replication for automated backups and failover). Add a PostgreSQL driver such as `psycopg` to the backend image and provide `DATABASE_URL` through ECS task secrets.
- **Background Worker**: In production, decouple the scheduler. Run a dedicated ECS task running a worker process (e.g., using Celery or APScheduler in a single-replica worker container) utilizing **AWS ElastiCache (Redis)** as a database broker/lock store to ensure pings do not duplicate when API web tasks scale horizontally.

### Infrastructure as Code (Terraform Snippet)

Here is a hypothetical, simplified Terraform configuration declaring the ECS Fargate service and RDS Postgres DB instances for this MVP app:

```hcl
# VPC configuration (Public & Private Subnets)
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "tetriz-uptime-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true
}

# RDS Postgres Database
resource "aws_db_instance" "postgres" {
  identifier           = "tetriz-uptime-db"
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = "db.t4g.micro"
  db_name              = "uptime_monitor"
  username             = "tetriz_admin"
  password             = var.db_password
  db_subnet_group_name = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  skip_final_snapshot  = true
}

# ECS Fargate Cluster & Task Definition
resource "aws_ecs_cluster" "main" {
  name = "tetriz-uptime-cluster"
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "tetriz-uptime-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"

  container_definitions = jsonencode([{
    name      = "backend"
    image     = "${var.ecr_repository_url}:latest"
    essential = true
    portMappings = [{
      containerPort = 8000
      hostPort      = 8000
    }]
    environment = [
      { name = "DATABASE_URL", value = "postgresql://tetriz_admin:${var.db_password}@${aws_db_instance.postgres.endpoint}/uptime_monitor" },
      { name = "ENV", value = "production" }
    ]
  }])
}

# Security group mapping database access only to ECS backend tasks
resource "aws_security_group" "db_sg" {
  name   = "tetriz-uptime-db-sg"
  vpc_id = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ecs_tasks_sg" {
  name   = "tetriz-uptime-ecs-sg"
  vpc_id = module.vpc.vpc_id
  # ... open port 8000 ingress from ALB, egress to RDS Postgres and internet ...
}
```

---
