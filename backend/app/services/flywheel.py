import os
import json
from typing import Dict, List, Any
from app.core.logging import logger
from app.services.perception import Defect

class DataFlywheelService:
    def __init__(self):
        # Local mock storage for labeled training data captures
        self.flywheel_dataset_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 
            "dataset_flywheel"
        )
        os.makedirs(self.flywheel_dataset_dir, exist_ok=True)
        self.sync_records: List[Dict[str, Any]] = []

    def sync_with_mes_etest(self, board_id: str, visual_defects: List[Defect], triage_action: str = None) -> Dict[str, Any]:
        """
        Simulates syncing with the MES (Manufacturing Execution System) after electrical test (E-Test).
        Identifies whether our vision models had:
        - True Positive: E-test confirms defect
        - False Positive: E-test shows board is fine, or human rejected triage (false alarm)
        - True Negative: Vision passed, E-test passed
        - False Negative: Vision passed, but E-test found electrical fault (escaped defect!)
        """
        # Determine E-test results deterministically based on board_id
        seed_val = sum(ord(c) for c in board_id)
        
        # 95% of e-tests match our high-confidence results
        # Let's create an occasional mismatch to show how the flywheel logs anomalies
        is_etest_faulty = (seed_val % 7 == 0)  # Simulated electrical failure
        
        has_visual_defects = len(visual_defects) > 0
        
        label = "TRUE_NEGATIVE"
        if has_visual_defects and is_etest_faulty:
            label = "TRUE_POSITIVE"
        elif has_visual_defects and not is_etest_faulty:
            # We flagged it visually but E-Test says it's electrically fine
            # Could be a aesthetic warning or a visual false positive
            label = "FALSE_POSITIVE"
        elif not has_visual_defects and is_etest_faulty:
            # We missed it! Visual scan passed, but electrical test failed (escaped defect)
            label = "FALSE_NEGATIVE"
            
        # Overrule label if human visual triage explicitly verified it
        if triage_action == "REJECTED":
            label = "FALSE_POSITIVE"  # Human said it's clean, camera was wrong
        elif triage_action == "APPROVED":
            label = "TRUE_POSITIVE"   # Human confirmed it is indeed a defect

        record = {
            "board_id": board_id,
            "visual_detections": [d.model_dump() for d in visual_defects],
            "etest_status": "FAIL" if is_etest_faulty else "PASS",
            "flywheel_label": label,
            "triage_applied": triage_action is not None,
            "triage_action": triage_action
        }
        
        self.sync_records.append(record)
        
        # Proactively export labeled samples for model retraining (Data Flywheel)
        if label in ["FALSE_POSITIVE", "FALSE_NEGATIVE"]:
            self._save_to_training_dataset(board_id, record)
            logger.info(f"[Data Flywheel] Dynamic sample captured for model retraining! Label: {label}. Board ID: {board_id}")
            
        return record

    def _save_to_training_dataset(self, board_id: str, record: Dict[str, Any]) -> None:
        """
        Saves the camera frame (mocked) and labeling coordinates as a training file
        for the vision models.
        """
        filename = os.path.join(self.flywheel_dataset_dir, f"label_{board_id}.json")
        try:
            with open(filename, "w") as f:
                json.dump(record, f, indent=4)
        except Exception as e:
            logger.error(f"Failed to write flywheel retraining sample: {str(e)}")

    def get_flywheel_metrics(self) -> Dict[str, Any]:
        """
        Aggregates accuracy logs. Shows how the data flywheel helps drive accuracy up.
        """
        total = len(self.sync_records)
        if total == 0:
            return {"accuracy": 1.0, "false_alarms": 0, "escapes": 0}
            
        fp = sum(1 for r in self.sync_records if r["flywheel_label"] == "FALSE_POSITIVE")
        fn = sum(1 for r in self.sync_records if r["flywheel_label"] == "FALSE_NEGATIVE")
        tp = sum(1 for r in self.sync_records if r["flywheel_label"] == "TRUE_POSITIVE")
        tn = sum(1 for r in self.sync_records if r["flywheel_label"] == "TRUE_NEGATIVE")
        
        accuracy = (tp + tn) / total
        
        return {
            "total_inspected": total,
            "true_positives": tp,
            "true_negatives": tn,
            "false_positives": fp,
            "false_negatives": fn,
            "current_accuracy": round(accuracy * 100, 2),
            "escaped_defect_rate": round((fn / total) * 100, 2) if fn > 0 else 0.0
        }

flywheel_service = DataFlywheelService()
