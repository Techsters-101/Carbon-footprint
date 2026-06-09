"""
Carbon Footprint Awareness Platform — Backend v3 (India Edition, Expanded)
FastAPI · SQLite · Modular calculator architecture (swap for ML later)

Expanded emission factors (Indian context):
  Transport — Car      : 0.158 kg CO2e / km  (MoEFCC / IPCC AR6)
  Transport — Train AC : 0.012 kg CO2e / km  (Indian Railways, AC coach avg)
  Transport — Flight   : 255   kg CO2e / flight (domestic avg, DGCA data)
  Diet      — Meat     : 2.5   kg CO2e / meal  (blended chicken/mutton/fish)
  Diet      — Delivery : 0.8   kg CO2e / order (packaging + last-mile 2-wheeler)
  Energy    — Elec     : 0.72  kg CO2e / kWh, ₹7/kWh tariff → 0.1029 kg/₹ (CEA 2023)
  Energy    — Devices  : 0.05  kg CO2e / hr/day (avg 50W device × India grid)
"""
import os
import json
from groq import Groq

import sqlite3
import time
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ─────────────────────────────────────────────
# Database
# ─────────────────────────────────────────────
DB_PATH = "carbon_data.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS submissions (
                id                              INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at                      INTEGER NOT NULL,
                transport_car_km_per_week       REAL    NOT NULL DEFAULT 0,
                transport_train_km_per_month    REAL    NOT NULL DEFAULT 0,
                transport_flights_per_year      REAL    NOT NULL DEFAULT 0,
                diet_meat_meals_per_week        INTEGER NOT NULL DEFAULT 0,
                diet_delivery_orders_per_month  INTEGER NOT NULL DEFAULT 0,
                energy_bill_inr_per_month       REAL    NOT NULL DEFAULT 0,
                energy_devices_hours_per_day    REAL    NOT NULL DEFAULT 0,
                transport_score_kg              REAL    NOT NULL,
                diet_score_kg                   REAL    NOT NULL,
                energy_score_kg                 REAL    NOT NULL,
                total_score_kg                  REAL    NOT NULL
            )
        """)
        conn.commit()

def save_submission(payload, t_score, d_score, e_score, total):
    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO submissions (
                created_at,
                transport_car_km_per_week, transport_train_km_per_month, transport_flights_per_year,
                diet_meat_meals_per_week, diet_delivery_orders_per_month,
                energy_bill_inr_per_month, energy_devices_hours_per_day,
                transport_score_kg, diet_score_kg, energy_score_kg, total_score_kg
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            (
                int(time.time()),
                payload.transport_car_km_per_week,
                payload.transport_train_km_per_month,
                payload.transport_flights_per_year,
                payload.diet_meat_meals_per_week,
                payload.diet_delivery_orders_per_month,
                payload.energy_bill_inr_per_month,
                payload.energy_devices_hours_per_day,
                t_score, d_score, e_score, total,
            ),
        )
        conn.commit()

# ─────────────────────────────────────────────
# App Init
# ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="Carbon Footprint API (India v3)",
    description="Expanded Indian-metric carbon scoring. SQLite persistence. ML-ready.",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Pydantic Schema  (7-field expanded quiz)
# ─────────────────────────────────────────────
class QuizPayload(BaseModel):
    # Transport
    transport_car_km_per_week:      float = Field(0, ge=0, le=10_000)
    transport_train_km_per_month:   float = Field(0, ge=0, le=20_000)
    transport_flights_per_year:     float = Field(0, ge=0, le=200)
    # Diet & Lifestyle
    diet_meat_meals_per_week:       int   = Field(0, ge=0, le=21)
    diet_delivery_orders_per_month: int   = Field(0, ge=0, le=200)
    # Energy & Tech
    energy_bill_inr_per_month:      float = Field(0, ge=0, le=50_000)
    energy_devices_hours_per_day:   float = Field(0, ge=0, le=24)

# ─────────────────────────────────────────────
# Calculator Modules
# ─────────────────────────────────────────────

class TransportCalculator:
    KG_PER_CAR_KM      = 0.158   # petrol/diesel car, India avg
    KG_PER_TRAIN_KM    = 0.012   # AC coach, Indian Railways
    KG_PER_FLIGHT      = 255.0   # domestic flight avg

    @classmethod
    def calculate(cls, p: QuizPayload) -> dict:
        car_annual   = p.transport_car_km_per_week * 52 * cls.KG_PER_CAR_KM
        train_annual = p.transport_train_km_per_month * 12 * cls.KG_PER_TRAIN_KM
        flight_annual= p.transport_flights_per_year * cls.KG_PER_FLIGHT
        total = car_annual + train_annual + flight_annual
        return {"score_kg_co2e": round(total, 2), "label": cls._label(total)}

    @staticmethod
    def _label(s):
        if s < 500:  return "Low"
        if s < 1500: return "Moderate"
        if s < 3000: return "High"
        return "Very High"


class DietCalculator:
    KG_PER_MEAT_MEAL    = 2.5    # blended Indian meat meal
    KG_PER_DELIVERY     = 0.8    # packaging + 2-wheeler last-mile

    @classmethod
    def calculate(cls, p: QuizPayload) -> dict:
        meat_annual     = p.diet_meat_meals_per_week * 52 * cls.KG_PER_MEAT_MEAL
        delivery_annual = p.diet_delivery_orders_per_month * 12 * cls.KG_PER_DELIVERY
        total = meat_annual + delivery_annual
        return {"score_kg_co2e": round(total, 2), "label": cls._label(total)}

    @staticmethod
    def _label(s):
        if s < 300:  return "Low"
        if s < 800:  return "Moderate"
        if s < 2000: return "High"
        return "Very High"


class EnergyCalculator:
    KG_PER_INR            = 0.72 / 7.0   # ≈ 0.10286 (CEA 2023, ₹7/kWh tariff)
    # Avg device: 50W, India grid 0.72 kg/kWh → 50W × 0.72/1000 = 0.036 kg/hr
    # Add phone, laptop, headphones blend → ~0.05 kg/hr/day across devices
    KG_PER_DEVICE_HR_DAY  = 0.05 * 365   # annualised

    @classmethod
    def calculate(cls, p: QuizPayload) -> dict:
        elec_annual   = p.energy_bill_inr_per_month * 12 * cls.KG_PER_INR
        device_annual = p.energy_devices_hours_per_day * cls.KG_PER_DEVICE_HR_DAY
        total = elec_annual + device_annual
        return {"score_kg_co2e": round(total, 2), "label": cls._label(total)}

    @staticmethod
    def _label(s):
        if s < 400:  return "Low"
        if s < 1200: return "Moderate"
        if s < 2500: return "High"
        return "Very High"


def get_global_label(score: float) -> str:
    if score < 1000: return "Excellent"
    if score < 2200: return "Below Average"
    if score < 4700: return "Average"
    if score < 8000: return "Above Average"
    return "High Impact"


# ── Hardcoded fallback (used if Groq call fails) ──────────────────────────────
def _fallback_suggestions(t: dict, d: dict, e: dict) -> list[str]:
    scores = {"transport": t["score_kg_co2e"], "diet": d["score_kg_co2e"], "energy": e["score_kg_co2e"]}
    ranked = sorted(scores, key=scores.get, reverse=True)
    tips = {
        "transport": [
            "Switch to Metro or bus for your daily commute — public transit cuts transport emissions by up to 70%.",
            "Carpooling 3 days/week reduces car emissions by ~40%. Try BlaBlaCarBus for intercity trips.",
            "An EV on India's grid still saves ~50% CO₂ vs a petrol car. Explore FAME-II subsidies.",
        ],
        "diet": [
            "Replacing 4 meat meals/week with dal, paneer, or tofu saves 500+ kg CO₂e per year.",
            "Cut delivery orders by batch-cooking 2× a week — saves packaging and 2-wheeler emissions.",
            "Buy local and seasonal produce from nearby mandis to reduce cold-chain transport emissions.",
        ],
        "energy": [
            "Apply for PM Surya Ghar Yojana — free rooftop solar that offsets most home electricity emissions.",
            "Replace old appliances with BEE 5-star rated units; they use 30–50% less electricity.",
            "Set your AC to 24°C and use a ceiling fan — each degree above 18°C saves ~6% energy.",
        ],
    }
    suggestions = []
    for cat in ranked:
        idx = 0 if scores[cat] > 2000 else (1 if scores[cat] > 800 else 2)
        suggestions.append(tips[cat][idx])
    return suggestions[:3]

# ── Groq-powered suggestions with fallback ────────────────────────────────────
def get_suggestions(t: dict, d: dict, e: dict) -> list[str]:
    prompt = f"""You are an empathetic, practical climate expert specialising in the Indian context.

A user has just calculated their annual carbon footprint:
  - Transport : {t['score_kg_co2e']:.1f} kg CO2e  ({t['label']} impact)
  - Diet      : {d['score_kg_co2e']:.1f} kg CO2e  ({d['label']} impact)
  - Energy    : {e['score_kg_co2e']:.1f} kg CO2e  ({e['label']} impact)

Return a JSON object containing a "suggestions" key with exactly 3 strings. 
Each string must be one highly personalised, actionable tip written for someone living in India.
Prioritise the highest-emission category first. Where relevant, mention Indian
specifics such as Metro/KSRTC/BEST buses, dal/paneer as meat alternatives,
PM Surya Ghar Yojana solar subsidies, BEE star ratings, Zomato/Swiggy habits,
or the FAME-II EV scheme.

Rules:
- Output ONLY valid JSON — no markdown, no code fences, no commentary.
- Each tip must be a single sentence under 30 words.
- Do not number the tips inside the strings.

Example output format:
{{
  "suggestions": [
    "Tip one here.",
    "Tip two here.",
    "Tip three here."
  ]
}}"""

    try:
        client = Groq(api_key=os.getenv("GROQ_API_KEY"))

        chat_completion = client.chat.completions.create(
            model="llama3-8b-8192",
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=256,
            timeout=8,          # 8 s — safe for hackathon demo conditions
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a JSON-only climate advisor. "
                        "Always respond with a single JSON object containing "
                        "one key called 'suggestions' whose value is an array of 3 strings."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
        )

        raw = chat_completion.choices[0].message.content.strip()
        parsed = json.loads(raw)

        if isinstance(parsed, dict):
            tips = parsed.get("suggestions") or parsed.get("tips") or next(iter(parsed.values()))
        elif isinstance(parsed, list):
            tips = parsed
        else:
            raise ValueError(f"Unexpected JSON shape: {type(parsed)}")

        if not isinstance(tips, list) or len(tips) < 3:
            raise ValueError(f"Expected 3 tips, got: {tips}")

        return [str(s).strip() for s in tips[:3]]

    except Exception as exc:
        print(f"[Groq fallback] {type(exc).__name__}: {exc}")
        return _fallback_suggestions(t, d, e)
# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "message": "Carbon Footprint API v3 (India) is running."}


@app.get("/api/submissions/count")
def submission_count():
    with get_db() as conn:
        row = conn.execute("SELECT COUNT(*) as count FROM submissions").fetchone()
        return {"total_submissions": row["count"]}


@app.post("/api/calculate")
def calculate_footprint(payload: QuizPayload):
    try:
        t = TransportCalculator.calculate(payload)
        d = DietCalculator.calculate(payload)
        e = EnergyCalculator.calculate(payload)
        total = round(t["score_kg_co2e"] + d["score_kg_co2e"] + e["score_kg_co2e"], 2)
        save_submission(payload, t["score_kg_co2e"], d["score_kg_co2e"], e["score_kg_co2e"], total)
        return {
            "total_score_kg_co2e": total,
            "global_label": get_global_label(total),
            "categories": {
                "transport": {"score_kg_co2e": t["score_kg_co2e"], "label": t["label"]},
                "diet":      {"score_kg_co2e": d["score_kg_co2e"], "label": d["label"]},
                "energy":    {"score_kg_co2e": e["score_kg_co2e"], "label": e["label"]},
            },
            "suggestions": get_suggestions(t, d, e),
            "comparison": {
                "india_avg_kg":  2200,
                "global_avg_kg": 4700,
                "your_score_kg": total,
            },
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)