# Configuration settings
from pydantic import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    # Google Sheets info
    sheet_id: str
    sheet_name: str = "Portfolio"
    credentials_path: str = "credentials/google_credentials.json"
    token_path: str = "credentials/token.pickle"

    # Subsheet info
    fidelity_range: str = "Fidelity!A2:D"
    webull_range: str = "Webull!A2:C"
    kraken_range: str = "Kraken!A2:C"

    # Market data (seconds)
    cache_duration: int = 60
    rate_limit_delay: float = 0.1

    class Config:
        env_file = ".env"

settings = Settings()