from datetime import datetime
from time import perf_counter

import requests
from sqlalchemy.orm import Session

from .models import HealthCheck, MonitoredURL


REQUEST_TIMEOUT_SECONDS = 10


def create_url(db: Session, raw_url: str) -> MonitoredURL:
    existing = db.query(MonitoredURL).filter(MonitoredURL.url == raw_url).first()
    if existing:
        return existing

    monitored_url = MonitoredURL(url=raw_url)
    db.add(monitored_url)
    db.commit()
    db.refresh(monitored_url)
    return monitored_url


def check_single_url(db: Session, monitored_url: MonitoredURL) -> HealthCheck:
    start = perf_counter()
    status_code = None
    response_time_ms = None
    error_message = None
    is_up = False

    try:
        response = requests.get(monitored_url.url, timeout=REQUEST_TIMEOUT_SECONDS)
        response_time_ms = round((perf_counter() - start) * 1000, 2)
        status_code = response.status_code
        is_up = 200 <= response.status_code < 400
    except requests.RequestException as exc:
        response_time_ms = round((perf_counter() - start) * 1000, 2)
        error_message = str(exc)

    health_check = HealthCheck(
        url_id=monitored_url.id,
        status_code=status_code,
        response_time_ms=response_time_ms,
        is_up=is_up,
        error_message=error_message,
        timestamp=datetime.utcnow(),
    )
    db.add(health_check)
    db.commit()
    db.refresh(health_check)
    return health_check


def run_all_checks(db: Session) -> int:
    monitored_urls = db.query(MonitoredURL).all()
    for monitored_url in monitored_urls:
        check_single_url(db, monitored_url)
    return len(monitored_urls)


def build_url_summary(monitored_url: MonitoredURL) -> dict:
    checks = monitored_url.health_checks
    latest = checks[0] if checks else None
    successful_count = sum(1 for check in checks if check.is_up)
    uptime_percentage = round((successful_count / len(checks)) * 100, 2) if checks else 0.0

    return {
        "id": monitored_url.id,
        "url": monitored_url.url,
        "status": "UP" if latest and latest.is_up else "DOWN",
        "status_code": latest.status_code if latest else None,
        "response_time_ms": latest.response_time_ms if latest else None,
        "last_checked_at": latest.timestamp if latest else None,
        "uptime_percentage": uptime_percentage,
    }
