import React from "react";

export default function BatchStats({ stats, crossBoardAlert }) {
  const flywheel = stats.flywheel || {
    total_inspected: 0,
    true_positives: 0,
    true_negatives: 0,
    false_positives: 0,
    false_negatives: 0,
    current_accuracy: 100.0,
    escaped_defect_rate: 0.0
  };

  const getAccuracyColor = (val) => {
    if (val >= 98.0) return "var(--neon-green)";
    if (val >= 95.0) return "var(--neon-amber)";
    return "var(--neon-red)";
  };

  const isAlertActive = crossBoardAlert && crossBoardAlert.status === "CRITICAL_ALERT";

  return (
    <div className="glass-panel" style={styles.container}>
      {/* HUD Header */}
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span className="pulse-indicator pulse-green" style={{ marginRight: "10px" }} />
          <span style={styles.title}>DATA FLYWHEEL & BATCH QUALITY</span>
        </div>
        <span style={styles.hudSub}>SYNCED WITH MES // LIVE</span>
      </div>

      <div style={styles.statsBody}>
        {/* Core Percentage Gauges */}
        <div style={styles.gaugesRow}>
          <div style={styles.gaugeCard}>
            <span style={styles.gaugeLabel}>FLYWHEEL ACCURACY</span>
            <span style={{ 
              ...styles.gaugeVal, 
              color: getAccuracyColor(flywheel.current_accuracy),
              textShadow: `0 0 10px ${getAccuracyColor(flywheel.current_accuracy)}glow`
            }}>
              {flywheel.current_accuracy.toFixed(1)}%
            </span>
            <div style={styles.miniBarContainer}>
              <div style={{ 
                ...styles.miniBarFill, 
                width: `${flywheel.current_accuracy}%`,
                background: getAccuracyColor(flywheel.current_accuracy)
              }} />
            </div>
          </div>

          <div style={styles.gaugeCard}>
            <span style={styles.gaugeLabel}>ESCAPED DEFECT RATE</span>
            <span style={{ 
              ...styles.gaugeVal, 
              color: flywheel.escaped_defect_rate > 1.0 ? "var(--neon-red)" : "var(--neon-green)"
            }}>
              {flywheel.escaped_defect_rate.toFixed(2)}%
            </span>
            <div style={styles.miniBarContainer}>
              <div style={{ 
                ...styles.miniBarFill, 
                width: `${Math.min(100, flywheel.escaped_defect_rate * 20)}%`,
                background: flywheel.escaped_defect_rate > 1.0 ? "var(--neon-red)" : "var(--neon-green)"
              }} />
            </div>
          </div>
        </div>

        {/* Numeric Telemetry Ledger */}
        <div style={styles.ledgerGrid}>
          <div style={styles.ledgerCell}>
            <span style={styles.ledgerLabel}>TOTAL INSPECTED</span>
            <span style={styles.ledgerVal}>{flywheel.total_inspected}</span>
          </div>
          <div style={styles.ledgerCell}>
            <span style={styles.ledgerLabel}>TRUE DEFECTS (TP)</span>
            <span style={styles.ledgerVal}>{flywheel.true_positives}</span>
          </div>
          <div style={styles.ledgerCell}>
            <span style={styles.ledgerLabel}>FALSE ALARMS (FP)</span>
            <span style={{ ...styles.ledgerVal, color: "var(--neon-amber)" }}>{flywheel.false_positives}</span>
          </div>
          <div style={styles.ledgerCell}>
            <span style={styles.ledgerLabel}>ESCAPED FRACTURES (FN)</span>
            <span style={{ ...styles.ledgerVal, color: "var(--neon-red)" }}>{flywheel.false_negatives}</span>
          </div>
        </div>

        {/* Cross-Board semantic notifications */}
        {isAlertActive ? (
          <div style={styles.alertCard} className="glass-panel">
            <div style={styles.alertHeader}>
              <span className="pulse-indicator pulse-red" style={{ marginRight: "10px" }} />
              <span style={styles.alertTitle}>{crossBoardAlert.anomaly_type.toUpperCase()}</span>
            </div>
            <p style={styles.alertMsg}>{crossBoardAlert.message}</p>
            <div style={styles.actionBlock}>
              <span style={styles.actionLabel}>RECOMMENDED SYSTEM ACTION:</span>
              <span style={styles.actionText}>{crossBoardAlert.action_required}</span>
            </div>
          </div>
        ) : (
          <div style={styles.infoCard}>
            <span style={{ marginRight: "8px" }}>ℹ️</span>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
              {crossBoardAlert.message || "Cross-board vector analyst scanning batch for SMT nozzle drifts. Currently healthy."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    background: "rgba(16, 20, 30, 0.6)",
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
  statsBody: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  gaugesRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  gaugeCard: {
    background: "rgba(0,0,0,0.2)",
    border: "1px solid rgba(255,255,255,0.04)",
    borderRadius: "6px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  gaugeLabel: {
    fontSize: "9px",
    color: "var(--text-muted)",
    fontWeight: "bold",
    letterSpacing: "0.5px",
    marginBottom: "6px",
  },
  gaugeVal: {
    fontSize: "20px",
    fontFamily: "var(--font-mono)",
    fontWeight: "bold",
    margin: "4px 0",
  },
  miniBarContainer: {
    width: "100%",
    height: "3px",
    background: "rgba(255,255,255,0.06)",
    borderRadius: "2px",
    marginTop: "8px",
    overflow: "hidden",
  },
  miniBarFill: {
    height: "100%",
    borderRadius: "2px",
    transition: "width 0.4s ease",
  },
  ledgerGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  ledgerCell: {
    background: "rgba(0,0,0,0.15)",
    border: "1px solid rgba(255,255,255,0.02)",
    borderRadius: "4px",
    padding: "8px 12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "11px",
  },
  ledgerLabel: {
    color: "var(--text-muted)",
    fontWeight: "600",
  },
  ledgerVal: {
    fontFamily: "var(--font-mono)",
    fontWeight: "bold",
    fontSize: "12px",
    color: "var(--text-primary)",
  },
  alertCard: {
    background: "rgba(239, 68, 68, 0.05)",
    border: "1px solid var(--neon-red)",
    borderRadius: "8px",
    padding: "12px",
    textAlign: "left",
    boxShadow: "0 0 15px rgba(255, 23, 68, 0.08)",
  },
  alertHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "6px",
  },
  alertTitle: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "var(--neon-red)",
    letterSpacing: "0.5px",
    fontFamily: "var(--font-display)",
  },
  alertMsg: {
    margin: "0 0 10px 0",
    fontSize: "11px",
    color: "var(--text-primary)",
    lineHeight: "1.4",
  },
  actionBlock: {
    borderTop: "1px solid rgba(255,23,68,0.15)",
    paddingTop: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  actionLabel: {
    fontSize: "8px",
    color: "var(--text-muted)",
    fontWeight: "bold",
  },
  actionText: {
    fontSize: "10px",
    color: "var(--neon-amber)",
    fontWeight: "bold",
  },
  infoCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.04)",
    borderRadius: "6px",
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    textAlign: "left",
  }
};
