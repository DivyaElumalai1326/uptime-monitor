from datetime import datetime

from pydantic import BaseModel, HttpUrl


class URLCreate(BaseModel):
    url: HttpUrl


class URLSummary(BaseModel):
    id: int
    url: str
    is_active: bool
    status: str
    status_code: int | None
    response_time_ms: float | None
    last_checked_at: datetime | None
    uptime_percentage: float

    class Config:
        from_attributes = True


class HealthCheckRead(BaseModel):
    id: int
    url_id: int
    status_code: int | None
    response_time_ms: float | None
    is_up: bool
    error_message: str | None
    timestamp: datetime

    class Config:
        from_attributes = True


class URLRead(BaseModel):
    id: int
    url: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class RunChecksResponse(BaseModel):
    processed_urls: int
