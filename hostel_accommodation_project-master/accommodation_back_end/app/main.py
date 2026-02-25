from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app.mount(
    "/frontend",
    StaticFiles(directory=os.path.join(BASE_DIR, "frontend")),
    name="frontend"
)

@app.get("/")
def home():
    return FileResponse(os.path.join(BASE_DIR, "frontend/index.html"))

@app.get("/login")
def login():
    return FileResponse(os.path.join(BASE_DIR, "frontend/pages/login.html"))
