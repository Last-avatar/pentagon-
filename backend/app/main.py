import asyncio
import time
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.api.router import api_router
from app.core.telemetry_bus import telemetry_bus

# Setup unified logging system
setup_logging()

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Native Agentic Computer Vision System for Printed Circuit Board Manufacturing",
    version="1.0.0"
)

# Enable CORS for the local React developer server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect REST API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# --- WebSocket Telemetry Broadcast Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"New telemetry connection registered. Active streams: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Telemetry connection closed. Active streams: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                # Handle dead connections gracefully
                self.disconnect(connection)

manager = ConnectionManager()

# Global helper to broadcast agent reasoning logs
async def broadcast_telemetry(event_type: str, data: dict):
    await manager.broadcast({
        "timestamp": time.time(),
        "event_type": event_type,  # "agent_thought", "camera_update", "line_halt", "batch_stats"
        "data": data
    })

@app.websocket("/api/v1/ws")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial confirmation and baseline metrics
        await websocket.send_json({
            "event_type": "sys_status",
            "message": "AI-Native PCB Inspection Telemetry Stream Online",
            "timestamp": time.time()
        })
        
        # Keep connection open and listen for optional ping/inputs
        while True:
            data = await websocket.receive_text()
            # Echo or process client messages if needed
            await websocket.send_json({
                "event_type": "echo",
                "message": f"Telemetry received: {data}"
            })
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket telemetry error: {str(e)}")
        manager.disconnect(websocket)

# Background telemetry generator to keep UI looking live and active
@app.on_event("startup")
async def start_background_telemetry():
    telemetry_bus.subscribe(manager.broadcast)
    async def telemetry_loop():
        # Keep broadcasting small background heartbeat status updates to visual dials
        from app.services.perception import perception_service
        from app.services.guardrails import guardrails_service
        from app.services.flywheel import flywheel_service
        
        tick = 0
        while True:
            await asyncio.sleep(3.0)  # Pulse every 3 seconds
            tick += 1
            
            # Formulate simulated live factory background activity (e.g. ambient line temp, light levels)
            camera_state = perception_service.get_camera_parameters("CAM_TOP_HDI")
            camera_data = camera_state.model_dump() if camera_state else {}
            
            await manager.broadcast({
                "timestamp": time.time(),
                "event_type": "line_heartbeat",
                "data": {
                    "tick": tick,
                    "conveyor_speed_m_per_min": 12.5 if not guardrails_service.line_halted else 0.0,
                    "ambient_humidity_pct": 42.8,
                    "lens_temperature_c": 34.2 + (tick % 3) * 0.1,
                    "line_halted": guardrails_service.line_halted,
                    "camera_params": camera_data,
                    "sequential_defects": guardrails_service.sequential_defects_count,
                    "flywheel_accuracy": flywheel_service.get_flywheel_metrics().get("current_accuracy", 100.0)
                }
            })
            
    asyncio.create_task(telemetry_loop())

@app.get("/")
def read_root():
    return {
        "status": "ONLINE",
        "service": settings.APP_NAME,
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
