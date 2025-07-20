from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .api.portfolio_tracker import PortfolioTracker
from .config import settings
import os

# Initialize FastAPI app
app = FastAPI(title="PortfolioSync")

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files - go up two levels from src/backend to reach src/frontend
static_path = os.path.join(os.path.dirname(__file__), "..", "..", "src", "frontend", "static")
app.mount("/src/frontend/static", StaticFiles(directory=static_path), name="static")

# Serve the main HTML file at root (the one in the project root)
@app.get("/")
async def read_index():
    index_path = os.path.join(os.path.dirname(__file__), "..", "..", "index.html")
    return FileResponse(index_path)

# Initialize portfolio tracker
portfolio_tracker = PortfolioTracker()

@app.get("/api/portfolio/summary")
async def get_portfolio():
    """
    Get current portfolio data from all accounts
    """
    try:
        portfolio_tracker.update_prices()
        return portfolio_tracker.get_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/portfolio/refresh")
async def refresh_portfolio():
    """
    Force refresh of portfolio data and update prices
    """
    try:
        portfolio_tracker.load_positions()
        portfolio_tracker.update_prices()
        return {"status": "success", "message": "Portfolio refreshed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))