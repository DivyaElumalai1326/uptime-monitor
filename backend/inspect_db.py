"""Print monitored URLs and recent health-check records from SQLite."""

import argparse
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo


DATABASE_PATH = Path(__file__).resolve().parent / "data" / "uptime_monitor.db"
IST = ZoneInfo("Asia/Kolkata")


def utc_to_ist(value: str | None) -> str | None:
    if not value:
        return None
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(IST).strftime("%d %b %Y, %I:%M:%S %p IST")


def print_rows(title: str, rows: list[sqlite3.Row]) -> None:
    print(f"\n{title} ({len(rows)} rows)")
    print("-" * 100)
    for row in rows:
        data = dict(row)
        if "timestamp" in data:
            data["timestamp_ist"] = utc_to_ist(data["timestamp"])
        if "created_at" in data:
            data["created_at_ist"] = utc_to_ist(data["created_at"])
        print(data)


def main() -> None:
    parser = argparse.ArgumentParser(description="Inspect uptime-monitor SQLite records")
    parser.add_argument("--limit", type=int, default=50, help="Maximum health-check rows to print")
    args = parser.parse_args()

    if not DATABASE_PATH.exists():
        raise SystemExit(f"Database not found: {DATABASE_PATH}. Start the backend first.")

    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    try:
        urls = connection.execute(
            "SELECT id, url, is_active, created_at FROM urls ORDER BY id"
        ).fetchall()
        checks = connection.execute(
            """
            SELECT id, url_id, status_code, response_time_ms, is_up,
                   error_message, timestamp
            FROM health_checks
            ORDER BY timestamp DESC
            LIMIT ?
            """,
            (max(args.limit, 1),),
        ).fetchall()
        print(f"SQLite database: {DATABASE_PATH}")
        print("Stored timestamps are UTC; timestamp_ist/created_at_ist are converted for reading.")
        print_rows("MONITORED URLS", urls)
        print_rows("LATEST HEALTH CHECKS", checks)
    finally:
        connection.close()


if __name__ == "__main__":
    main()
