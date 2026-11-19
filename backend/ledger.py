import hashlib
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path("wageshield.db")
GENESIS_HASH = "0" * 64


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                worker_name TEXT NOT NULL,
                employer TEXT NOT NULL,
                state TEXT NOT NULL,
                skill_level TEXT NOT NULL,
                hours REAL NOT NULL,
                promised_inr REAL NOT NULL,
                paid_inr REAL NOT NULL,
                gps_coords TEXT,
                transcript TEXT,
                witness_name TEXT,
                witness_signed_at TEXT,
                prev_hash TEXT NOT NULL,
                entry_hash TEXT NOT NULL
            )
        """)


def canonical_hash(prev_hash: str, payload: dict) -> str:
    """Deterministic SHA-256 over previous hash + sorted, compact JSON payload."""
    canonical_str = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    raw = f"{prev_hash}|{canonical_str}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def build_hash_payload(row: dict) -> dict:
    """Fields sealed into the cryptographic chain."""
    return {
        "timestamp": row["timestamp"],
        "worker_name": row["worker_name"],
        "employer": row["employer"],
        "state": row["state"],
        "skill_level": row["skill_level"],
        "hours": float(row["hours"]),
        "promised_inr": float(row["promised_inr"]),
        "paid_inr": float(row["paid_inr"]),
        "gps_coords": row["gps_coords"] or "",
        "transcript": row["transcript"] or "",
    }


def add_entry(data: dict) -> dict:
    with get_db() as conn:
        last = conn.execute("SELECT entry_hash FROM entries ORDER BY id DESC LIMIT 1").fetchone()
        prev_hash = last["entry_hash"] if last else GENESIS_HASH
        ts = datetime.now(timezone.utc).isoformat()

        record = {
            "timestamp": ts,
            "worker_name": data.get("worker_name", "Murugan K."),
            "employer": data["employer"],
            "state": data.get("state", "Tamil Nadu"),
            "skill_level": data.get("skill_level", "unskilled"),
            "hours": float(data.get("hours", 8)),
            "promised_inr": float(data["promised_inr"]),
            "paid_inr": float(data["paid_inr"]),
            "gps_coords": data.get("gps_coords", "12.6096° N, 80.0561° E"),
            "transcript": data.get("transcript", ""),
        }
        entry_hash = canonical_hash(prev_hash, build_hash_payload(record))

        cur = conn.execute("""
            INSERT INTO entries (
                timestamp, worker_name, employer, state, skill_level,
                hours, promised_inr, paid_inr, gps_coords, transcript,
                prev_hash, entry_hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            record["timestamp"], record["worker_name"], record["employer"],
            record["state"], record["skill_level"], record["hours"],
            record["promised_inr"], record["paid_inr"], record["gps_coords"],
            record["transcript"], prev_hash, entry_hash
        ))
        record["id"] = cur.lastrowid
        record["prev_hash"] = prev_hash
        record["entry_hash"] = entry_hash
        return record


def verify_chain() -> dict:
    """Recomputes every block hash from Genesis to tip to pinpoint tampering."""
    with get_db() as conn:
        rows = [dict(r) for r in conn.execute("SELECT * FROM entries ORDER BY id ASC").fetchall()]

    expected_prev = GENESIS_HASH
    chain_valid = True
    broken_at_id = None
    verified_entries = []

    for row in rows:
        recomputed = canonical_hash(expected_prev, build_hash_payload(row))
        is_valid = (row["prev_hash"] == expected_prev) and (row["entry_hash"] == recomputed)
        if not is_valid and chain_valid:
            chain_valid = False
            broken_at_id = row["id"]

        row["is_valid"] = is_valid and chain_valid
        verified_entries.append(row)
        expected_prev = row["entry_hash"]

    return {
        "chain_valid": chain_valid,
        "broken_at_id": broken_at_id,
        "total_blocks": len(verified_entries),
        "entries": verified_entries,
    }


def simulate_tamper(entry_id: int, new_paid_inr: float):
    """Demo utility: modifies DB directly without updating hashes to prove tamper detection."""
    with get_db() as conn:
        conn.execute("UPDATE entries SET paid_inr = ? WHERE id = ?", (new_paid_inr, entry_id))


def co_sign_witness(entry_id: int, witness_name: str):
    ts = datetime.now(timezone.utc).isoformat()
    with get_db() as conn:
        conn.execute(
            "UPDATE entries SET witness_name = ?, witness_signed_at = ? WHERE id = ?",
            (witness_name, ts, entry_id),
        )


def reset_ledger():
    with get_db() as conn:
        conn.execute("DELETE FROM entries")
