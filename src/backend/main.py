from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .portfolio_manager import PortfolioManager 
from .config import settings

# Initialize the PortfolioManager with credentials from settings
app = FastAPI()

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize PortfolioManager with credentials from settings
portfolio_manager = PortfolioManager(
    fidelity_creds=settings.fidelity_creds,
    webull_creds=settings.webull_creds,
    kraken_creds=settings.kraken_creds
)

@app.get("/api/portfolio")
async def get_portfolio():
    """
    Get current portfolio data from all accounts
    """
    return await portfolio_manager.get_total_portfolio()

@app.post("/api/portfolio/refresh")
async def refresh_portfolio():
    """
    Force refresh of portfolio data and update prices
    """
    await portfolio_manager.update_prices()
    return await portfolio_manager.get_total_portfolio()
