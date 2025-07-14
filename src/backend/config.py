# Configuration settings
from pydantic import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseSettings):
    sheet_id: str = os.getenv("SHEET_ID")
    sheet_name: str = os.getenv("SHEET_NAME", "Portfolio")
    update_interval: int = int(os.getenv("UPDATE_INTERVAL", 300))
    
    class Config:
        env_file = ".env"

settings = Settings()