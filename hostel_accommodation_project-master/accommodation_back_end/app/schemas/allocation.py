from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AllocationBase(BaseModel):
    user_id: str
    room_id: str
    allocated_by: str  # warden/admin id
    academic_year: str
    semester: str

class AllocationCreate(AllocationBase):
    pass

class AllocationUpdate(BaseModel):
    academic_year: Optional[str] = None
    semester: Optional[str] = None

class Allocation(AllocationBase):
    id: str
    allocated_at: datetime
    status: str = "active"  # active, cancelled, completed

    class Config:
        from_attributes = True
