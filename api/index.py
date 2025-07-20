import json
from urllib.parse import parse_qs
import os

def handler(request, context):
    """Vercel serverless function handler"""
    
    # Handle CORS
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    # Get request method and path
    method = request.get('httpMethod', 'GET')
    path = request.get('path', '/')
    
    # Handle OPTIONS for CORS preflight
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    # Route handling
    if path == '/':
        # Root endpoint
        response_data = {
            "message": "Portfolio Sync API - Serverless",
            "status": "working",
            "method": method,
            "path": path
        }
    elif path == '/api/portfolio/summary':
        # Portfolio summary endpoint
        response_data = {
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
            "note": "Mock data - serverless function"
        }
    elif path == '/api/portfolio/refresh':
        # Refresh endpoint
        response_data = {"status": "success", "message": "Portfolio refreshed (mock)"}
    else:
        # 404 for unknown paths
        return {
            'statusCode': 404,
            'headers': headers,
            'body': json.dumps({"error": "Not found", "path": path})
        }
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(response_data)
    }
