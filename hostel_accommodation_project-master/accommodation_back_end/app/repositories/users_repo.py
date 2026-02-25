from firebase_admin import firestore
from app.core.firebase import db, USERS_COLLECTION
from app.schemas.user import UserCreate, UserUpdate
from typing import List, Optional
import uuid
from datetime import datetime

class UserRepository:
    def __init__(self):
        self.collection = db.collection(USERS_COLLECTION)

    async def create_user(self, user: UserCreate) -> dict:
        user_id = str(uuid.uuid4())
        user_data = user.dict()
        user_data.update({
            "id": user_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })

        self.collection.document(user_id).set(user_data)
        return user_data

    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        doc = self.collection.document(user_id).get()
        return doc.to_dict() if doc.exists else None

    async def get_user_by_email(self, email: str) -> Optional[dict]:
        docs = self.collection.where("email", "==", email).limit(1).stream()
        for doc in docs:
            return doc.to_dict()
        return None

    async def update_user(self, user_id: str, update_data: UserUpdate) -> Optional[dict]:
        doc_ref = self.collection.document(user_id)
        doc = doc_ref.get()
        if not doc.exists:
            return None

        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()
        doc_ref.update(update_dict)
        updated_doc = doc_ref.get()
        return updated_doc.to_dict()

    async def delete_user(self, user_id: str) -> bool:
        doc_ref = self.collection.document(user_id)
        doc = doc_ref.get()
        if not doc.exists:
            return False

        doc_ref.delete()
        return True

    async def get_users_by_role(self, role: str) -> List[dict]:
        docs = self.collection.where("role", "==", role).stream()
        return [doc.to_dict() for doc in docs]

    async def get_all_users(self) -> List[dict]:
        docs = self.collection.stream()
        return [doc.to_dict() for doc in docs]
