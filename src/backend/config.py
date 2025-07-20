# Configuration settings
from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    # Google Sheets info
    sheet_id: str
    sheet_name: str = "Portfolio"
    credentials_path: str = "credentials/google_credentials.json"  # Fixed to match actual filename

    # Subsheet info
    fidelity_range: str = "Fidelity!A2:D"
    webull_range: str = "Webull!A2:C"
    kraken_range: str = "Kraken!A2:C"

    # Market data (seconds)
    cache_duration: int = 60
    rate_limit_delay: float = 1.0  # Increased to 1 second between requests

    model_config = {"env_file": ".env"}

settings = Settings()