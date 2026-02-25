from fastapi import APIRouter, Depends, HTTPException, status
from app.services.allocation_service import AllocationService
from app.schemas.allocation import AllocationCreate, AllocationUpdate, Allocation
from app.api.deps import get_current_user, require_warden
from typing import List, Optional

router = APIRouter()

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def allocate_room(
    allocation: AllocationCreate,
    current_user: dict = Depends(require_warden)
):
    """
    Allocate a room to a student (Warden/Admin only)
    
    Enforces:
    - Room capacity not exceeded
    - Approved application exists first
    - Uses Firestore transactions to prevent double allocation
    - Updates rooms.occupied correctly
    - Hostel gender restrictions
    """
    service = AllocationService()
    try:
        result = await service.allocate_room(allocation, current_user["uid"])
        return {
            "success": True,
            "message": "Room allocated successfully",
            "allocation": result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Allocation failed: {str(e)}")

@router.get("/", response_model=List[dict])
async def get_allocations(
    semester: Optional[str] = None,
    hostel_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get allocations with optional filters
    - Students can only see their own allocations
    - Wardens/Admins can see all allocations
    """
    service = AllocationService()
    
    if current_user["role"] in ["warden", "admin"]:
        return await service.get_all_allocations(
            semester=semester,
            hostel_id=hostel_id,
            status=status
        )
    else:
        # Students can only see their own allocations
        return await service.get_user_allocations(current_user["uid"])

@router.get("/mine", response_model=List[dict])
async def get_my_allocations(
    current_user: dict = Depends(get_current_user)
):
    """
    Get current user's allocations
    """
    service = AllocationService()
    return await service.get_user_allocations(current_user["uid"])

@router.get("/{allocation_id}", response_model=dict)
async def get_allocation(
    allocation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get allocation details by ID
    """
    service = AllocationService()
    allocation = await service.get_allocation(allocation_id)
    
    if not allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")
    
    # Authorization check
    if current_user["role"] not in ["warden", "admin"] and allocation["studentId"] != current_user["uid"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this allocation")
    
    return allocation

@router.get("/user/{user_id}", response_model=List[dict])
async def get_user_allocations(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get allocations for a specific user
    """
    # Authorization check
    if current_user["role"] not in ["warden", "admin"] and user_id != current_user["uid"]:
        raise HTTPException(status_code=403, detail="Not authorized to view these allocations")
    
    service = AllocationService()
    return await service.get_user_allocations(user_id)

@router.get("/room/{room_id}", response_model=List[dict])
async def get_room_allocations(
    room_id: str,
    current_user: dict = Depends(require_warden)
):
    """
    Get all allocations for a specific room (Warden/Admin only)
    """
    service = AllocationService()
    return await service.get_room_allocations(room_id)

@router.patch("/{allocation_id}", response_model=dict)
async def update_allocation(
    allocation_id: str,
    update_data: AllocationUpdate,
    current_user: dict = Depends(require_warden)
):
    """
    Update allocation details (Warden/Admin only)
    """
    service = AllocationService()
    allocation = await service.update_allocation(allocation_id, update_data)
    
    if not allocation:
        raise HTTPException(status_code=404, detail="Allocation not found")
    
    return allocation

@router.patch("/{allocation_id}/end", status_code=status.HTTP_200_OK)
async def end_allocation(
    allocation_id: str,
    current_user: dict = Depends(require_warden)
):
    """
    End/cancel an allocation (Warden/Admin only)
    Updates room occupancy accordingly
    """
    service = AllocationService()
    
    try:
        success = await service.cancel_allocation(allocation_id, current_user["uid"])
        if not success:
            raise HTTPException(status_code=404, detail="Allocation not found")
        
        return {
            "success": True,
            "message": "Allocation ended successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to end allocation: {str(e)}")

@router.delete("/{allocation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_allocation(
    allocation_id: str,
    current_user: dict = Depends(require_warden)
):
    """
    Delete an allocation (Warden/Admin only)
    """
    service = AllocationService()
    success = await service.cancel_allocation(allocation_id, current_user["uid"])
    
    if not success:
        raise HTTPException(status_code=404, detail="Allocation not found")
    
    return None

@router.get("/hostel/{hostel_id}/occupancy")
async def get_hostel_occupancy(
    hostel_id: str,
    current_user: dict = Depends(require_warden)
):
    """
    Get occupancy statistics for a hostel (Warden/Admin only)
    """
    service = AllocationService()
    occupancy = await service.get_hostel_occupancy(hostel_id)
    
    if not occupancy:
        raise HTTPException(status_code=404, detail="Hostel not found")
    
    return occupancy
