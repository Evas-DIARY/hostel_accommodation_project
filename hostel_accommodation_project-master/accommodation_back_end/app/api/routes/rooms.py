from fastapi import APIRouter, Depends, HTTPException
from app.services.room_service import RoomService
from app.schemas.room import RoomCreate, RoomUpdate, Room
from app.core.security import get_current_user
from typing import List

router = APIRouter(prefix="/rooms", tags=["rooms"])

@router.post("/", response_model=dict)
async def create_room(
    room: RoomCreate,
    current_user: dict = Depends(get_current_user),
    service: RoomService = Depends()
):
    # Only wardens and admins can create rooms
    if current_user["role"] not in ["warden", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to create rooms")

    return await service.create_room(room)

@router.get("/", response_model=List[dict])
async def get_rooms(
    current_user: dict = Depends(get_current_user),
    service: RoomService = Depends()
):
    return await service.get_all_rooms()

@router.get("/{room_id}", response_model=dict)
async def get_room(
    room_id: str,
    current_user: dict = Depends(get_current_user),
    service: RoomService = Depends()
):
    room = await service.get_room(room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.put("/{room_id}", response_model=dict)
async def update_room(
    room_id: str,
    update_data: RoomUpdate,
    current_user: dict = Depends(get_current_user),
    service: RoomService = Depends()
):
    # Only wardens and admins can update rooms
    if current_user["role"] not in ["warden", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to update rooms")

    room = await service.update_room(room_id, update_data)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.delete("/{room_id}")
async def delete_room(
    room_id: str,
    current_user: dict = Depends(get_current_user),
    service: RoomService = Depends()
):
    # Only wardens and admins can delete rooms
    if current_user["role"] not in ["warden", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete rooms")

    success = await service.delete_room(room_id)
    if not success:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"message": "Room deleted successfully"}
