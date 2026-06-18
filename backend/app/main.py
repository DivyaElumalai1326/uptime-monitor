from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routes import router
from .scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    
    # Auto-migrate SQLite to add the is_active column if missing
    from sqlalchemy import text
    with engine.begin() as conn:
        columns = [row[1] for row in conn.execute(text("PRAGMA table_info(urls)")).fetchall()]
        if "is_active" not in columns:
            conn.execute(text("ALTER TABLE urls ADD COLUMN is_active BOOLEAN DEFAULT 1 NOT NULL"))
            
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(title="Uptime Monitor API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def health():
    return {"message": "Uptime Monitor API is running"}
