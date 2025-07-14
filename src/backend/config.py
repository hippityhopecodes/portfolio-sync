# Configuration settings
from pydantic import BaseSettings
class Settings(BaseSettings):
    SHEET_ID: str
    SHEET_NAME: str = "Portfolio"
    UPDATE_INTERVAL: int = 300 

    class Config:
        env_file = ".env"
      
settings = Settings()