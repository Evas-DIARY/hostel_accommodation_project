import firebase_admin
from firebase_admin import credentials, firestore
import os

# Initialize Firebase Admin SDK
try:
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "serviceAccountKey.json")
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print("Firebase initialized successfully")
    else:
        # For development/demo purposes, initialize without credentials
        # This will work for basic operations but won't connect to real Firebase
        firebase_admin.initialize_app()
        print("Firebase initialized in demo mode (no credentials)")
except Exception as e:
    print(f"Firebase initialization error: {e}")
    # For development, continue without Firebase
    pass

# Get Firestore client
try:
    db = firestore.client()
except Exception as e:
    print(f"Firestore client error: {e}")
    db = None

# Collections
USERS_COLLECTION = "users"
ROOMS_COLLECTION = "rooms"
ALLOCATIONS_COLLECTION = "allocations"
HOSTELS_COLLECTION = "hostels"
APPLICATIONS_COLLECTION = "applications"
