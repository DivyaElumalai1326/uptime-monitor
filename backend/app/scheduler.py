from apscheduler.schedulers.background import BackgroundScheduler

from .database import SessionLocal
from .services import run_all_checks


scheduler = BackgroundScheduler()


def scheduled_check_job():
    db = SessionLocal()
    try:
        run_all_checks(db)
    finally:
        db.close()


def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(scheduled_check_job, "interval", seconds=60, id="url-health-checks", replace_existing=True)
        scheduler.start()


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
