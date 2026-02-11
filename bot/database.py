import asyncio
import logging
import sqlite3
from pathlib import Path


logger = logging.getLogger(__name__)


class Database:
    def __init__(self, path: Path) -> None:
        self.path = path
        self._lock = asyncio.Lock()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.path)
        conn.row_factory = sqlite3.Row
        return conn

    async def init(self) -> None:
        await asyncio.to_thread(self._init_sync)

    def _init_sync(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    user_id INTEGER PRIMARY KEY,
                    username TEXT,
                    first_name TEXT,
                    last_name TEXT,
                    photo_url TEXT,
                    spent_stars INTEGER NOT NULL DEFAULT 0,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            conn.commit()

    async def upsert_user(self, user: dict) -> None:
        if not isinstance(user.get("id"), int):
            return

        async with self._lock:
            await asyncio.to_thread(self._upsert_user_sync, user)

    def _upsert_user_sync(self, user: dict) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO users (user_id, username, first_name, last_name, photo_url)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    username = COALESCE(excluded.username, users.username),
                    first_name = COALESCE(excluded.first_name, users.first_name),
                    last_name = COALESCE(excluded.last_name, users.last_name),
                    photo_url = COALESCE(excluded.photo_url, users.photo_url),
                    updated_at = CURRENT_TIMESTAMP
                """,
                (
                    user["id"],
                    user.get("username"),
                    user.get("first_name"),
                    user.get("last_name"),
                    user.get("photo_url"),
                ),
            )
            conn.commit()

    async def add_spent_stars(self, user_id: int, amount: int) -> None:
        if amount <= 0:
            logger.warning("add_spent_stars_skipped", extra={"user_id": user_id, "amount": amount, "reason": "non_positive_amount"})
            return

        try:
            async with self._lock:
                await asyncio.to_thread(self._add_spent_stars_sync, user_id, amount)
        except Exception:
            logger.exception("add_spent_stars_failed", extra={"user_id": user_id, "amount": amount})
            raise

    def _add_spent_stars_sync(self, user_id: int, amount: int) -> None:
        with self._connect() as conn:
            cursor = conn.execute(
                """
                INSERT INTO users (user_id, spent_stars)
                VALUES (?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    spent_stars = users.spent_stars + excluded.spent_stars,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING spent_stars
                """,
                (user_id, amount),
            )
            row = cursor.fetchone()
            conn.commit()

        logger.info(
            "add_spent_stars_succeeded",
            extra={
                "user_id": user_id,
                "amount_added": amount,
                "current_spent_stars": row["spent_stars"] if row else None,
            },
        )

    async def get_leaderboard(self) -> list[dict]:
        return await asyncio.to_thread(self._get_leaderboard_sync)

    def _get_leaderboard_sync(self) -> list[dict]:
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT user_id, username, first_name, last_name, photo_url, spent_stars
                FROM users
                ORDER BY spent_stars DESC, user_id ASC
                """
            ).fetchall()

        logger.info("get_leaderboard_result", extra={"records_count": len(rows)})

        return [
            {
                "userId": row["user_id"],
                "username": row["username"],
                "firstName": row["first_name"],
                "lastName": row["last_name"],
                "photoUrl": row["photo_url"],
                "spentStars": row["spent_stars"],
            }
            for row in rows
        ]
