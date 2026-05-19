from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional
from pydantic import BaseModel
from app.services.guardrails import guardrails_service, TriageItem
from app.services.flywheel import flywheel_service

router = APIRouter()

class TriageResolutionSchema(BaseModel):
    action: str  # APPROVED (real defect) or REJECTED (false alarm)
    notes: Optional[str] = None

@router.get("/", response_model=List[TriageItem])
def get_triage_queue():
    """
    Returns all visual inspection records currently awaiting human visual triage.
    """
    return guardrails_service.get_triage_queue()

@router.post("/{board_id}/resolve", response_model=TriageItem)
def resolve_triage_item(board_id: str, payload: TriageResolutionSchema, background_tasks: BackgroundTasks):
    """
    Operator submits a visual audit decision. This releases the board, updates downstream MES
    electrical matching, and writes high-priority labeled assets for autonomous retraining.
    """
    if payload.action not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Action must be APPROVED or REJECTED")
        
    resolved_item = guardrails_service.resolve_triage(
        board_id=board_id,
        operator_action=payload.action,
        notes=payload.notes
    )
    
    if not resolved_item:
        raise HTTPException(status_code=404, detail=f"Board {board_id} not found in triage queue")
        
    # Re-package as a visual defect log to push into the MES and retraining dataset
    from app.services.perception import Defect
    mock_defects = []
    if payload.action == "APPROVED":
        # Formulate a verified defect
        mock_defects.append(Defect(
            id=f"DEF_{board_id}_VERIFIED",
            defect_type=resolved_item.defect_type,
            confidence=1.0,
            coordinates=resolved_item.coordinates,
            severity="critical"
        ))
        
    # Trigger Downstream MES Sync and Data Flywheel file writing
    background_tasks.add_task(
        flywheel_service.sync_with_mes_etest,
        board_id,
        mock_defects,
        payload.action
    )
    
    return resolved_item
