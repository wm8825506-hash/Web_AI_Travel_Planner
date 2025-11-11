import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "").strip()
    MODEL_NAME = os.getenv("MODEL_NAME", "qwen-plus")
    GAODE_MAP_KEY = os.getenv("GAODE_MAP_KEY", "")
    SPEECH_APP_ID = os.getenv("SPEECH_APP_ID", "")
    SPEECH_API_KEY = os.getenv("SPEECH_API_KEY", "")
    SPEECH_API_SECRET = os.getenv("SPEECH_API_SECRET", "")
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip()
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:@localhost:5432/travel_planner")

settings = Settings()