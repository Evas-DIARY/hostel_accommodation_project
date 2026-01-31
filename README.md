Environment files you’ll need
.env.example
And you keep the real key file in:
(never commit it)
Suggested build order (so your code doesn’t become
messy)
```
├─ deps.py
├─ routes/
│ ├─ applications.py
│ └─ allocations.py
└─ schemas/
├─ application.py
└─ allocation.py
```

1. core/firebase.py (Firestore connection)
2. api/deps.py (verify Firebase ID token + get user role)
3. schemas/ (ApplicationCreate, ApplicationOut, AllocationCreate)
4. repositories/ (basic Firestore CRUD)
5. services/ (rules + transactions)
6. routes/ (connect endpoints to services)

- - - - - - - - - -  - - - -- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -- - 

Project structure explanation
Here’s what each file in that structure is for, in plain, practical terms (what you’ll
actually put inside it).

## Root level files

### README.md
- Project overview: what the backend does
- How to run it locally
- How to set Firebase keys, environment variables
- Example API calls and endpoints

### requirements.txt
- All Python packages the backend needs (FastAPI, firebase-admin, uvicorn, python-dotenv, etc.)

### .env.example
- A template of required environment variables (no secrets)
- Helps teammates set up quickly

### .gitignore
- Prevents committing secrets and junk files (e.g., secrets/ , .env , __pycache__/ )

## app/ (main application code)

### app/main.py
Purpose: The entry point of the backend.
- Creates the FastAPI app instance
- Adds middleware (CORS if needed)
- Includes all API routers from app/api/routes/
- Starts the server when you run uvicorn app.main:app

## app/core/ (core setup + security)

### app/core/config.py
Purpose: Loads and manages configuration.
- Reads .env variables (project ID, key path, environment)
- Stores settings in a central place so you don’t hardcode strings everywhere
- Example items it holds: FIREBASE_PROJECT_ID, SERVICE_ACCOUNT_PATH, ENV

### app/core/firebase.py
Purpose: Firebase initialization.
- Loads Firebase Admin SDK using the service account JSON
- Creates a Firestore client (e.g., db = firestore.client() )
- This is imported everywhere Firestore is needed

### app/core/security.py
Purpose: Authentication and role helpers.
- Verifies Firebase ID tokens (sent from frontend)
- Extracts uid from token
- Contains helper functions like: is_warden(user), require_role(user, "warden")

### app/core/exceptions.py
Purpose: Custom error classes.
- Defines errors like: NotFoundError, RoomFullError, DuplicateApplicationError, UnauthorizedError

## app/api/ (API layer)

### app/api/deps.py
Purpose: FastAPI dependencies (guards and shared logic).
- These dependencies keep your routes clean.
- get_current_user(): Reads Authorization: Bearer <token> , verifies it, loads the user profile from Firestore
- require_student(): Ensures the user role is student
- require_warden(): Ensures the user role is warden/admin

## app/api/routes/ (Endpoints grouped by feature)

### app/api/routes/health.py
Purpose: Simple "is server running?" endpoint.
- GET /health returns "ok"
- Useful for testing deployments

### app/api/routes/users.py
Purpose: User profile endpoints.
- Examples: GET /me → current user details (role, name, reg number), PATCH /me → update profile (optional)

### app/api/routes/applications.py
Purpose: Application endpoints.
- Student: POST /applications apply for accommodation, GET /applications/mine view own application
- Warden: GET /applications?status=submitted list applications, PATCH /applications/{id}/approve, PATCH /applications/{id}/reject

### app/api/routes/hostels.py
Purpose: Hostel management endpoints (warden/admin).
- Create hostel
- List hostels
- Activate/deactivate hostel

### app/api/routes/rooms.py
Purpose: Room management endpoints (warden/admin).
- Create rooms under a hostel
- Update capacity / status
- View room availability

### app/api/routes/allocations.py
Purpose: Allocation endpoints (warden).
- POST /allocations allocate a student to a room/bed
- GET /allocations?semester=... view allocations
- Possibly PATCH /allocations/{id}/end for moving out

### app/api/routes/reports.py
Purpose: Reporting endpoints.
- occupancy per hostel
- free rooms
- allocation summary per semester
- list students without rooms

## app/schemas/ (Pydantic models)
These define what the API expects/returns, ensuring clean validation.

### app/schemas/common.py
Purpose: Shared models and helpers.
- standard response format
- common fields like timestamps
- enums like status values

### app/schemas/user.py
Purpose: User models.
- UserOut , UserUpdate , etc.

### app/schemas/application.py
Purpose: Application models.
- ApplicationCreate (student submits)
- ApplicationOut
- ApplicationDecision (approve/reject payload)

### app/schemas/hostel.py
Purpose: Hostel models.
- HostelCreate , HostelOut

### app/schemas/room.py
Purpose: Room models.
- RoomCreate , RoomOut , RoomUpdate

### app/schemas/allocation.py
Purpose: Allocation models.
- AllocationCreate (warden allocates)
- AllocationOut

## app/repositories/ (Firestore access layer)
These files talk directly to Firestore, but don’t enforce rules.

### users_repo.py
- Create/read/update user documents
- Query by reg number, etc.

### applications_repo.py
- Create application doc
- Get application by student/semester
- Update status and decision info

### hostels_repo.py
- CRUD for hostels

### rooms_repo.py
- CRUD for rooms
- Query available rooms by hostel

### allocations_repo.py
- Create/read allocation docs
- Query allocations by semester/hostel/student

### audit_repo.py
- Insert audit log records
- Query logs (optional)

## app/services/ (business logic layer)
This is where the "real rules" live.

### user_service.py
- Creates student profiles after first login
- Updates user info
- Ensures role logic is respected

### application_service.py
- Enforces: one application per student per semester
- Sets status workflow
- Handles approve/reject logic

### allocation_service.py
- Enforces: room capacity not exceeded
- Ensures approved application exists first
- Uses Firestore transactions to prevent double allocation
- Updates rooms.occupied correctly
- Rules like hostel gender restrictions

### hostel_service.py
- Prevent deleting hostel with active rooms/allocations
- Prevent changing capacity below occupied
- Marks rooms inactive safely

### room_service.py
- (Similar business logic for rooms)

### audit_service.py
- Adds audit logs for actions (approve, reject, allocate)
- Standardizes audit entry format

## app/utils/ (small helpers)

### dates.py
- Timestamp helpers (now, convert, format)
- Semester date utility (if needed)

### ids.py
- Helper to generate IDs if you want consistent custom IDs (optional)

### constants.py
- Hard-coded constants (statuses, roles)
- Example: ROLES = ["student", "warden", "admin"], APPLICATION_STATUSES = [...]

## scripts/ (one-time maintenance scripts)

### seed_data.py
- Creates initial hostels and rooms in Firestore
- Useful for demo and testing

### create_warden.py
- Creates an initial warden profile in users
- (Often the first admin must be created manually)

## tests/ (automated tests)

### test_auth.py
- Tests token validation + role guard logic (mocked)

### test_applications.py
- Tests application workflow: submit → approve → reject

### test_allocations.py
- Tests allocation logic and transactions (room capacity enforcement)
---------------------------------------------------------------------------------------------------------

## Backend and Database

### 1) Recommended architecture
- Client apps (student + warden UI) → call your Python API (FastAPI) → API reads/writes Firestore → API enforces business rules (eligibility, capacity, approvals, allocations)
- Why not let the app talk directly to Firestore? You can, but a backend helps a lot with: strict role-based access (warden vs student), preventing double-allocation, audit logs and approvals, complex queries and validations

### 2) Core features you must support (backend responsibilities)

#### Student side
- Register/login
- Submit accommodation application
- Upload required info (gender, level, program, special needs, etc.)
- Track application status: submitted → under_review → approved/rejected → allocated

#### Warden side
- View applications (filters by gender, year, priority, etc.)
- Approve / reject with reason
- Allocate approved students to rooms (respect capacity + hostel restrictions)
- Manage hostels/rooms/beds
- See occupancy reports

### 3) Firestore data model (collections)

#### A) users (one doc per user)
- Doc ID: Firebase Auth UID
- Example:
  ```json
  {
    "role": "student",
    "regNumber": "AU12345",
    "fullName": "John Doe",
    "email": "john@africau.edu",
    "gender": "male",
    "program": "BSc AI",
    "yearOfStudy": 1,
    "isActive": true,
    "createdAt": "timestamp"
  }
  ```
- Warden users have "role": "warden" (or "admin").

#### B) applications
- Doc ID: auto
- Example:
  ```json
  {
    "studentId": "uid123",
    "regNumber": "AU12345",
    "status": "submitted",
    "semester": "2026S1",
    "preferences": {
      "hostelGender": "male",
      "hostelPreferred": ["Hostel A", "Hostel B"]
    },
    "priorityFlags": {
      "disability": false,
      "finalYear": false
    },
    "notes": "",
    "submittedAt": "timestamp",
    "reviewedBy": null,
    "reviewedAt": null,
    "decisionReason": null
  }
  ```
- Statuses to standardize: submitted, under_review, approved, rejected, allocated, cancelled

#### C) hostels
- Example:
  ```json
  {
    "name": "Hostel A",
    "gender": "male",
    "campus": "Main",
    "isActive": true
  }
  ```

#### D) rooms
- Each room belongs to a hostel.
- Example:
  ```json
  {
    "hostelId": "hostelDocId",
    "roomNumber": "A-101",
    "capacity": 4,
    "occupied": 2,
    "isActive": true
  }
  ```

#### E) allocations
- One allocation record per student per semester.
- Example:
  ```json
  {
    "studentId": "uid123",
    "applicationId": "appDocId",
    "hostelId": "hostelDocId",
    "roomId": "roomDocId",
    "bedLabel": "Bed 2",
    "semester": "2026S1",
    "allocatedBy": "wardenUid",
    "allocatedAt": "timestamp",
    "status": "active"
  }
  ```

#### F) audit_logs (important for accountability)
- Example:
  ```json
  {
    "actorId": "wardenUid",
    "action": "APPROVE_APPLICATION",
    "targetId": "applicationDocId",
    "metadata": {"reason": "Meets requirements"},
    "createdAt": "timestamp"
  }
  ```

### 4) Critical rules to enforce in backend
- A student can have only one active application per semester
- A student can have only one active allocation per semester
- A room cannot exceed capacity
- Hostel gender must match student gender (if your policy requires it)
- Allocation should be done in a Firestore transaction to prevent two students getting the last bed simultaneously

### 5) API endpoints (FastAPI)

#### Auth / user
- POST /auth/register (optional if using Firebase Auth on client)
- GET /me (returns user profile + role)

#### Student
- POST /applications (create application)
- GET /applications/mine (view own application)
- PATCH /applications/{id}/cancel

#### Warden
- GET /applications?status=submitted&semester=2026S1
- PATCH /applications/{id}/approve
- PATCH /applications/{id}/reject
- POST /allocations (allocate student to room)
- GET /occupancy/rooms?hostelId=...
- POST /hostels
- POST /rooms
- PATCH /rooms/{id}

#### Admin/warden management
- (Additional endpoints for managing wardens/admins)

### 6) Minimal backend setup (what you should build first)

#### Step 1: Create Firebase project
- Enable Authentication (Email/Password, or school SSO if available)
- Create Firestore database
- Create a Service Account key (for the backend only)

#### Step 2: Build FastAPI with Firebase Admin SDK
- Backend will: Verify Firebase ID token from client, Check role (student vs warden), Perform Firestore reads/writes with rules/transactions

#### Step 3: Implement these 4 endpoints first (MVP)
- POST /applications (student applies)
- GET /applications/mine
- GET /applications (warden lists)
- POST /allocations (warden allocates with transaction)

### 7) Security approach (important)

#### Firestore Security Rules (basic idea)
- Students can read/write only their own profile and application
- Wardens can read applications + write decisions
- Only backend/service accounts can update occupancy counters if you want extra protection

#### In practice, many teams:
- Keep Firestore locked down tightly
- Let only the backend service account do most writes for "sensitive" actions (approve/allocate)

### 8) What to generate next
- Produce a ready-to-run backend project with: 
- FastAPI project structure
-  Firebase Admin initialization 
- Token verification dependency 
- Role-based route guards
- Firestore CRUD + allocation transaction
-  Pydantic schemas
-  Example .env + run instructions
