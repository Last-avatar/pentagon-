from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    APP_NAME: str = "Autonomous PCB QC Agent"
    API_V1_STR: str = "/api/v1"
    
    # AI and Vector Memory Configuration
    AGENT_MODEL: str = "gemini-1.5-pro"
    VECTOR_DB_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "vector_db")
    
    # Physical/Production Line Limits
    BATCH_SIZE: int = 100
    BLAST_RADIUS_LIMIT: int = 5  # Maximum sequential defects before physical line-halt is triggered
    UNCERTAINTY_TRIAGE_THRESHOLD: float = 0.75  # Confidence below this triggers visual triage adjustment tools / HITL
    
    # External Systems
    MES_MOCK_API: str = "http://mes-line-control.factory.local/api"
    
    # Server configuration
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    class Config:
        case_sensitive = True

settings = Settings()
