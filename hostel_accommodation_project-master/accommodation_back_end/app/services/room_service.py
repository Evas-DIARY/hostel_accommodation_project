from app.repositories.rooms_repo import RoomRepository
from app.schemas.room import RoomCreate, RoomUpdate
from typing import List, Optional

class RoomService:
    def __init__(self):
        self.room_repo = RoomRepository()

    async def create_room(self, room: RoomCreate) -> dict:
        return await self.room_repo.create_room(room)

    async def get_room(self, room_id: str) -> Optional[dict]:
        return await self.room_repo.get_room_by_id(room_id)

    async def get_rooms_by_hostel(self, hostel_id: str) -> List[dict]:
        return await self.room_repo.get_rooms_by_hostel(hostel_id)

    async def update_room(self, room_id: str, update_data: RoomUpdate) -> Optional[dict]:
        return await self.room_repo.update_room(room_id, update_data)

    async def update_room_occupancy(self, room_id: str, new_occupied: int) -> bool:
        return await self.room_repo.update_room_occupancy(room_id, new_occupied)

    async def delete_room(self, room_id: str) -> bool:
        return await self.room_repo.delete_room(room_id)

    async def get_all_rooms(self) -> List[dict]:
        return await self.room_repo.get_all_rooms()
