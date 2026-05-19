import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import CameraFeed from "./components/CameraFeed";
import AgentConsole from "./components/AgentConsole";
import TriageQueue from "./components/TriageQueue";
import BatchStats from "./components/BatchStats";
import { useWebSocket } from "./hooks/useWebSocket";

const BACKEND_URL = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/api/v1/ws";

export default function App() {
  // Operational Telemetry States
  const [boardId, setBoardId] = useState("");
  const [defects, setDefects] = useState([]);
  const [thoughts, setThoughts] = useState([]);
  const [cameraParams, setCameraParams] = useState({
    led_lux: 500.0,
    led_angle: 45.0,
    zoom_level: 1.0,
    exposure_ms: 20.0
  });

  // Batch Summaries and Guardrail States
  const [lineHalted, setLineHalted] = useState(false);
  const [conveyorSpeed, setConveyorSpeed] = useState(12.5);
  const [sequentialDefects, setSequentialDefects] = useState(0);
  const [triageQueue, setTriageQueue] = useState([]);
  const [crossBoardAlert, setCrossBoardAlert] = useState({ status: "HEALTHY", message: "" });
  const [stats, setStats] = useState({
    line_halted: false,
    sequential_defects: 0,
    total_in_triage: 0,
    flywheel: {
      total_inspected: 0,
      true_positives: 0,
      true_negatives: 0,
      false_positives: 0,
      false_negatives: 0,
      current_accuracy: 100.0,
      escaped_defect_rate: 0.0
    }
  });

  const [inspecting, setInspecting] = useState(false);

  // Initialize and connect WebSocket Telemetry Bus
  const { status: wsStatus, lastMessage } = useWebSocket(WS_URL);

  // Poll stats and triage queue periodically
  const fetchData = async () => {
    try {
      // Get batch metrics
      const statsRes = await fetch(`${BACKEND_URL}/api/v1/batch/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
        setLineHalted(statsData.line_halted);
        setSequentialDefects(statsData.sequential_defects);
      }

      // Get human triage queue
      const triageRes = await fetch(`${BACKEND_URL}/api/v1/triage/`);
      if (triageRes.ok) {
        const triageData = await triageRes.json();
        setTriageQueue(triageData);
      }

      // Get semantic cross-board alert warnings
      const alertRes = await fetch(`${BACKEND_URL}/api/v1/batch/cross-board-analysis`);
      if (alertRes.ok) {
        const alertData = await alertRes.json();
        setCrossBoardAlert(alertData);
      }
    } catch (e) {
      console.warn("Unable to sync baseline metrics with backend server:", e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000); // sync every 4s
    return () => clearInterval(interval);
  }, []);

  // Listen and process incoming real-time telemetry frames
  useEffect(() => {
    if (!lastMessage) return;

    const { event_type, data } = lastMessage;

    switch (event_type) {
      case "line_heartbeat":
        // Sync conveyor gauges
        if (data.line_halted !== undefined) {
          setLineHalted(data.line_halted);
          setConveyorSpeed(data.conveyor_speed_m_per_min);
          setSequentialDefects(data.sequential_defects);
        }
        break;

      case "agent_thought":
        // Live stream agent's reasoning logs
        if (data.board_id === boardId) {
          setThoughts(prev => {
            // Avoid adding identical thought stamps
            const exists = prev.some(t => t.timestamp === data.step.timestamp);
            if (exists) return prev;
            return [...prev, data.step];
          });

          // Proactively update lens and illumination overlay levels as agent calls tools!
          if (data.step.step_type === "tool_call") {
            // Retrieve parameters and update state
            fetch(`${BACKEND_URL}/api/v1/camera/parameters/CAM_TOP_HDI`)
              .then(res => res.json())
              .then(params => setCameraParams(params))
              .catch(err => console.warn(err));
          }
        }
        break;

      default:
        break;
    }
  }, [lastMessage, boardId]);

  // Command Action: trigger autonomous SMT inspection
  const triggerInspection = async () => {
    if (inspecting || lineHalted) return;

    setInspecting(true);
    setThoughts([]);
    setDefects([]);
    
    // Generate a structured deterministic random Board ID for testing (e.g. BRD-X943)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const activeBoardId = `BRD-X${randomSuffix}`;
    setBoardId(activeBoardId);

    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/camera/inspect/${activeBoardId}`, {
        method: "POST"
      });

      if (response.ok) {
        const result = await response.json();
        // Set visual defect overlays
        setDefects(result.defects);
        
        // Sync final thoughts
        setThoughts(result.thoughts);
        
        // Fetch parameter updates
        const paramRes = await fetch(`${BACKEND_URL}/api/v1/camera/parameters/CAM_TOP_HDI`);
        if (paramRes.ok) {
          const params = await paramRes.json();
          setCameraParams(params);
        }
        
        // Re-sync backend database stats
        await fetchData();
      }
    } catch (e) {
      console.error("Visual inspection dispatch failed:", e);
    } finally {
      setInspecting(false);
    }
  };

  // Command Action: Resolve operator manual triage decisions
  const resolveTriage = async (targetBoardId, action, notes) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/triage/${targetBoardId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes })
      });

      if (response.ok) {
        // Remove defect visualization if board passes
        if (targetBoardId === boardId && action === "REJECTED") {
          setDefects([]);
        }
        // Force sync stats
        await fetchData();
      }
    } catch (e) {
      console.error("Triage resolution failed:", e);
    }
  };

  // Command Action: Reset safety blast-radius limits
  const resetHalt = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/batch/reset-halt`, {
        method: "POST"
      });
      if (response.ok) {
        setLineHalted(false);
        setSequentialDefects(0);
        await fetchData();
      }
    } catch (e) {
      console.error("Failed to reset line halt:", e);
    }
  };

  return (
    <div style={styles.appContainer}>
      {/* HUD Header Status Panel */}
      <Header 
        lineHalted={lineHalted}
        conveyorSpeed={conveyorSpeed}
        sequentialDefects={sequentialDefects}
        onResetHalt={resetHalt}
      />

      {/* Main Operational Command Center */}
      <main className="dashboard-grid">
        
        {/* Left Side: Live SMT Feed & Inspection Core */}
        <section style={styles.leftColumn}>
          <CameraFeed 
            boardId={boardId}
            defects={defects}
            cameraParams={cameraParams}
            status={thoughts[thoughts.length - 1]?.step_type === "decision" ? "DONE" : inspecting ? "SCANNING" : "IDLE"}
          />
          
          {/* Action Trigger control deck */}
          <div className="glass-panel" style={styles.controlDeck}>
            <div style={styles.deckBranding}>
              <span style={styles.deckLabel}>QC INSPECTOR CONTROL DECK</span>
              <div style={styles.wsIndicator}>
                <span className={wsStatus === "open" ? "pulse-indicator pulse-green" : "pulse-indicator pulse-red"} />
                <span style={{ fontSize: "10px", fontWeight: "bold", opacity: 0.8 }}>
                  TELEMETRY BUS: {wsStatus.toUpperCase()}
                </span>
              </div>
            </div>
            
            <button 
              className="cyber-button btn-success" 
              style={styles.triggerButton}
              disabled={inspecting || lineHalted}
              onClick={triggerInspection}
            >
              {inspecting ? "PERCEIVING PCB..." : lineHalted ? "LINE HALTED" : "LAUNCH INSPECTION"}
            </button>
          </div>
        </section>

        {/* Right Side: Agent Reasonings & Flywheel Metrics */}
        <section style={styles.rightColumn}>
          <AgentConsole thoughts={thoughts} />
          
          <div style={styles.rightSubGrid}>
            <TriageQueue queue={triageQueue} onResolve={resolveTriage} />
            <BatchStats stats={stats} crossBoardAlert={crossBoardAlert} />
          </div>
        </section>

      </main>
    </div>
  );
}

const styles = {
  appContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#080c14",
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  rightSubGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "20px",
  },
  controlDeck: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    background: "rgba(16, 20, 30, 0.7)",
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  deckBranding: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "6px",
  },
  deckLabel: {
    fontFamily: "var(--font-display)",
    fontSize: "11px",
    fontWeight: "bold",
    letterSpacing: "1px",
    color: "var(--text-secondary)",
  },
  wsIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  triggerButton: {
    fontSize: "12px",
    padding: "12px 24px",
    fontWeight: "bold",
  }
};
