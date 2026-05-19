import React, { useEffect, useRef } from "react";

export default function AgentConsole({ thoughts }) {
  const terminalEndRef = useRef(null);

  useEffect(() => {
    // Smooth scroll terminal to latest logs
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [thoughts]);

  const getStepIcon = (type) => {
    switch (type) {
      case "info":
        return "🌐";
      case "reasoning":
        return "🧠";
      case "tool_call":
        return "🔧";
      case "tool_response":
        return "⚡";
      case "decision":
        return "🛡️";
      default:
        return "📟";
    }
  };

  const getStepStyle = (type) => {
    switch (type) {
      case "reasoning":
        return { color: "var(--text-primary)", borderLeft: "2px solid var(--neon-amber)" };
      case "tool_call":
        return { color: "var(--neon-blue)", borderLeft: "2px solid var(--neon-blue)", background: "rgba(41, 121, 255, 0.03)" };
      case "tool_response":
        return { color: "var(--text-secondary)", borderLeft: "2px solid var(--text-muted)" };
      case "decision":
        return { color: "var(--neon-green)", borderLeft: "2px solid var(--neon-green)", background: "rgba(0, 230, 118, 0.03)" };
      default:
        return { color: "var(--text-secondary)", borderLeft: "2px solid rgba(255,255,255,0.08)" };
    }
  };

  return (
    <div className="glass-panel" style={styles.container}>
      {/* Header HUD */}
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span className="pulse-indicator pulse-blue" style={{ marginRight: "10px" }} />
          <span style={styles.title}>AGENT REASONING CONSOLE</span>
        </div>
        <span style={styles.hudSub}>MODEL: GEMINI-1.5-PRO // ACTIVES</span>
      </div>

      {/* Terminal logs list */}
      <div style={styles.terminalBody}>
        {thoughts.length === 0 ? (
          <div style={styles.placeholder}>
            <span style={{ fontSize: "24px", marginBottom: "8px" }}>💤</span>
            <span>Agentic inspection core idle. Trigger a scan from the control bar to launch autonomous tethers.</span>
          </div>
        ) : (
          thoughts.map((step, idx) => (
            <div 
              key={idx} 
              style={{ ...styles.logRow, ...getStepStyle(step.step_type) }}
            >
              <div style={styles.logHeader}>
                <span style={styles.icon}>{getStepIcon(step.step_type)}</span>
                <span style={styles.stepType}>{step.step_type.toUpperCase()}</span>
                <span style={styles.timestamp}>
                  +{((step.timestamp - thoughts[0].timestamp)).toFixed(2)}s
                </span>
              </div>
              <p style={styles.message}>{step.message}</p>
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: "360px",
    maxHeight: "440px",
    background: "rgba(12, 16, 26, 0.75)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    background: "rgba(0,0,0,0.3)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "1px",
    color: "#fff",
  },
  hudSub: {
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    color: "var(--text-muted)",
  },
  terminalBody: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    textAlign: "left",
  },
  placeholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "var(--text-muted)",
    fontSize: "12px",
    textAlign: "center",
    padding: "0 20px",
  },
  logRow: {
    padding: "8px 12px",
    background: "rgba(255,255,255,0.01)",
    borderRadius: "4px",
    fontSize: "12px",
    fontFamily: "var(--font-sans)",
  },
  logHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "4px",
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
  },
  icon: {
    marginRight: "6px",
    fontSize: "12px",
  },
  stepType: {
    fontWeight: "bold",
    letterSpacing: "0.5px",
    opacity: 0.8,
  },
  timestamp: {
    marginLeft: "auto",
    color: "var(--text-muted)",
  },
  message: {
    margin: 0,
    lineHeight: "1.4",
    fontSize: "12px",
    color: "var(--text-primary)",
  }
};
