# Configuration settings
import os

# Firebase settings (for development/demo, using environment variables)
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "serviceAccountKey.json")

# API settings
API_V1_STR = "/api/v1"
SECRET_KEY = "your-secret-key-here"  # Change in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# CORS settings
BACKEND_CORS_ORIGINS = ["http://localhost:3000", "http://localhost:8080"]
