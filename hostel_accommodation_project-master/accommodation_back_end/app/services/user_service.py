from app.repositories.users_repo import UserRepository
from app.schemas.user import UserCreate, UserUpdate
from typing import List, Optional

class UserService:
    def __init__(self):
        self.user_repo = UserRepository()

    async def create_user(self, user: UserCreate) -> dict:
        return await self.user_repo.create_user(user)

    async def get_user(self, user_id: str) -> Optional[dict]:
        return await self.user_repo.get_user_by_id(user_id)

    async def get_user_by_email(self, email: str) -> Optional[dict]:
        return await self.user_repo.get_user_by_email(email)

    async def update_user(self, user_id: str, update_data: UserUpdate) -> Optional[dict]:
        return await self.user_repo.update_user(user_id, update_data)

    async def delete_user(self, user_id: str) -> bool:
        return await self.user_repo.delete_user(user_id)

    async def get_users_by_role(self, role: str) -> List[dict]:
        return await self.user_repo.get_users_by_role(role)

    async def get_all_users(self) -> List[dict]:
        return await self.user_repo.get_all_users()
