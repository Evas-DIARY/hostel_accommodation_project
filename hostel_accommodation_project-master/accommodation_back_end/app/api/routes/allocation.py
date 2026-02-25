from fastapi import APIRouter, Depends, HTTPException
from app.services.allocation_service import AllocationService
from app.schemas.allocation import AllocationCreate, AllocationUpdate, Allocation
from app.core.security import get_current_user
from typing import List

router = APIRouter(prefix="/allocations", tags=["allocations"])

@router.post("/", response_model=dict)
async def allocate_room(
    allocation: AllocationCreate,
    current_user: dict = Depends(get_current_user),
    service: AllocationService = Depends()
):
    # Only wardens and admins can allocate rooms
    if current_user["role"] not in ["warden", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to allocate rooms")

    return await service.allocate_room(allocation, current_user["id"])

@router.get("/{allocation_id}", response_model=dict)
async def get_allocation(
    allocation_id: str,
    current_user: dict = Depends(get_current_user),
    service: AllocationService = Depends()
):
    allocation = await service.get_allocation(allocation_id)
    if not allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")

    # Users can only see their own allocations, wardens/admins can see all
    if current_user["role"] not in ["warden", "admin"] and allocation["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this allocation")

    return allocation

@router.get("/user/{user_id}", response_model=List[dict])
async def get_user_allocations(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    service: AllocationService = Depends()
):
    # Users can only see their own allocations, wardens/admins can see all
    if current_user["role"] not in ["warden", "admin"] and user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to view these allocations")

    return await service.get_user_allocations(user_id)

@router.get("/room/{room_id}", response_model=List[dict])
async def get_room_allocations(
    room_id: str,
    current_user: dict = Depends(get_current_user),
    service: AllocationService = Depends()
):
    # Only wardens and admins can view room allocations
    if current_user["role"] not in ["warden", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to view room allocations")

    return await service.get_room_allocations(room_id)

@router.put("/{allocation_id}", response_model=dict)
async def update_allocation(
    allocation_id: str,
    update_data: AllocationUpdate,
    current_user: dict = Depends(get_current_user),
    service: AllocationService = Depends()
):
    # Only wardens and admins can update allocations
    if current_user["role"] not in ["warden", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to update allocations")

    allocation = await service.update_allocation(allocation_id, update_data)
    if not allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")

    return allocation

@router.delete("/{allocation_id}")
async def cancel_allocation(
    allocation_id: str,
    current_user: dict = Depends(get_current_user),
    service: AllocationService = Depends()
):
    # Only wardens and admins can cancel allocations
    if current_user["role"] not in ["warden", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to cancel allocations")

    success = await service.cancel_allocation(allocation_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Allocation not found")

    return {"message": "Allocation cancelled successfully"}

@router.get("/", response_model=List[dict])
async def get_all_allocations(
    current_user: dict = Depends(get_current_user),
    service: AllocationService = Depends()
):
    # Only wardens and admins can view all allocations
    if current_user["role"] not in ["warden", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to view all allocations")

    return await service.get_all_allocations()
