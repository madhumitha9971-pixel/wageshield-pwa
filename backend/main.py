import json
import os
import re
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ledger import (
    init_db, add_entry, verify_chain, simulate_tamper,
    co_sign_witness, reset_ledger
)

app = FastAPI(title="WageShield API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MIN_WAGES = json.loads(Path("min_wages.json").read_text())


@app.on_event("startup")
def startup():
    init_db()


class EntryCreate(BaseModel):
    worker_name: str = "Murugan K."
    employer: str
    state: str = "Tamil Nadu"
    skill_level: str = "unskilled"
    hours: float = 8.0
    promised_inr: float
    paid_inr: float
    gps_coords: str = "12.6096° N, 80.0561° E (Location Consistent)"
    transcript: str = ""


class VoiceTextInput(BaseModel):
    transcript: str
    state: str = "Tamil Nadu"
    worker_name: str = "Murugan K."


class WitnessSign(BaseModel):
    witness_name: str


class TamperRequest(BaseModel):
    entry_id: int
    new_paid_inr: float


@app.get("/api/ledger")
def get_ledger():
    audit = verify_chain()
    total_promised = 0.0
    total_paid = 0.0
    legal_shortfall = 0.0
    underpaid_days = 0

    for e in audit["entries"]:
        state_rates = MIN_WAGES.get(e["state"], MIN_WAGES["Tamil Nadu"])
        min_floor = state_rates["skilled_daily_inr"] if e["skill_level"] == "skilled" else state_rates["unskilled_daily_inr"]
        e["legal_min_inr"] = min_floor
        e["promised_shortfall"] = max(0.0, e["promised_inr"] - e["paid_inr"])
        e["legal_shortfall"] = max(0.0, min_floor - e["paid_inr"])

        total_promised += e["promised_inr"]
        total_paid += e["paid_inr"]
        legal_shortfall += e["legal_shortfall"]
        if e["paid_inr"] < min_floor:
            underpaid_days += 1

    return {
        **audit,
        "summary": {
            "total_promised": total_promised,
            "total_paid": total_paid,
            "promised_shortfall": max(0.0, total_promised - total_paid),
            "legal_min_shortfall": legal_shortfall,
            "underpaid_days": underpaid_days,
        },
        "min_wages": MIN_WAGES,
    }


@app.post("/api/entries")
def create_entry(item: EntryCreate):
    return add_entry(item.model_dump())


@app.post("/api/extract-voice")
def extract_from_transcript(payload: VoiceTextInput):
    """Extracts structured wage fields from Tamil/Hindi/English transcripts via Groq or deterministic fallback."""
    api_key = os.getenv("GROQ_API_KEY")
    if api_key:
        try:
            from groq import Groq
            client = Groq(api_key=api_key)
            prompt = (
                "Extract JSON with keys: employer (str), hours (float), promised_inr (float), "
                "paid_inr (float), skill_level ('skilled' or 'unskilled'). "
                f"Text: {payload.transcript}"
            )
            res = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
            )
            extracted = json.loads(res.choices[0].message.content)
            return add_entry({**extracted, "state": payload.state, "worker_name": payload.worker_name, "transcript": payload.transcript})
        except Exception:
            pass

    # Deterministic fallback parser for offline/demo reliability
    nums = [float(n) for n in re.findall(r"\d+(?:\.\d+)?", payload.transcript)]
    promised = nums[0] if len(nums) >= 1 else 700.0
    paid = nums[1] if len(nums) >= 2 else 300.0
    employer = "Sri Balaji Constructions"
    for marker in ["contractor", "builder", "constructions", "maistry", "seth"]:
        if marker in payload.transcript.lower():
            employer = payload.transcript.split(",")[0][:36].strip().title()
            break

    return add_entry({
        "worker_name": payload.worker_name,
        "employer": employer,
        "state": payload.state,
        "skill_level": "unskilled",
        "hours": 9.0,
        "promised_inr": promised,
        "paid_inr": paid,
        "transcript": payload.transcript,
    })


@app.post("/api/witness/{entry_id}")
def sign_witness(entry_id: int, body: WitnessSign):
    co_sign_witness(entry_id, body.witness_name)
    return {"status": "signed", "entry_id": entry_id, "witness": body.witness_name}


@app.post("/api/demo/tamper")
def tamper_entry(req: TamperRequest):
    simulate_tamper(req.entry_id, req.new_paid_inr)
    return {"status": "tampered", "entry_id": req.entry_id}


@app.post("/api/demo/seed")
def seed_judge_tour():
    reset_ledger()
    e1 = add_entry({
        "worker_name": "Murugan K.",
        "employer": "Kaveri Infra & Builders",
        "state": "Tamil Nadu",
        "skill_level": "unskilled",
        "hours": 9,
        "promised_inr": 750,
        "paid_inr": 400,
        "transcript": "காவேரி பில்டர்ஸ் சைட்டில் 9 மணி நேரம் வேலை. 750 ரூபாய் பேசினார்கள், 400 தான் கொடுத்தார்கள்.",
    })
    co_sign_witness(e1["id"], "Selvam R. (Co-worker)")

    add_entry({
        "worker_name": "Murugan K.",
        "employer": "Kaveri Infra & Builders",
        "state": "Tamil Nadu",
        "skill_level": "unskilled",
        "hours": 10,
        "promised_inr": 750,
        "paid_inr": 0,
        "transcript": "இன்று முழு நாள் வேலை, சம்பளம் நாளை தருகிறேன் என்று சொல்லிவிட்டார்கள்.",
    })
    add_entry({
        "worker_name": "Murugan K.",
        "employer": "Kaveri Infra & Builders",
        "state": "Tamil Nadu",
        "skill_level": "unskilled",
        "hours": 8,
        "promised_inr": 750,
        "paid_inr": 500,
        "transcript": "8 hours centering work at ECR site. Promised 750, paid only 500 cash.",
    })
    return {"status": "seeded"}
