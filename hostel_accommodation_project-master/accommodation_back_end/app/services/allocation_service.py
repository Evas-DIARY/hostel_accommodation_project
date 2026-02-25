from app.repositories.allocations_repo import AllocationRepository
from app.repositories.rooms_repo import RoomRepository
from app.repositories.users_repo import UserRepository
from app.repositories.applications_repo import ApplicationRepository
from app.schemas.allocation import AllocationCreate, AllocationUpdate, Allocation
from app.schemas.room import RoomUpdate
from typing import List, Optional
from fastapi import HTTPException
from app.core.firebase import db
from google.cloud.firestore_v1 import transactional

class AllocationService:
    def __init__(self):
        self.allocation_repo = AllocationRepository()
        self.room_repo = RoomRepository()
        self.user_repo = UserRepository()
        self.application_repo = ApplicationRepository()

    async def allocate_room(self, allocation: AllocationCreate, allocated_by: str) -> dict:
        """
        Allocate a room to a student with strict business rules enforcement:
        - Room capacity not exceeded
        - Approved application exists first
        - Uses Firestore transactions to prevent double allocation
        - Updates rooms.occupied correctly
        - Hostel gender restrictions
        """
        
        # Check if user exists
        user = await self.user_repo.get_user_by_id(allocation.studentId)
        if not user:
            raise ValueError("Student not found")

        # Check if student has an approved application
        applications = await self.application_repo.get_applications_by_student(allocation.studentId)
        approved_app = next((app for app in applications if app.get("status") == "approved"), None)
        if not approved_app:
            raise ValueError("Student must have an approved application before allocation")

        # Check if student already has an active allocation for this semester
        existing_allocations = await self.allocation_repo.get_allocations_by_user(allocation.studentId)
        active_allocation = next(
            (a for a in existing_allocations 
             if a.get("status") == "active" and a.get("semester") == allocation.semester),
            None
        )
        if active_allocation:
            raise ValueError("Student already has an active allocation for this semester")

        # Use Firestore transaction to prevent race conditions
        @transactional
        def allocate_in_transaction(transaction):
            # Get room reference
            room_ref = db.collection("rooms").document(allocation.roomId)
            room_doc = room_ref.get(transaction=transaction)
            
            if not room_doc.exists:
                raise ValueError("Room not found")
            
            room = room_doc.to_dict()
            
            # Check room capacity
            if room.get("occupied", 0) >= room.get("capacity", 0):
                raise ValueError(f"Room {allocation.roomId} is fully occupied")
            
            # Check gender restrictions if hostel has gender policy
            hostel_ref = db.collection("hostels").document(allocation.hostelId)
            hostel_doc = hostel_ref.get(transaction=transaction)
            
            if hostel_doc.exists:
                hostel = hostel_doc.to_dict()
                if hostel.get("gender") and hostel.get("gender") != "mixed":
                    if user.get("gender") != hostel.get("gender"):
                        raise ValueError(
                            f"Gender mismatch: This hostel is for {hostel.get('gender')} students only"
                        )
            
            # Create allocation document
            allocation_ref = db.collection("allocations").document()
            allocation_data = {
                "studentId": allocation.studentId,
                "applicationId": approved_app.get("id"),
                "hostelId": allocation.hostelId,
                "roomId": allocation.roomId,
                "bedLabel": allocation.bedLabel,
                "semester": allocation.semester,
                "allocatedBy": allocated_by,
                "allocatedAt": firestore.SERVER_TIMESTAMP,
                "status": "active"
            }
            transaction.set(allocation_ref, allocation_data)
            
            # Update room occupancy
            transaction.update(room_ref, {
                "occupied": room.get("occupied", 0) + 1
            })
            
            # Update application status to allocated
            app_ref = db.collection("applications").document(approved_app.get("id"))
            transaction.update(app_ref, {
                "status": "allocated"
            })
            
            return {**allocation_data, "id": allocation_ref.id}
        
        # Execute transaction
        from google.cloud import firestore
        transaction = db.transaction()
        result = allocate_in_transaction(transaction)
        
        return result

    async def get_allocation(self, allocation_id: str) -> Optional[dict]:
        return await self.allocation_repo.get_allocation_by_id(allocation_id)

    async def get_user_allocations(self, user_id: str) -> List[dict]:
        return await self.allocation_repo.get_allocations_by_user(user_id)

    async def get_room_allocations(self, room_id: str) -> List[dict]:
        return await self.allocation_repo.get_allocations_by_room(room_id)

    async def get_all_allocations(
        self,
        semester: Optional[str] = None,
        hostel_id: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[dict]:
        return await self.allocation_repo.get_all_allocations(
            semester=semester,
            hostel_id=hostel_id,
            status=status
        )

    async def update_allocation(self, allocation_id: str, update_data: AllocationUpdate) -> Optional[dict]:
        return await self.allocation_repo.update_allocation(allocation_id, update_data)

    async def cancel_allocation(self, allocation_id: str, cancelled_by: str) -> bool:
        """
        Cancel an allocation and update room occupancy
        """
        allocation = await self.allocation_repo.get_allocation_by_id(allocation_id)
        if not allocation:
            raise ValueError("Allocation not found")

        # Use transaction to ensure consistency
        @transactional
        def cancel_in_transaction(transaction):
            # Update allocation status
            allocation_ref = db.collection("allocations").document(allocation_id)
            transaction.update(allocation_ref, {
                "status": "cancelled",
                "cancelledBy": cancelled_by,
                "cancelledAt": firestore.SERVER_TIMESTAMP
            })
            
            # Update room occupancy
            room_ref = db.collection("rooms").document(allocation["roomId"])
            room_doc = room_ref.get(transaction=transaction)
            if room_doc.exists:
                room = room_doc.to_dict()
                new_occupied = max(0, room.get("occupied", 0) - 1)
                transaction.update(room_ref, {"occupied": new_occupied})
            
            return True
        
        from google.cloud import firestore
        transaction = db.transaction()
        return cancel_in_transaction(transaction)

    async def get_hostel_occupancy(self, hostel_id: str) -> Optional[dict]:
        """
        Get occupancy statistics for a hostel
        """
        rooms = await self.room_repo.get_rooms_by_hostel(hostel_id)
        
        if not rooms:
            return None
        
        total_capacity = sum(room.get("capacity", 0) for room in rooms)
        total_occupied = sum(room.get("occupied", 0) for room in rooms)
        total_available = total_capacity - total_occupied
        occupancy_rate = (total_occupied / total_capacity * 100) if total_capacity > 0 else 0
        
        return {
            "hostelId": hostel_id,
            "totalRooms": len(rooms),
            "totalCapacity": total_capacity,
            "totalOccupied": total_occupied,
            "totalAvailable": total_available,
            "occupancyRate": round(occupancy_rate, 2)
        }
