#!/usr/bin/env python3
"""
Simple script to start the FastAPI backend server
"""
import sys
import os

# Add the project root to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

try:
    print("Starting PortfolioSync Backend Server...")
    print(f"Project root: {project_root}")
    
    # Test imports first
    print("Testing imports...")
    from src.backend.main import app
    print("✓ Backend imports successful")
    
    # Import uvicorn
    import uvicorn
    print("✓ Uvicorn available")
    
    # Start the server
    print("Starting server on http://localhost:8000")
    print("API endpoints will be available at:")
    print("  - GET  http://localhost:8000/api/portfolio/summary")
    print("  - POST http://localhost:8000/api/portfolio/refresh")
    print("\nPress Ctrl+C to stop the server")
    print("-" * 50)
    
    uvicorn.run(
        "src.backend.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )
    
except ImportError as e:
    print(f"❌ Import Error: {e}")
    print("\nTroubleshooting steps:")
    print("1. Make sure you're in the project root directory")
    print("2. Check that all required packages are installed")
    print("3. Verify your .env file has the correct SHEET_ID")
    
except Exception as e:
    print(f"❌ Error starting server: {e}")
    import traceback
    traceback.print_exc()
    
finally:
    print("\nServer stopped.")
