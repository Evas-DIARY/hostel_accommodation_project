from firebase_admin import firestore
from app.core.firebase import db, ALLOCATIONS_COLLECTION
from app.schemas.allocation import AllocationCreate, AllocationUpdate
from typing import List, Optional
import uuid
from datetime import datetime

class AllocationRepository:
    def __init__(self):
        self.collection = db.collection(ALLOCATIONS_COLLECTION)

    async def create_allocation(self, allocation: AllocationCreate) -> dict:
        allocation_id = str(uuid.uuid4())
        allocation_data = allocation.dict()
        allocation_data.update({
            "id": allocation_id,
            "allocated_at": datetime.utcnow(),
            "status": "active"
        })

        self.collection.document(allocation_id).set(allocation_data)
        return allocation_data

    async def get_allocation_by_id(self, allocation_id: str) -> Optional[dict]:
        doc = self.collection.document(allocation_id).get()
        return doc.to_dict() if doc.exists else None

    async def get_allocations_by_user(self, user_id: str) -> List[dict]:
        docs = self.collection.where("user_id", "==", user_id).stream()
        return [doc.to_dict() for doc in docs]

    async def get_allocations_by_room(self, room_id: str) -> List[dict]:
        docs = self.collection.where("room_id", "==", room_id).stream()
        return [doc.to_dict() for doc in docs]

    async def update_allocation(self, allocation_id: str, update_data: AllocationUpdate) -> Optional[dict]:
        doc_ref = self.collection.document(allocation_id)
        doc = doc_ref.get()
        if not doc.exists:
            return None

        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        doc_ref.update(update_dict)
        updated_doc = doc_ref.get()
        return updated_doc.to_dict()

    async def cancel_allocation(self, allocation_id: str) -> bool:
        doc_ref = self.collection.document(allocation_id)
        doc = doc_ref.get()
        if not doc.exists:
            return False

        doc_ref.update({"status": "cancelled"})
        return True

    async def get_all_allocations(self) -> List[dict]:
        docs = self.collection.stream()
        return [doc.to_dict() for doc in docs]
