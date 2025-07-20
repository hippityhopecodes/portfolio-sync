import sys
import os

# Add the src directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from src.backend.api.portfolio_tracker import PortfolioTracker

def handler(request):
    """
    Vercel serverless function for portfolio refresh
    """
    try:
        tracker = PortfolioTracker()
        tracker.load_positions()
        tracker.update_prices()
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            "body": {"status": "success", "message": "Portfolio refreshed"}
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": {"error": str(e)}
        }
