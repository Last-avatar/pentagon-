from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any
from app.services.perception import perception_service, CameraParameters
from app.services.agent import agent_decision_engine, InspectionResult
from app.services.memory import memory_service
from app.services.guardrails import guardrails_service
from app.services.flywheel import flywheel_service

router = APIRouter()

@router.get("/parameters/{camera_id}", response_model=CameraParameters)
def get_camera_params(camera_id: str):
    params = perception_service.get_camera_parameters(camera_id)
    if not params:
        raise HTTPException(status_code=404, detail=f"Camera {camera_id} not configured")
    return params

@router.post("/parameters/{camera_id}", response_model=CameraParameters)
def update_camera_params(camera_id: str, updates: Dict[str, Any]):
    try:
        updated = perception_service.update_camera_parameters(camera_id, updates)
        return updated
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/inspect/{board_id}", response_model=InspectionResult)
async def trigger_inspection(board_id: str, background_tasks: BackgroundTasks):
    """
    Core route: Initiates the autonomous visual inspection process, triggers camera
    adaptation tools if ambiguity is found, applies safety guardrails, indexes defects
    into memory, and registers the outcome with the down-stream MES flywheel.
    """
    try:
        # 1. Run agentic inspection (includes simulated tool calls and secondary scans)
        result = await agent_decision_engine.inspect_board(board_id)
        
        # 2. Store findings in Vector DB
        if result.defects:
            memory_service.store_defects(board_id, result.defects)
            
        # 3. Apply safety guardrails (sequential failure and blast-radius checks)
        guardrails_status = guardrails_service.track_board_result(board_id, result.status)
        
        # 4. If escalated to human review, add it to the HITL visual triage queue
        if result.status == "ESC_TRIAGE":
            # For simplicity, we add the first found ambiguous defect to triage
            ambiguous_defect = next((d for d in result.defects if d.confidence < 0.75), None)
            if ambiguous_defect:
                guardrails_service.add_to_triage(
                    board_id=board_id,
                    defect_type=ambiguous_defect.defect_type,
                    confidence=ambiguous_defect.confidence,
                    coordinates=ambiguous_defect.coordinates
                )
        else:
            # If not escalated (either PASS or definitive FAIL), immediately sync with down-stream MES
            background_tasks.add_task(
                flywheel_service.sync_with_mes_etest,
                board_id,
                result.defects
            )
            
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Inspection pipeline failure: {str(e)}")
