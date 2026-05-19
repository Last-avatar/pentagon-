from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.core.logging import logger
from app.core.config import settings

class TriageItem(BaseModel):
    board_id: str
    timestamp: float
    defect_type: str
    confidence: float
    coordinates: List[int]
    status: str = "PENDING"  # PENDING, APPROVED, REJECTED (operator actions)
    operator_notes: Optional[str] = None

class GuardrailsService:
    def __init__(self):
        # Safety Tracking
        self.sequential_defects_count: int = 0
        self.line_halted: bool = False
        
        # Human-in-the-loop Triage Queue
        self.triage_queue: Dict[str, TriageItem] = {}

    def track_board_result(self, board_id: str, status: str) -> Dict[str, Any]:
        """
        Enforces blast-radius guardrails. Tracks consecutive failures and halts the assembly line
        if systematic scrap risk is detected.
        """
        if status in ["FAIL", "ESC_TRIAGE"]:
            self.sequential_defects_count += 1
            logger.warning(f"[Guardrails] Sequential defect registered. Current streak: {self.sequential_defects_count}")
        else:
            # Reset streak on pass
            self.sequential_defects_count = 0
            
        if self.sequential_defects_count >= settings.BLAST_RADIUS_LIMIT:
            self.line_halted = True
            msg = f"BLAST RADIUS LIMIT EXCEEDED! Consecutives defects: {self.sequential_defects_count}. Physical assembly line halted to prevent catastrophic scrap generation."
            logger.error(f"[Guardrails] {msg}")
            return {"line_halted": True, "message": msg}
            
        return {"line_halted": self.line_halted, "message": "Line running normally."}

    def reset_halt(self) -> None:
        self.line_halted = False
        self.sequential_defects_count = 0
        logger.info("[Guardrails] Manual override: physical line halt reset. Resuming production flow.")

    def add_to_triage(self, board_id: str, defect_type: str, confidence: float, coordinates: List[int]) -> TriageItem:
        import time
        item = TriageItem(
            board_id=board_id,
            timestamp=time.time(),
            defect_type=defect_type,
            confidence=confidence,
            coordinates=coordinates
        )
        self.triage_queue[board_id] = item
        logger.warning(f"[Guardrails] Board {board_id} added to human triage queue due to unresolved visual uncertainty.")
        return item

    def get_triage_queue(self) -> List[TriageItem]:
        return list(self.triage_queue.values())

    def resolve_triage(self, board_id: str, operator_action: str, notes: Optional[str] = None) -> Optional[TriageItem]:
        """
        Processes human decisions in the triage queue (operator confirms or overrules the agent).
        This feed becomes labeled training data for the continuous retraining loop (flywheel).
        """
        if board_id not in self.triage_queue:
            return None
            
        item = self.triage_queue[board_id]
        item.status = operator_action  # APPROVED (defect is real) or REJECTED (false alarm)
        item.operator_notes = notes
        
        # Remove from active queue after resolution
        del self.triage_queue[board_id]
        logger.info(f"[Guardrails] Human Triage resolved for board {board_id}: {operator_action}. Feed sent to Data Flywheel.")
        return item

guardrails_service = GuardrailsService()
