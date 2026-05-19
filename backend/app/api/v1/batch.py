from fastapi import APIRouter
from typing import Dict, Any
from app.services.flywheel import flywheel_service
from app.services.guardrails import guardrails_service
from app.services.memory import memory_service

router = APIRouter()

@router.get("/stats")
def get_batch_stats() -> Dict[str, Any]:
    """
    Returns live aggregated batch telemetry, data flywheel learning metrics,
    and guardrail line statuses for the UI charts.
    """
    flywheel_metrics = flywheel_service.get_flywheel_metrics()
    
    return {
        "line_halted": guardrails_service.line_halted,
        "sequential_defects": guardrails_service.sequential_defects_count,
        "flywheel": flywheel_metrics,
        "total_in_triage": len(guardrails_service.get_triage_queue())
    }

@router.get("/cross-board-analysis")
def get_cross_board_analysis() -> Dict[str, Any]:
    """
    Queries vector memory to run semantic batch trend analysis (such as detecting
    machine drift patterns).
    """
    return memory_service.analyze_cross_board_patterns()

@router.post("/reset-halt")
def reset_line_halt() -> Dict[str, Any]:
    """
    Allows operators to clear a safety blast-radius line halt after machinery
    calibration or board inspection.
    """
    guardrails_service.reset_halt()
    return {
        "status": "SUCCESS",
        "message": "Production line resumed successfully.",
        "line_halted": guardrails_service.line_halted
    }
