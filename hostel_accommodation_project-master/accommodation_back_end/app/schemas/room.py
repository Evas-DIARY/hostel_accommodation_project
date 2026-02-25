from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RoomBase(BaseModel):
    room_number: str
    hostel_id: str
    capacity: int
    occupied: int = 0
    floor: Optional[int] = None
    block: Optional[str] = None
    amenities: Optional[list[str]] = []

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    capacity: Optional[int] = None
    occupied: Optional[int] = None
    floor: Optional[int] = None
    block: Optional[str] = None
    amenities: Optional[list[str]] = None

class Room(RoomBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
