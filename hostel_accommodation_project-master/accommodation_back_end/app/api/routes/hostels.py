from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.schemas.hostel import HostelCreate, HostelOut, HostelUpdate
from app.services.hostel_service import HostelService
from app.api.deps import get_current_user, require_warden

router = APIRouter()

@router.post("/", response_model=HostelOut, status_code=status.HTTP_201_CREATED)
async def create_hostel(
    hostel: HostelCreate,
    current_user: dict = Depends(require_warden)
):
    """
    Create a new hostel (Warden/Admin only)
    """
    service = HostelService()
    return await service.create_hostel(hostel, current_user["uid"])

@router.get("/", response_model=List[HostelOut])
async def list_hostels(
    gender: str = None,
    is_active: bool = None,
    current_user: dict = Depends(get_current_user)
):
    """
    List all hostels with optional filters
    """
    service = HostelService()
    return await service.get_hostels(gender=gender, is_active=is_active)

@router.get("/{hostel_id}", response_model=HostelOut)
async def get_hostel(
    hostel_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get hostel details by ID
    """
    service = HostelService()
    hostel = await service.get_hostel(hostel_id)
    if not hostel:
        raise HTTPException(status_code=404, detail="Hostel not found")
    return hostel

@router.patch("/{hostel_id}", response_model=HostelOut)
async def update_hostel(
    hostel_id: str,
    hostel_update: HostelUpdate,
    current_user: dict = Depends(require_warden)
):
    """
    Update hostel details (Warden/Admin only)
    """
    service = HostelService()
    updated_hostel = await service.update_hostel(hostel_id, hostel_update)
    if not updated_hostel:
        raise HTTPException(status_code=404, detail="Hostel not found")
    return updated_hostel

@router.delete("/{hostel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hostel(
    hostel_id: str,
    current_user: dict = Depends(require_warden)
):
    """
    Delete/deactivate a hostel (Warden/Admin only)
    """
    service = HostelService()
    success = await service.delete_hostel(hostel_id)
    if not success:
        raise HTTPException(status_code=404, detail="Hostel not found")
    return None

@router.get("/{hostel_id}/occupancy")
async def get_hostel_occupancy(
    hostel_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get occupancy statistics for a hostel
    """
    service = HostelService()
    occupancy = await service.get_hostel_occupancy(hostel_id)
    if not occupancy:
        raise HTTPException(status_code=404, detail="Hostel not found")
    return occupancy
