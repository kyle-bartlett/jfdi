import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
    GOOGLE_CALENDAR_API_KEY = os.getenv("GOOGLE_CALENDAR_API_KEY")
    GOOGLE_EMAIL = os.getenv("GOOGLE_EMAIL")
    DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    LOCATION_LATITUDE = os.getenv("LOCATION_LATITUDE")
    LOCATION_LONGITUDE = os.getenv("LOCATION_LONGITUDE")
    BASE_DATA_DIR = "data"
    RELATIONSHIPS_DIR = os.path.join(BASE_DATA_DIR, "relationships")
    MEETINGS_DIR = os.path.join(BASE_DATA_DIR, "meetings")
    KNOWLEDGE_DIR = os.path.join(BASE_DATA_DIR, "knowledge")
    SPARK_FILE_DIR = os.path.join(BASE_DATA_DIR, "spark_file")
    PROJECTS_DIR = os.path.join(BASE_DATA_DIR, "projects")
    REMINDERS_FILE = os.path.join(BASE_DATA_DIR, "reminders.json")
    DASHBOARD_DATA_DIR = os.path.join(BASE_DATA_DIR, "dashboard_data")
