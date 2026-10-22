from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="FantasyIQ AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "FantasyIQ AI backend is running!",
        "version": "0.1.0"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FantasyIQ AI"
    }