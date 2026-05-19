import React from "react";

export default function Header({ lineHalted, conveyorSpeed, sequentialDefects, onResetHalt }) {
  return (
    <header className="glass-panel" style={styles.header}>
      <div style={styles.branding}>
        <div style={styles.logoContainer}>
          <div style={styles.logoInner} className={lineHalted ? "pulse-indicator pulse-red" : "pulse-indicator pulse-green"} />
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: "10px" }}>
            <rect x="2" y="2" width="20" height="20" rx="4" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="16" cy="8" r="1.5" />
            <circle cx="8" cy="16" r="1.5" />
            <circle cx="16" cy="16" r="1.5" />
            <path d="M8 8h8v8H8z" opacity="0.3" fill="currentColor" />
          </svg>
        </div>
        <div style={styles.textGroup}>
          <h1 style={styles.title}>PENTAGON-QC</h1>
          <span style={styles.subtitle}>AI-Native Autonomous PCB Quality Inspector</span>
        </div>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statBox}>
          <span style={styles.statLabel}>LINE SPEED</span>
          <span style={{ 
            ...styles.statVal, 
            color: lineHalted ? "var(--neon-red)" : "var(--neon-green)",
            textShadow: lineHalted ? "0 0 8px var(--neon-red-glow)" : "0 0 8px var(--neon-green-glow)"
          }}>
            {lineHalted ? "0.0 m/min (HALTED)" : `${conveyorSpeed.toFixed(1)} m/min`}
          </span>
        </div>

        <div style={styles.statBox}>
          <span style={styles.statLabel}>SEQUENTIAL THREATS</span>
          <span style={{ 
            ...styles.statVal, 
            color: sequentialDefects > 2 ? "var(--neon-amber)" : "var(--text-primary)"
          }}>
            {sequentialDefects} / 5
          </span>
        </div>

        <div style={styles.statBox}>
          <span style={styles.statLabel}>CORE ENGINE STATUS</span>
          <div style={styles.statusBadge}>
            <span className={lineHalted ? "pulse-indicator pulse-red" : "pulse-indicator pulse-green"} />
            <span style={{ marginLeft: "8px", fontWeight: "bold", fontSize: "11px", letterSpacing: "1px" }}>
              {lineHalted ? "SHUTDOWN" : "PERFECT"}
            </span>
          </div>
        </div>

        {lineHalted && (
          <button 
            className="cyber-button btn-danger" 
            style={styles.resetButton}
            onClick={onResetHalt}
          >
            RESET LINE HALT
          </button>
        )}
      </div>
    </header>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    margin: "20px 20px 0 20px",
    flexWrap: "wrap",
    gap: "16px",
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  branding: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    background: "rgba(0, 0, 0, 0.2)",
    padding: "8px 12px 8px 6px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  logoInner: {
    width: "12px",
    height: "12px",
  },
  textGroup: {
    display: "flex",
    flexDirection: "column",
    textAlign: "left",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "800",
    letterSpacing: "1px",
    fontFamily: "var(--font-display)",
    color: "#fff",
    background: "linear-gradient(90deg, #fff 0%, var(--neon-blue) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: "11px",
    color: "var(--text-secondary)",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    fontWeight: "500",
  },
  statsRow: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    flexWrap: "wrap",
  },
  statBox: {
    display: "flex",
    flexDirection: "column",
    textAlign: "right",
    background: "rgba(0, 0, 0, 0.15)",
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid rgba(255,255,255,0.03)",
  },
  statLabel: {
    fontSize: "9px",
    color: "var(--text-muted)",
    letterSpacing: "1px",
    fontWeight: "bold",
  },
  statVal: {
    fontSize: "13px",
    fontFamily: "var(--font-mono)",
    fontWeight: "600",
    marginTop: "2px",
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    marginTop: "4px",
  },
  resetButton: {
    animation: "pulse-glow 1.5s infinite ease-in-out",
    "--glow-color": "rgba(255, 23, 68, 0.4)",
    fontSize: "11px",
    padding: "10px 18px",
  }
};
