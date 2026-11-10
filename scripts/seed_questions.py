import os
import json
import time
import urllib.request
from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel, Field

load_dotenv(".env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
GEMINI_KEY = os.getenv("GEMINI_API_KEY")

FALLBACK_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
]

class TimelineEvent(BaseModel):
    id: str
    title: str
    year: int = Field(description="Negative for BCE (e.g., -261), positive for CE (e.g., 1942)")
    detail: str

class TimelineRound(BaseModel):
    prompt: str
    events: list[TimelineEvent] = Field(min_length=4, max_length=4)

class TimelineBatch(BaseModel):
    items: list[TimelineRound]

class MapTarget(BaseModel):
    subject: str = Field(description="history or geography")
    prompt: str
    targetName: str
    lat: float = Field(ge=7.0, le=36.5, description="Latitude within India")
    lng: float = Field(ge=68.5, le=97.0, description="Longitude within India")
    fact: str

class MapBatch(BaseModel):
    items: list[MapTarget]

def generate_with_fallback(client, prompt: str, schema):
    for model_name in FALLBACK_MODELS:
        try:
            print(f"   ↳ Trying {model_name}...")
            return client.models.generate_content(
                model=model_name,
                contents=prompt,
                config={"response_mime_type": "application/json", "response_schema": schema},
            )
        except Exception as e:
            print(f"   ⚠️ {model_name} busy ({e.__class__.__name__}), switching to next model...")
            time.sleep(1)
    raise RuntimeError("All fallback models are currently busy.")

def upload_to_supabase(rows: list[dict], label: str):
    url = f"{SUPABASE_URL}/rest/v1/questions"
    req = urllib.request.Request(
        url,
        data=json.dumps(rows).encode("utf-8"),
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        print(f"✅ Uploaded {len(rows)} {label} to Supabase! (Status: {resp.status})")

def generate_all():
    client = genai.Client(api_key=GEMINI_KEY)

    print("⏳ Generating 5 History Timeline rounds...")
    res_tl = generate_with_fallback(
        client,
        "Generate 5 distinct Indian History chronology rounds for UPSC/CDS/AFCAT exams. "
        "Each round must have a prompt and exactly 4 historical events with distinct years and a 1-line detail.",
        TimelineBatch,
    )
    tl_batch = TimelineBatch.model_validate_json(res_tl.text)
    tl_rows = [
        {
            "subject": "history",
            "game_mode": "timeline",
            "exam_tags": ["CDS", "AFCAT", "UPSC"],
            "difficulty_elo": 1250,
            "payload": item.model_dump(),
        }
        for item in tl_batch.items
    ]
    upload_to_supabase(tl_rows, "Timeline Rounds")

    print("🗺️ Generating 6 India Map Pin-Drop targets...")
    res_map = generate_with_fallback(
        client,
        "Generate 6 high-yield Indian Geography & History map locations (e.g., Indus Valley sites, "
        "mountain passes, National Parks, historic battle sites, dams) with accurate lat/lng coordinates inside India.",
        MapBatch,
    )
    map_batch = MapBatch.model_validate_json(res_map.text)
    map_rows = [
        {
            "subject": item.subject if item.subject in ("history", "geography") else "geography",
            "game_mode": "map_pin",
            "exam_tags": ["CDS", "AFCAT", "UPSC"],
            "difficulty_elo": 1250,
            "payload": {
                "prompt": item.prompt,
                "targetName": item.targetName,
                "lat": item.lat,
                "lng": item.lng,
                "region": "india",
                "fact": item.fact,
            },
        }
        for item in map_batch.items
    ]
    upload_to_supabase(map_rows, "Map Targets")

if __name__ == "__main__":
    generate_all()
