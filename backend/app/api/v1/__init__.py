# Version 1 controller sub-modules
from fastapi import APIRouter

# Initialize routers for easy import structure
from app.api.v1.camera import router as camera_router
from app.api.v1.batch import router as batch_router
from app.api.v1.triage import router as triage_router
