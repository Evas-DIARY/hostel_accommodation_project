from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Import routers
from app.api.routes import applications, allocations, users, hostels, rooms, reports

app = FastAPI(
    title="AU Hostel Accommodation System",
    description="Backend API for Africa University Hostel Management",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Include API routers
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(applications.router, prefix="/api/applications", tags=["Applications"])
app.include_router(allocations.router, prefix="/api/allocations", tags=["Allocations"])
app.include_router(hostels.router, prefix="/api/hostels", tags=["Hostels"])
app.include_router(rooms.router, prefix="/api/rooms", tags=["Rooms"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])

# Mount static files
app.mount(
    "/frontend",
    StaticFiles(directory=os.path.join(BASE_DIR, "../../frontend")),
    name="frontend"
)

@app.get("/")
def home():
    return FileResponse(os.path.join(BASE_DIR, "../../frontend/index.html"))

@app.get("/login")
def login():
    return FileResponse(os.path.join(BASE_DIR, "../../frontend/pages/login.html"))

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "AU Hostel Accommodation System is running"}

