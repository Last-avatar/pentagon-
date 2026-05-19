import React from "react";

export default function TriageQueue({ queue, onResolve }) {
  return (
    <div className="glass-panel" style={styles.container}>
      {/* HUD Header */}
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span 
            className={queue.length > 0 ? "pulse-indicator pulse-amber" : "pulse-indicator pulse-green"} 
            style={{ marginRight: "10px" }} 
          />
          <span style={styles.title}>VISUAL TRIAGE QUEUE (HITL)</span>
        </div>
        <span style={styles.countBadge}>{queue.length} BOARDS</span>
      </div>

      {/* Triage Queue List */}
      <div style={styles.listBody}>
        {queue.length === 0 ? (
          <div style={styles.placeholder}>
            <span style={{ fontSize: "24px", marginBottom: "8px" }}>✅</span>
            <span>Manual triage clear. No ambiguous visual detections require manual overrides.</span>
          </div>
        ) : (
          queue.map((item) => (
            <div key={item.board_id} style={styles.queueItem}>
              <div style={styles.itemHeader}>
                <span style={styles.boardId}>BOARD_#{item.board_id}</span>
                <span style={styles.timestamp}>
                  {new Date(item.timestamp * 1000).toLocaleTimeString()}
                </span>
              </div>

              <div style={styles.detailsRow}>
                <div style={styles.detail}>
                  <span style={styles.label}>ANOMALY</span>
                  <span style={styles.val}>{item.defect_type.toUpperCase().replace("_", " ")}</span>
                </div>
                <div style={styles.detail}>
                  <span style={styles.label}>MODEL CONFIDENCE</span>
                  <span style={{ ...styles.val, color: "var(--neon-amber)" }}>
                    {(item.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div style={styles.detail}>
                  <span style={styles.label}>PIXEL BOUNDS</span>
                  <span style={{ ...styles.val, fontFamily: "var(--font-mono)", fontSize: "10px" }}>
                    [{item.coordinates.join(", ")}]
                  </span>
                </div>
              </div>

              <div style={styles.actionRow}>
                <button 
                  className="cyber-button btn-danger" 
                  style={styles.actionBtn}
                  onClick={() => onResolve(item.board_id, "APPROVED", "Operator visual audit: defect confirmed.")}
                >
                  APPROVE DEFECT
                </button>
                <button 
                  className="cyber-button btn-success" 
                  style={{ ...styles.actionBtn, marginLeft: "10px" }}
                  onClick={() => onResolve(item.board_id, "REJECTED", "Operator visual audit: false alarm, optical glare artifact.")}
                >
                  REJECT / GLARE
                </button>
              </div>
            </div>
          ))
        )}
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
    background: "rgba(16, 20, 30, 0.7)",
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
  countBadge: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "9px",
    fontWeight: "bold",
    color: "var(--text-secondary)",
  },
  listBody: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
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
  queueItem: {
    background: "rgba(0,0,0,0.2)",
    border: "1px solid rgba(255,193,7,0.12)",
    borderRadius: "6px",
    padding: "12px",
    textAlign: "left",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  itemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    paddingBottom: "6px",
    marginBottom: "8px",
  },
  boardId: {
    fontSize: "11px",
    fontFamily: "var(--font-mono)",
    fontWeight: "bold",
    color: "var(--neon-amber)",
  },
  timestamp: {
    fontSize: "10px",
    color: "var(--text-muted)",
  },
  detailsRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "12px",
  },
  detail: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: "8px",
    color: "var(--text-muted)",
    fontWeight: "bold",
    letterSpacing: "0.5px",
  },
  val: {
    fontSize: "11px",
    fontWeight: "600",
    color: "var(--text-primary)",
    marginTop: "2px",
  },
  actionRow: {
    display: "flex",
    justifyContent: "flex-end",
  },
  actionBtn: {
    fontSize: "9px",
    padding: "8px 12px",
    letterSpacing: "0.5px",
    fontWeight: "700",
  }
};
