from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
import firebase_admin

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        # Verify Firebase token
        decoded_token = auth.verify_id_token(credentials.credentials)
        uid = decoded_token['uid']

        # Get user data from Firestore (assuming we store additional user info there)
        # For now, return basic user info from token
        return {
            "id": uid,
            "email": decoded_token.get("email"),
            "role": decoded_token.get("role", "student")  # Default to student
        }
    except firebase_admin.exceptions.FirebaseError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
