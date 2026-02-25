from app.repositories.allocations_repo import AllocationRepository
from app.repositories.rooms_repo import RoomRepository
from app.repositories.users_repo import UserRepository
from app.schemas.allocation import AllocationCreate, AllocationUpdate, Allocation
from app.schemas.room import RoomUpdate
from typing import List, Optional
from fastapi import HTTPException

class AllocationService:
    def __init__(self):
        self.allocation_repo = AllocationRepository()
        self.room_repo = RoomRepository()
        self.user_repo = UserRepository()

    async def allocate_room(self, allocation: AllocationCreate, allocated_by: str) -> dict:
        # Check if user exists
        user = await self.user_repo.get_user_by_id(allocation.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if room exists and has capacity
        room = await self.room_repo.get_room_by_id(allocation.room_id)
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")

        if room["occupied"] >= room["capacity"]:
            raise HTTPException(status_code=400, detail="Room is fully occupied")

        # Check if user already has an active allocation
        existing_allocations = await self.allocation_repo.get_allocations_by_user(allocation.user_id)
        active_allocation = next((a for a in existing_allocations if a["status"] == "active"), None)
        if active_allocation:
            raise HTTPException(status_code=400, detail="User already has an active allocation")

        # Create allocation
        allocation_data = await self.allocation_repo.create_allocation(allocation)

        # Update room occupancy
        await self.room_repo.update_room_occupancy(allocation.room_id, room["occupied"] + 1)

        return allocation_data

    async def get_allocation(self, allocation_id: str) -> Optional[dict]:
        return await self.allocation_repo.get_allocation_by_id(allocation_id)

    async def get_user_allocations(self, user_id: str) -> List[dict]:
        return await self.allocation_repo.get_allocations_by_user(user_id)

    async def get_room_allocations(self, room_id: str) -> List[dict]:
        return await self.allocation_repo.get_allocations_by_room(room_id)

    async def update_allocation(self, allocation_id: str, update_data: AllocationUpdate) -> Optional[dict]:
        return await self.allocation_repo.update_allocation(allocation_id, update_data)

    async def cancel_allocation(self, allocation_id: str, cancelled_by: str) -> bool:
        allocation = await self.allocation_repo.get_allocation_by_id(allocation_id)
        if not allocation:
            raise HTTPException(status_code=404, detail="Allocation not found")

        # Update room occupancy
        room = await self.room_repo.get_room_by_id(allocation["room_id"])
        if room:
            await self.room_repo.update_room_occupancy(allocation["room_id"], room["occupied"] - 1)

        return await self.allocation_repo.cancel_allocation(allocation_id)

    async def get_all_allocations(self) -> List[dict]:
        return await self.allocation_repo.get_all_allocations()
