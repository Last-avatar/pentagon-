from fastapi import APIRouter
from app.api.v1 import camera, batch, triage

api_router = APIRouter()

api_router.include_router(camera.router, prefix="/camera", tags=["Camera Control"])
api_router.include_router(batch.router, prefix="/batch", tags=["Batch Analytics"])
api_router.include_router(triage.router, prefix="/triage", tags=["Human Triage Queue"])
