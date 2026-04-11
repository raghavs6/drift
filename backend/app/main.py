from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="Drift API",
    version="0.1.0",
    description="FastAPI backend for the Drift outdoor discovery MVP.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "drift-backend"}


@app.get("/api/experiences")
def list_experiences() -> dict[str, list]:
    # Placeholder response until the ranked experience feed is implemented.
    return {"items": []}
