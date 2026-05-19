import asyncio
import time
from typing import List, Dict, Any
from pydantic import BaseModel
from app.core.logging import logger
from app.core.config import settings
from app.core.telemetry_bus import telemetry_bus
from app.services.perception import perception_service, Defect

class ThoughtStep(BaseModel):
    timestamp: float
    step_type: str  # info, reasoning, tool_call, tool_response, decision
    message: str

class InspectionResult(BaseModel):
    board_id: str
    defects: List[Defect]
    status: str  # PASS, FAIL, ESC_TRIAGE
    thoughts: List[ThoughtStep]

class AgenticDecisionEngine:
    def __init__(self):
        pass

    async def inspect_board(self, board_id: str) -> InspectionResult:
        """
        Executes the autonomous AI-Native agentic reasoning loop for inspecting a single board.
        """
        thoughts: List[ThoughtStep] = []
        
        async def add_thought(step_type: str, message: str):
            step = ThoughtStep(timestamp=time.time(), step_type=step_type, message=message)
            thoughts.append(step)
            logger.info(f"[{board_id}] {step_type.upper()}: {message}")
            # Emit telemetry through the bus
            await telemetry_bus.emit("agent_thought", {
                "board_id": board_id,
                "step": step.model_dump()
            })

        await add_thought("info", f"Initiating autonomous inspection for board assembly ID: {board_id}")
        
        # 1. Initial capture
        camera_id = "CAM_TOP_HDI"
        await add_thought("reasoning", f"Requesting primary top-down scan using camera {camera_id} with standard light parameters (500 lux, 45°).")
        
        # Reset camera parameters to baseline for the new board
        perception_service.update_camera_parameters(camera_id, {
            "led_lux": 500.0,
            "led_angle": 45.0,
            "zoom_level": 1.0,
            "exposure_ms": 20.0
        })
        
        # Yield to event loop to simulate camera trigger delay
        await asyncio.sleep(0.4)
        
        initial_defects = perception_service.capture_and_detect(board_id, camera_id)
        
        if not initial_defects:
            await add_thought("decision", "No anomalies detected in primary scan. Board passes initial visual quality threshold.")
            return InspectionResult(
                board_id=board_id,
                defects=[],
                status="PASS",
                thoughts=thoughts
            )
            
        # 2. Analyze defects and identify uncertainty
        ambiguous_defects = [d for d in initial_defects if d.confidence < settings.UNCERTAINTY_TRIAGE_THRESHOLD]
        clear_defects = [d for d in initial_defects if d.confidence >= settings.UNCERTAINTY_TRIAGE_THRESHOLD]
        
        if not ambiguous_defects:
            await add_thought("decision", f"High-confidence defect(s) detected. Total count: {len(clear_defects)}. Escalating board for immediate rework.")
            return InspectionResult(
                board_id=board_id,
                defects=clear_defects,
                status="FAIL",
                thoughts=thoughts
            )
            
        # 3. Handle Ambiguity Agentically (The Triage & Adaptation Loop)
        await add_thought("reasoning", f"Detected {len(ambiguous_defects)} ambiguous anomaly under default lighting conditions. Executing adaptation protocols.")
        
        active_defects = list(initial_defects)
        
        for defect in ambiguous_defects:
            await add_thought("reasoning", f"Analyzing anomaly {defect.id} ({defect.defect_type}) at coordinates {defect.coordinates}. Current confidence is only {defect.confidence*100}%. Glare or shadow suspected.")
            
            # Select optimal tool based on defect type to clear ambiguity
            if defect.defect_type == "solder_bridge":
                await add_thought("tool_call", "Tool activated: adjust_lighting. Shifting ring LED structure to coaxial-polarized configuration (250 lux, 90° angle) to suppress high specular solder reflections.")
                perception_service.update_camera_parameters(camera_id, {
                    "led_lux": 250.0,
                    "led_angle": 90.0
                })
                
            elif defect.defect_type == "hairline_crack":
                await add_thought("tool_call", "Tool activated: adjust_lighting & adjust_zoom. Shifting light to high oblique angle (20° angle) to project shadow contrast in micro-fracture and zooming camera by 2.0x.")
                perception_service.update_camera_parameters(camera_id, {
                    "led_angle": 20.0,
                    "zoom_level": 2.0
                })
                
            elif defect.defect_type == "component_skew":
                await add_thought("tool_call", "Tool activated: adjust_lighting. Increasing LED power to 750 lux at normal angle to eliminate background PCB shadows around 0402 pads.")
                perception_service.update_camera_parameters(camera_id, {
                    "led_lux": 750.0
                })
                
            elif defect.defect_type == "solder_void":
                await add_thought("tool_call", "Tool activated: adjust_zoom & adjust_lighting. Zooming optical lens to 2.5x magnification and raising LED power to 800 lux to penetrate specular shadowing under SMT pads.")
                perception_service.update_camera_parameters(camera_id, {
                    "zoom_level": 2.5,
                    "led_lux": 800.0
                })
                
            elif defect.defect_type == "missing_via":
                await add_thought("tool_call", "Tool activated: adjust_zoom. Zooming optical lens to 1.8x magnification to inspect via copper plating walls.")
                perception_service.update_camera_parameters(camera_id, {
                    "zoom_level": 1.8
                })

            # Simulate hardware adjustment delay
            await asyncio.sleep(0.5)
            await add_thought("tool_response", "Hardware adjustments committed successfully. Capturing secondary high-resolution frame.")
            
            # Re-run perception under adjusted parameters
            secondary_defects = perception_service.capture_and_detect(board_id, camera_id)
            
            # Find the corresponding defect in secondary scan
            resolved_defect = next((d for d in secondary_defects if d.defect_type == defect.defect_type), None)
            
            if resolved_defect:
                # Update confidence in our tracker
                idx = next((i for i, d in enumerate(active_defects) if d.id == defect.id), -1)
                if idx != -1:
                    active_defects[idx] = resolved_defect
                
                if resolved_defect.confidence >= settings.UNCERTAINTY_TRIAGE_THRESHOLD:
                    await add_thought("decision", f"Perception resolved! Dynamic lighting adaptation verified defect '{resolved_defect.defect_type}' with {resolved_defect.confidence*100}% confidence. Triage successful.")
                else:
                    await add_thought("reasoning", f"Secondary scan completed. Defect '{resolved_defect.defect_type}' remains ambiguous at {resolved_defect.confidence*100}% confidence. Physical parameters exhausted.")
            else:
                # Anomaly disappeared, it was a glare artifact!
                active_defects = [d for d in active_defects if d.id != defect.id]
                await add_thought("decision", "Perception resolved! Secondary scan reveals the anomaly was an optical glare artifact. Marking board location as CLEAR.")

        # 4. Final Verdict after Adaptation
        final_ambiguous = [d for d in active_defects if d.confidence < settings.UNCERTAINTY_TRIAGE_THRESHOLD]
        final_clear_defects = [d for d in active_defects if d.confidence >= settings.UNCERTAINTY_TRIAGE_THRESHOLD]
        
        if final_ambiguous:
            await add_thought("decision", "Ambiguity unresolved by automated tool-set. Escalating assembly for manual visual review by a lead quality engineer.")
            return InspectionResult(
                board_id=board_id,
                defects=active_defects,
                status="ESC_TRIAGE",
                thoughts=thoughts
            )
        elif final_clear_defects:
            await add_thought("decision", f"Inspection complete. Board fails quality check. Verified SMT defects present: {[d.defect_type for d in final_clear_defects]}. Flagging for rework.")
            return InspectionResult(
                board_id=board_id,
                defects=final_clear_defects,
                status="FAIL",
                thoughts=thoughts
            )
        else:
            await add_thought("decision", "Inspection complete. All ambiguities cleared. Board PASSES Quality Control.")
            return InspectionResult(
                board_id=board_id,
                defects=[],
                status="PASS",
                thoughts=thoughts
            )

agent_decision_engine = AgenticDecisionEngine()
