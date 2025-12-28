from fastapi import FastAPI
from backend.models import Game
from typing import List

app = FastAPI(title="Chess OCR API", version="8.0.0")

@app.get("/api/v1/health")
def health_check():
    return {"status": "healthy", "version": "8.0.0"}

@app.get("/api/v1/games", response_model=List[Game])
def get_games():
    # Placeholder for database query
    return []

@app.post("/api/v1/games")
def create_game(game: Game):
    # Placeholder for database insert
    return {"id": 1, "status": "created"}

@app.get("/api/v1/metrics")
def get_metrics():
    return {
        "queue_depth": 0,
        "latency_ms": 150,
        "cpu_usage_percent": 12.5
    }
