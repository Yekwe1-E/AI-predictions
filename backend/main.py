import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI(
    title="BetVision AI API",
    description="Backend for the AI Sports Prediction and Betting Analysis Platform",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api.router import api_router
from models import database, models

# Create database tables
models.Base.metadata.create_all(bind=database.engine)

app.include_router(api_router, prefix="/api/v1")

# Static files path
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend_static")

if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def read_root():
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Welcome to BetVision AI API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

