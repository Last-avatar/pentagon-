import pytest
import asyncio
from app.services.perception import perception_service
from app.services.agent import agent_decision_engine
from app.services.memory import memory_service
from app.services.guardrails import guardrails_service
from app.services.flywheel import flywheel_service

@pytest.mark.asyncio
async def test_adaptive_perception_dynamic():
    """
    Verifies that computer vision perception confidence changes dynamically
    under adjusted lighting/optical parameters, demonstrating dynamic adaptation.
    """
    board_id = "TEST_BRD_001_DYNAMIC"  # Forces an anomaly in simulation
    camera_id = "CAM_TOP_HDI"
    
    # 1. Capture under standard default parameters (500 lux, 45 deg, 1.0 zoom)
    perception_service.update_camera_parameters(camera_id, {
        "led_lux": 500.0,
        "led_angle": 45.0,
        "zoom_level": 1.0
    })
    defects = perception_service.capture_and_detect(board_id, camera_id)
    assert len(defects) == 1
    defect = defects[0]
    assert defect.confidence < 0.75  # Specular reflection glare makes it ambiguous
    assert defect.resolved_by_recapture is False
    
    # 2. Shift camera parameters to the optimal settings for this specific defect type
    if defect.defect_type == "solder_bridge":
        perception_service.update_camera_parameters(camera_id, {
            "led_lux": 250.0,
            "led_angle": 90.0
        })
    elif defect.defect_type == "hairline_crack":
        perception_service.update_camera_parameters(camera_id, {
            "led_angle": 20.0,
            "zoom_level": 2.0
        })
    elif defect.defect_type == "component_skew":
        perception_service.update_camera_parameters(camera_id, {
            "led_lux": 750.0
        })
    elif defect.defect_type == "missing_via":
        perception_service.update_camera_parameters(camera_id, {
            "zoom_level": 1.8
        })
        
    # 3. Capture again under corrected parameters
    defects_resolved = perception_service.capture_and_detect(board_id, camera_id)
    assert len(defects_resolved) == 1
    assert defects_resolved[0].confidence >= 0.90  # Confidences resolved, high accuracy
    assert defects_resolved[0].resolved_by_recapture is True


@pytest.mark.asyncio
async def test_agentic_reasoning_loop():
    """
    Verifies that the Agentic Decision Engine automatically discovers low-confidence
    defects, utilizes lighting correction tools, re-captures, and succeeds.
    """
    board_id = "TEST_BRD_001_DYNAMIC"  # Ambiguous anomaly board
    
    # Run the async agent loop
    result = await agent_decision_engine.inspect_board(board_id)
    
    assert result.board_id == board_id
    assert result.status == "FAIL"  # Anomaly is verified, so board fails visual check
    
    # Verify thoughts are logged step-by-step
    assert len(result.thoughts) > 0
    step_types = [t.step_type for t in result.thoughts]
    assert "info" in step_types
    assert "tool_call" in step_types      # Shuffled lighting parameters
    assert "tool_response" in step_types  # Shuffled lighting committed
    assert "decision" in step_types       # Made a final failing audit


@pytest.mark.asyncio
async def test_guardrails_blast_radius_halt():
    """
    Verifies that sequential failure tracking halts the conveyor belt
    if successive defects hit the blast-radius boundary.
    """
    guardrails_service.reset_halt()
    assert guardrails_service.line_halted is False
    assert guardrails_service.sequential_defects_count == 0
    
    # Register 4 consecutive board failures (limit is 5)
    for i in range(4):
        status = guardrails_service.track_board_result(f"BRD_{i}", "FAIL")
        assert status["line_halted"] is False
        
    # The 5th sequential failure triggers automated safety shutdown
    final_status = guardrails_service.track_board_result("BRD_5", "FAIL")
    assert final_status["line_halted"] is True
    assert guardrails_service.line_halted is True
    
    # Overriding the line reset returns conveyor belt to normal
    guardrails_service.reset_halt()
    assert guardrails_service.line_halted is False
    assert guardrails_service.sequential_defects_count == 0


@pytest.mark.asyncio
async def test_cross_board_semantic_nozzle_drift():
    """
    Verifies that vector memory cross-board analyst identifies nozzle drifts
    if multiple skews occur consecutively, firing system warnings.
    """
    # Reset index memory records
    memory_service.vector_records = []
    
    # Store standard unrelated anomalies
    from app.services.perception import Defect
    skew_defect = Defect(
        id="D_SKEW", defect_type="component_skew", confidence=0.95,
        coordinates=[1,1,2,2], severity="warning"
    )
    
    # Inject 3 component placement skews
    memory_service.store_defects("B_1", [skew_defect])
    memory_service.store_defects("B_2", [skew_defect])
    
    analysis_healthy = memory_service.analyze_cross_board_patterns()
    assert analysis_healthy["status"] == "HEALTHY"  # Only 2, below consecutive threshold of 3
    
    memory_service.store_defects("B_3", [skew_defect])
    
    analysis_drifted = memory_service.analyze_cross_board_patterns()
    assert analysis_drifted["status"] == "CRITICAL_ALERT"
    assert "Nozzle Drift" in analysis_drifted["anomaly_type"]


@pytest.mark.asyncio
async def test_data_flywheel_labeling():
    """
    Verifies that joining visual inspections with E-test outcomes
    produces accurate labels and aggregates flywheel statistics.
    """
    flywheel_service.sync_records = []
    
    from app.services.perception import Defect
    defect = Defect(
        id="D_BRIDGE", defect_type="solder_bridge", confidence=0.98,
        coordinates=[1,1,2,2], severity="critical"
    )
    
    # Vision passed, and E-test passed (Clean board) -> True Negative
    tn_sync = flywheel_service.sync_with_mes_etest("B_TN", [])
    assert tn_sync["flywheel_label"] == "TRUE_NEGATIVE"
    
    # Vision marked a defect, but e-test passed (Visual false positive)
    # The flywheel captures this automatically for retraining
    fp_sync = flywheel_service.sync_with_mes_etest("B_FP", [defect])
    assert fp_sync["flywheel_label"] == "FALSE_POSITIVE"
    
    # Human triage verified a defect -> overrides label to True Positive
    triage_tp = flywheel_service.sync_with_mes_etest("B_HITL", [defect], triage_action="APPROVED")
    assert triage_tp["flywheel_label"] == "TRUE_POSITIVE"


@pytest.mark.asyncio
async def test_solder_void_adaptive_perception_and_chromadb():
    """
    Verifies the end-to-end implementation of Epic 1 (solder_void perception & agentic loop)
    and Epic 2 (ChromaDB semantic memory storing and repeating outgassing alarms).
    """
    board_id = "VOID_BOARD_009"  # Hardcoded seed values for void simulation
    camera_id = "CAM_TOP_HDI"
    
    # 1. Verify adaptive perception for solder_void
    # Initial scan under low zoom / low lux -> Ambiguous
    perception_service.update_camera_parameters(camera_id, {
        "led_lux": 500.0,
        "zoom_level": 1.0
    })
    defects = perception_service.capture_and_detect(board_id, camera_id)
    assert len(defects) == 1
    assert defects[0].defect_type == "solder_void"
    assert defects[0].confidence < 0.70
    assert defects[0].resolved_by_recapture is False
    
    # 2. Verify agent reasoning loops handles solder_void
    result = await agent_decision_engine.inspect_board(board_id)
    assert result.status == "FAIL"
    assert len(result.defects) == 1
    assert result.defects[0].defect_type == "solder_void"
    assert result.defects[0].confidence >= 0.90
    assert result.defects[0].resolved_by_recapture is True
    
    # Check that tool calls were emitted in agent thoughts
    tool_steps = [t.message for t in result.thoughts if t.step_type == "tool_call"]
    assert any("2.5x magnification" in s and "800 lux" in s for s in tool_steps)
    
    # 3. Verify ChromaDB vector memory storage & outgassing alert
    memory_service.vector_records = []
    
    # Store 3 consecutive solder void defects
    from app.services.perception import Defect
    void_defect = Defect(
        id="D_VOID", defect_type="solder_void", confidence=0.96,
        coordinates=[600,400,620,420], severity="critical"
    )
    
    memory_service.store_defects("B_V1", [void_defect])
    memory_service.store_defects("B_V2", [void_defect])
    memory_service.store_defects("B_V3", [void_defect])
    
    # Verify reflow profile outgassing alert triggers
    analysis = memory_service.analyze_cross_board_patterns()
    assert analysis["status"] == "CRITICAL_ALERT"
    assert "Solder Void Outgassing Alert" in analysis["anomaly_type"]
    assert "reflow profile" in analysis["message"].lower()

