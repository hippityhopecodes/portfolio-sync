from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint for testing"""
    return {
        "message": "Portfolio Sync API - Minimal Version",
        "status": "working",
        "note": "Running without Google APIs for testing"
    }

@app.get("/api/portfolio/summary")
async def get_portfolio():
    """
    Get portfolio data (mock data for now)
    """
    return {
        "total_value": 125750.00,
        "total_cost": 118500.00,
        "total_gain_loss": 7250.00,
        "by_broker": {
            "Fidelity": {"total_cost": 65000.00, "total_value": 68500.00, "gain_loss": 3500.00},
            "Webull": {"total_cost": 35000.00, "total_value": 38750.00, "gain_loss": 3750.00},
            "Kraken": {"total_cost": 18500.00, "total_value": 18500.00, "gain_loss": 0.00}
        },
        "positions": [
            {"symbol": "AAPL", "shares": 10, "cost_basis": 150.00, "current_price": 175.00, "broker": "Fidelity"},
            {"symbol": "GOOGL", "shares": 2, "cost_basis": 2400.00, "current_price": 2600.00, "broker": "Webull"}
        ],
        "last_updated": "2025-07-20T12:00:00Z",
        "note": "Mock data - minimal version for testing"
    }

@app.post("/api/portfolio/refresh")
async def refresh_portfolio():
    """
    Refresh portfolio data
    """
    return {"status": "success", "message": "Portfolio refreshed (mock)"}

# Export for Vercel
handler = app
