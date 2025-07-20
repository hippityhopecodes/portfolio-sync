from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add the src directory to the path so we can import our modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from src.backend.api.portfolio_tracker import PortfolioTracker

app = FastAPI()

# CORS middleware for GitHub Pages
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your GitHub Pages URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize portfolio tracker
portfolio_tracker = None

def get_portfolio_tracker():
    global portfolio_tracker
    if portfolio_tracker is None:
        portfolio_tracker = PortfolioTracker()
    return portfolio_tracker

@app.get("/api/portfolio/summary")
async def get_portfolio():
    """
    Get current portfolio data from all accounts
    """
    try:
        tracker = get_portfolio_tracker()
        tracker.update_prices()
        return tracker.get_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/portfolio/refresh")
async def refresh_portfolio():
    """
    Force refresh of portfolio data and update prices
    """
    try:
        tracker = get_portfolio_tracker()
        tracker.load_positions()
        tracker.update_prices()
        return {"status": "success", "message": "Portfolio refreshed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Export for Vercel
handler = app
