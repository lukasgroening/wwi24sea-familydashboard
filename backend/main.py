from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Family Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: limit to only exact frontend-URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def read_health_check():
    return {
        "status": "online",
        "message": "Das FastAPI Backend ist bereit!",
        "version": "0.1.0",
    }
