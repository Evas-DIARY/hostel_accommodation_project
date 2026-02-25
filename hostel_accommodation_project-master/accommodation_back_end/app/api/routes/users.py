from fastapi import APIRouter, Depends, HTTPException, Query
from app.services.user_service import UserService
from app.schemas.user import UserCreate, UserUpdate, User
from app.core.security import get_current_user
from typing import List, Optional

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=dict)
async def create_user(
    user: UserCreate,
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends()
):
    # Only admins can create users
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to create users")

    return await service.create_user(user)

@router.get("/", response_model=List[dict])
async def get_users(
    role: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends()
):
    # Only wardens and admins can view users
    if current_user["role"] not in ["warden", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to view users")

    if role:
        return await service.get_users_by_role(role)
    return await service.get_all_users()

@router.get("/{user_id}", response_model=dict)
async def get_user(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends()
):
    # Users can only see their own profile, wardens/admins can see all
    if current_user["role"] not in ["warden", "admin"] and user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this user")

    user = await service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=dict)
async def update_user(
    user_id: str,
    update_data: UserUpdate,
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends()
):
    # Users can update their own profile, admins can update any
    if current_user["role"] != "admin" and user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this user")

    user = await service.update_user(user_id, update_data)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends()
):
    # Only admins can delete users
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete users")

    success = await service.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}
