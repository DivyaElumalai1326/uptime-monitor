from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from .database import get_db
from .models import MonitoredURL
from .schemas import HealthCheckRead, RunChecksResponse, URLCreate, URLRead, URLSummary
from .services import (
    build_url_summary,
    check_single_url,
    create_url,
    delete_url,
    run_all_checks,
    toggle_url_active,
)


router = APIRouter()


@router.post("/urls", response_model=URLRead)
def add_url(payload: URLCreate, db: Session = Depends(get_db)):
    monitored_url = create_url(db, str(payload.url))
    return monitored_url


@router.get("/urls", response_model=list[URLSummary])
def list_urls(db: Session = Depends(get_db)):
    monitored_urls = (
        db.query(MonitoredURL)
        .options(selectinload(MonitoredURL.health_checks))
        .order_by(MonitoredURL.created_at.desc())
        .all()
    )
    return [build_url_summary(monitored_url) for monitored_url in monitored_urls]


@router.get("/history/{url_id}", response_model=list[HealthCheckRead])
def get_history(url_id: int, db: Session = Depends(get_db)):
    monitored_url = (
        db.query(MonitoredURL)
        .options(selectinload(MonitoredURL.health_checks))
        .filter(MonitoredURL.id == url_id)
        .first()
    )
    if not monitored_url:
        raise HTTPException(status_code=404, detail="URL not found")
    return monitored_url.health_checks


@router.post("/checks/run", response_model=RunChecksResponse)
def run_checks_now(db: Session = Depends(get_db)):
    processed_urls = run_all_checks(db)
    return {"processed_urls": processed_urls}


@router.post("/checks/{url_id}", response_model=HealthCheckRead)
def run_single_check(url_id: int, db: Session = Depends(get_db)):
    monitored_url = db.query(MonitoredURL).filter(MonitoredURL.id == url_id).first()
    if not monitored_url:
        raise HTTPException(status_code=404, detail="URL not found")
    return check_single_url(db, monitored_url)


@router.delete("/urls/{url_id}")
def remove_url(url_id: int, db: Session = Depends(get_db)):
    success = delete_url(db, url_id)
    if not success:
        raise HTTPException(status_code=404, detail="URL not found")
    return {"message": "URL deleted successfully"}


@router.patch("/urls/{url_id}/toggle", response_model=URLSummary)
def toggle_url(url_id: int, db: Session = Depends(get_db)):
    updated = toggle_url_active(db, url_id)
    if not updated:
        raise HTTPException(status_code=404, detail="URL not found")
    return build_url_summary(updated)
