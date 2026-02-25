from firebase_admin import firestore
from app.core.firebase import db, ROOMS_COLLECTION
from app.schemas.room import RoomCreate, RoomUpdate
from typing import List, Optional
import uuid
from datetime import datetime

class RoomRepository:
    def __init__(self):
        self.collection = db.collection(ROOMS_COLLECTION)

    async def create_room(self, room: RoomCreate) -> dict:
        room_id = str(uuid.uuid4())
        room_data = room.dict()
        room_data.update({
            "id": room_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })

        self.collection.document(room_id).set(room_data)
        return room_data

    async def get_room_by_id(self, room_id: str) -> Optional[dict]:
        doc = self.collection.document(room_id).get()
        return doc.to_dict() if doc.exists else None

    async def get_rooms_by_hostel(self, hostel_id: str) -> List[dict]:
        docs = self.collection.where("hostel_id", "==", hostel_id).stream()
        return [doc.to_dict() for doc in docs]

    async def update_room(self, room_id: str, update_data: RoomUpdate) -> Optional[dict]:
        doc_ref = self.collection.document(room_id)
        doc = doc_ref.get()
        if not doc.exists:
            return None

        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()
        doc_ref.update(update_dict)
        updated_doc = doc_ref.get()
        return updated_doc.to_dict()

    async def update_room_occupancy(self, room_id: str, new_occupied: int) -> bool:
        doc_ref = self.collection.document(room_id)
        doc = doc_ref.get()
        if not doc.exists:
            return False

        doc_ref.update({"occupied": new_occupied, "updated_at": datetime.utcnow()})
        return True

    async def delete_room(self, room_id: str) -> bool:
        doc_ref = self.collection.document(room_id)
        doc = doc_ref.get()
        if not doc.exists:
            return False

        doc_ref.delete()
        return True

    async def get_all_rooms(self) -> List[dict]:
        docs = self.collection.stream()
        return [doc.to_dict() for doc in docs]
