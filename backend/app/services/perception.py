import random
import time
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from app.core.logging import logger

class CameraParameters(BaseModel):
    camera_id: str
    led_lux: float = 500.0        # Light intensity in lux
    led_angle: float = 45.0       # Angle in degrees (e.g., 45 for ring light, 90 for coaxial)
    zoom_level: float = 1.0       # Zoom factor
    exposure_ms: float = 20.0     # Exposure time in milliseconds

class Defect(BaseModel):
    id: str
    defect_type: str              # solder_bridge, hairline_crack, component_skew, missing_via, solder_void
    confidence: float
    coordinates: List[int]        # [x_min, y_min, x_max, y_max] in pixels
    severity: str                 # critical, warning, minor
    resolved_by_recapture: bool = False

class PerceptionService:
    def __init__(self):
        # Local simulated state for inspection cameras
        self.camera_states: Dict[str, CameraParameters] = {
            "CAM_TOP_HDI": CameraParameters(camera_id="CAM_TOP_HDI"),
            "CAM_OBLIQUE_1": CameraParameters(camera_id="CAM_OBLIQUE_1")
        }
        
    def get_camera_parameters(self, camera_id: str) -> Optional[CameraParameters]:
        return self.camera_states.get(camera_id)

    def update_camera_parameters(self, camera_id: str, updates: Dict[str, Any]) -> CameraParameters:
        if camera_id not in self.camera_states:
            self.camera_states[camera_id] = CameraParameters(camera_id=camera_id)
        
        current = self.camera_states[camera_id]
        updated_dict = current.model_dump()
        updated_dict.update(updates)
        
        new_state = CameraParameters(**updated_dict)
        self.camera_states[camera_id] = new_state
        return new_state

    def capture_and_detect(self, board_id: str, camera_id: str) -> List[Defect]:
        """
        Simulates running an advanced computer vision model on a PCB camera frame.
        The quality of detections and confidence levels depend directly on the simulated
        hardware parameters (LED lighting lux, angle, zoom), illustrating the AI-Native adaptivity.
        """
        params = self.camera_states.get(camera_id, CameraParameters(camera_id=camera_id))
        
        # Deterministic simulation based on board_id string to simulate actual boards
        seed_val = sum(ord(c) for c in board_id)
        random.seed(seed_val)
        
        # Decide if this board has a defect
        has_defect = (seed_val % 4 != 0)  # 75% of boards have some defect in simulation for visual testing
        if not has_defect:
            return []
            
        defects = []
        defect_types = ["solder_bridge", "hairline_crack", "component_skew", "missing_via", "solder_void"]
        chosen_type = defect_types[seed_val % len(defect_types)]
        
        # Simulation of Adaptive Lighting & Perception:
        # Standard lighting (400-600 lux, 45 degree angle) yields low confidence for solder bridges or hairline cracks
        # due to reflection. The agent must adjust the lux or angle to increase perception accuracy.
        if chosen_type == "solder_bridge":
            # Solder bridges reflect highly. Coaxial-like lighting (90 degrees angle) and dimmer lux (250 lux) is optimal.
            is_optimal_lighting = (200.0 <= params.led_lux <= 300.0) and (80.0 <= params.led_angle <= 100.0)
            if is_optimal_lighting:
                confidence = round(random.uniform(0.95, 0.99), 3)
                resolved = True
            else:
                confidence = round(random.uniform(0.55, 0.68), 3)  # Glare/ambiguity
                resolved = False
                
            defects.append(Defect(
                id=f"DEF_{board_id}_SB",
                defect_type="solder_bridge",
                confidence=confidence,
                coordinates=[450, 620, 480, 640],
                severity="critical",
                resolved_by_recapture=resolved
            ))
            
        elif chosen_type == "hairline_crack":
            # Hairline cracks are best captured with high zoom and sharp oblique lighting (15-30 degrees)
            is_optimal = (params.zoom_level >= 2.0) and (15.0 <= params.led_angle <= 30.0)
            if is_optimal:
                confidence = round(random.uniform(0.94, 0.99), 3)
                resolved = True
            else:
                confidence = round(random.uniform(0.50, 0.65), 3)
                resolved = False
                
            defects.append(Defect(
                id=f"DEF_{board_id}_HC",
                defect_type="hairline_crack",
                confidence=confidence,
                coordinates=[1200, 850, 1250, 860],
                severity="critical",
                resolved_by_recapture=resolved
            ))
            
        elif chosen_type == "component_skew":
            # Component skew (placement) is optimal under high light (700 lux) and ring lighting (45 degrees)
            is_optimal = (params.led_lux >= 650.0)
            if is_optimal:
                confidence = round(random.uniform(0.96, 0.99), 3)
                resolved = True
            else:
                confidence = round(random.uniform(0.70, 0.78), 3)
                resolved = False
                
            defects.append(Defect(
                id=f"DEF_{board_id}_CS",
                defect_type="component_skew",
                confidence=confidence,
                coordinates=[800, 200, 840, 260],
                severity="warning",
                resolved_by_recapture=resolved
            ))
            
        elif chosen_type == "solder_void":
            # Solder voids under SMT pads require very high zoom magnification and intense light to expose details
            is_optimal = (params.zoom_level >= 2.5) and (params.led_lux >= 750.0)
            if is_optimal:
                confidence = round(random.uniform(0.95, 0.99), 3)
                resolved = True
            else:
                confidence = round(random.uniform(0.50, 0.64), 3)
                resolved = False
                
            defects.append(Defect(
                id=f"DEF_{board_id}_SV",
                defect_type="solder_void",
                confidence=confidence,
                coordinates=[600, 400, 620, 420],
                severity="critical",
                resolved_by_recapture=resolved
            ))
            
        else:  # missing_via
            # Vias are holes, best seen with backlighting or highly focused zoom
            is_optimal = (params.zoom_level >= 1.5)
            if is_optimal:
                confidence = round(random.uniform(0.97, 0.99), 3)
                resolved = True
            else:
                confidence = round(random.uniform(0.60, 0.72), 3)
                resolved = False
                
            defects.append(Defect(
                id=f"DEF_{board_id}_MV",
                defect_type="missing_via",
                confidence=confidence,
                coordinates=[100, 950, 115, 965],
                severity="critical",
                resolved_by_recapture=resolved
            ))
            
        return defects

perception_service = PerceptionService()
