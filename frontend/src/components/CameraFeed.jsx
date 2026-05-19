import React from "react";

export default function CameraFeed({ boardId, defects, cameraParams, status }) {
  // Determine if a laser scan is active
  const isScanning = status === "PASS" || status === "FAIL" || status === "ESC_TRIAGE";

  return (
    <div className="glass-panel scan-container" style={styles.container}>
      {/* Top Banner with HUD Telemetry */}
      <div style={styles.hudHeader}>
        <div style={styles.hudTitleGroup}>
          <span style={styles.hudTitle}>CAM_TOP_HDI // PHYSICAL FEED</span>
          <span style={styles.boardIdLabel}>BOARD ID: {boardId || "WAITING..."}</span>
        </div>
        <div style={styles.paramCapsules}>
          <div style={styles.capsule}>
            <span style={styles.capsuleLabel}>LED</span>
            <span style={styles.capsuleVal}>{cameraParams.led_lux?.toFixed(0)} LX</span>
          </div>
          <div style={styles.capsule}>
            <span style={styles.capsuleLabel}>ANGLE</span>
            <span style={styles.capsuleVal}>{cameraParams.led_angle?.toFixed(0)}°</span>
          </div>
          <div style={styles.capsule}>
            <span style={styles.capsuleLabel}>ZOOM</span>
            <span style={styles.capsuleVal}>{cameraParams.zoom_level?.toFixed(1)}X</span>
          </div>
          <div style={styles.capsule}>
            <span style={styles.capsuleLabel}>SHUTTER</span>
            <span style={styles.capsuleVal}>{cameraParams.exposure_ms?.toFixed(0)}MS</span>
          </div>
        </div>
      </div>

      {/* Main PCB Visualizer Display */}
      <div style={styles.feedWindow}>
        {/* Neon Laser Scanning beam */}
        {isScanning && <div className="scan-beam" />}

        {/* Detailed SVG Printed Circuit Board */}
        <svg 
          viewBox="0 0 800 500" 
          style={{ 
            ...styles.pcbSvg,
            transform: `scale(${cameraParams.zoom_level || 1})`,
            transition: "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)"
          }}
        >
          {/* Base substrate */}
          <rect width="800" height="500" rx="10" fill="#081424" />
          
          {/* Fiber Glass Substrate texture */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="1" />
            </pattern>
            <filter id="neon-glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <rect width="800" height="500" rx="10" fill="url(#grid)" />

          {/* Golden Ground Traces & Bus Paths */}
          <g stroke="rgba(245, 158, 11, 0.12)" strokeWidth="3" fill="none" strokeLinecap="round">
            <path d="M 50 50 L 750 50 L 750 450 L 50 450 Z" />
            <path d="M 100 100 L 400 100 L 400 200" />
            <path d="M 700 100 L 450 100 L 450 200" />
            <path d="M 100 400 L 400 400" />
            <path d="M 700 400 L 450 400" />
          </g>

          {/* Copper Signal Traces */}
          <g stroke="#00e676" strokeWidth="1.5" opacity="0.35" fill="none" strokeLinecap="round">
            <path d="M 60 70 L 220 70 L 250 100 L 250 150" />
            <path d="M 60 90 L 150 90 L 180 120" />
            <path d="M 120 180 L 120 320" />
            <path d="M 140 180 L 140 320" />
            <path d="M 740 70 L 580 70 L 550 100 L 550 150" />
            
            {/* Defect trace hairline crack route (will render defective later) */}
            <path d="M 650 350 L 650 420" />
            <path d="M 670 350 L 670 420" />
          </g>

          {/* Micro-Vias (Golden Contact Holes) */}
          <g fill="#ffc107" stroke="#ffc107" strokeWidth="0.5" opacity="0.8">
            <circle cx="250" cy="150" r="4" />
            <circle cx="180" cy="120" r="4" />
            <circle cx="550" cy="150" r="4" />
            {/* Defect via target */}
            <circle cx="108" cy="405" r="4" />
            <circle cx="120" cy="405" r="4" />
          </g>

          {/* Micro-Controller Core (Main SoC Chip) */}
          <g transform="translate(325, 175)">
            {/* Outer Pins */}
            <g fill="rgba(255,255,255,0.7)" stroke="#6b7280" strokeWidth="1">
              {/* Top pins */}
              <rect x="15" y="-10" width="8" height="15" />
              <rect x="35" y="-10" width="8" height="15" />
              <rect x="55" y="-10" width="8" height="15" />
              <rect x="75" y="-10" width="8" height="15" />
              <rect x="95" y="-10" width="8" height="15" />
              <rect x="115" y="-10" width="8" height="15" />
              
              {/* Bottom pins */}
              <rect x="15" y="145" width="8" height="15" />
              <rect x="35" y="145" width="8" height="15" />
              <rect x="55" y="145" width="8" height="15" />
              <rect x="75" y="145" width="8" height="15" />
              <rect x="95" y="145" width="8" height="15" />
              <rect x="115" y="145" width="8" height="15" />
            </g>
            {/* Silicon Package Body */}
            <rect width="140" height="140" rx="8" fill="#111827" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <text x="70" y="75" fill="rgba(255,255,255,0.6)" fontSize="11" fontFamily="var(--font-display)" fontWeight="bold" textAnchor="middle">ARM CORTEX-M4</text>
            <circle cx="15" cy="15" r="3" fill="#6b7280" /> {/* Pin 1 dot */}
          </g>

          {/* SMT Capacitors and Resistors */}
          {/* Resistor R1 */}
          <g transform="translate(180, 240)">
            <rect x="0" y="0" width="40" height="20" rx="2" fill="#52525b" />
            <rect x="0" y="0" width="10" height="20" fill="#a1a1aa" />
            <rect x="30" y="0" width="10" height="20" fill="#a1a1aa" />
            <text x="20" y="13" fill="#fff" fontSize="8" fontWeight="bold" fontFamily="var(--font-mono)" textAnchor="middle">R1</text>
          </g>

          {/* Capacitor C1 (Can be skewed in component_skew defect) */}
          <g 
            transform={
              defects.some(d => d.defect_type === "component_skew")
                ? "translate(480, 240) rotate(18)" // Rotated/Skewed component!
                : "translate(480, 240)"
            }
            style={{ transition: "transform 0.5s ease" }}
          >
            <rect x="0" y="0" width="45" height="22" rx="2" fill="#78350f" />
            <rect x="0" y="0" width="8" height="22" fill="#d4d4d8" />
            <rect x="37" y="0" width="8" height="22" fill="#d4d4d8" />
            <text x="22" y="14" fill="#fff" fontSize="8" fontWeight="bold" fontFamily="var(--font-mono)" textAnchor="middle">C1</text>
          </g>

          {/* Visualizing Active Defect Elements inside SVG based on API data */}
          {defects.map(d => {
            if (d.defect_type === "solder_bridge") {
              return (
                <g key={d.id}>
                  {/* Solder blob overlay bridge */}
                  <path 
                    d="M 378 316 Q 390 322 402 316" 
                    fill="none" 
                    stroke="#94a3b8" 
                    strokeWidth="8" 
                    strokeLinecap="round" 
                    filter="url(#neon-glow)"
                  />
                  {/* Neon defect flag marker */}
                  <rect 
                    x="355" y="305" width="65" height="30" 
                    fill="none" 
                    stroke="var(--neon-red)" 
                    strokeWidth="2" 
                    strokeDasharray="4 2"
                    filter="url(#neon-glow)"
                  />
                </g>
              );
            }
            
            if (d.defect_type === "hairline_crack") {
              return (
                <g key={d.id}>
                  {/* Fractured/cracked copper track */}
                  <path 
                    d="M 645 378 L 655 385 L 642 392 L 653 400" 
                    fill="none" 
                    stroke="#0a0c10" 
                    strokeWidth="4" 
                  />
                  <rect 
                    x="630" y="365" width="40" height="45" 
                    fill="none" 
                    stroke="var(--neon-red)" 
                    strokeWidth="2" 
                    strokeDasharray="4 2"
                    filter="url(#neon-glow)"
                  />
                </g>
              );
            }

            if (d.defect_type === "component_skew") {
              return (
                <rect 
                  key={d.id}
                  x="470" y="225" width="65" height="50" 
                  fill="none" 
                  stroke="var(--neon-red)" 
                  strokeWidth="2" 
                  strokeDasharray="4 2"
                  filter="url(#neon-glow)"
                />
              );
            }

            if (d.defect_type === "missing_via") {
              return (
                <g key={d.id}>
                  {/* Black hollow circle representing unplated hole */}
                  <circle cx="108" cy="405" r="4" fill="#020617" stroke="var(--neon-red)" strokeWidth="1" />
                  <rect 
                    x="95" y="392" width="25" height="25" 
                    fill="none" 
                    stroke="var(--neon-red)" 
                    strokeWidth="1.5" 
                    strokeDasharray="4 2"
                    filter="url(#neon-glow)"
                  />
                </g>
              );
            }

            if (d.defect_type === "solder_void") {
              return (
                <g key={d.id}>
                  {/* Gray circular joint containing outgassing voids */}
                  <circle cx="610" cy="410" r="10" fill="#4b5563" stroke="#94a3b8" strokeWidth="1.5" />
                  {/* Outgassing pocket circles inside */}
                  <circle cx="607" cy="407" r="2.5" fill="#020617" stroke="var(--neon-red)" strokeWidth="0.5" />
                  <circle cx="614" cy="413" r="2" fill="#020617" stroke="var(--neon-red)" strokeWidth="0.5" />
                  <circle cx="612" cy="404" r="1.5" fill="#020617" stroke="var(--neon-red)" strokeWidth="0.5" />
                  {/* Neon red bounding box */}
                  <rect 
                    x="595" y="395" width="30" height="30" 
                    fill="none" 
                    stroke="var(--neon-red)" 
                    strokeWidth="2" 
                    strokeDasharray="4 2"
                    filter="url(#neon-glow)"
                  />
                </g>
              );
            }
            return null;
          })}
        </svg>

        {/* Ambient overlay adjustments visualizer */}
        <div style={{
          ...styles.lightingFilter,
          background: `rgba(41, 121, 255, ${Math.max(0, (500 - cameraParams.led_lux) / 1000)})`
        }} />
      </div>

      {/* Defect Warnings Banner Overlay */}
      {defects.length > 0 && (
        <div style={styles.warningOverlay}>
          <span className="pulse-indicator pulse-red" style={{ marginRight: "10px" }} />
          <span style={styles.warningText}>
            ANOMALY CLASSIFIED: {defects.map(d => d.defect_type.toUpperCase().replace("_", " ")).join(", ")}
          </span>
          <span style={styles.warningConfidence}>
            CONFIDENCE: {Math.max(...defects.map(d => d.confidence * 100)).toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    borderColor: "rgba(255, 255, 255, 0.12)",
    background: "rgba(10, 12, 16, 0.8)",
  },
  hudHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    background: "rgba(0, 0, 0, 0.4)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
  },
  hudTitleGroup: {
    display: "flex",
    flexDirection: "column",
    textAlign: "left",
  },
  hudTitle: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    fontWeight: "bold",
    letterSpacing: "1px",
    color: "var(--neon-blue)",
  },
  boardIdLabel: {
    fontSize: "10px",
    color: "var(--text-muted)",
    letterSpacing: "0.5px",
    marginTop: "2px",
  },
  paramCapsules: {
    display: "flex",
    gap: "10px",
  },
  capsule: {
    display: "flex",
    flexDirection: "column",
    background: "rgba(255, 255, 255, 0.02)",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "4px",
    padding: "4px 8px",
    alignItems: "center",
    minWidth: "60px",
  },
  capsuleLabel: {
    fontSize: "8px",
    color: "var(--text-muted)",
    fontWeight: "bold",
  },
  capsuleVal: {
    fontSize: "10px",
    fontFamily: "var(--font-mono)",
    fontWeight: "bold",
    color: "var(--text-primary)",
    marginTop: "1px",
  },
  feedWindow: {
    position: "relative",
    width: "100%",
    height: "360px",
    background: "#020617",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  pcbSvg: {
    width: "100%",
    height: "100%",
    maxWidth: "800px",
    maxHeight: "500px",
  },
  lightingFilter: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    mixBlendMode: "color-dodge",
    transition: "background 0.5s ease",
  },
  warningOverlay: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "rgba(255, 23, 68, 0.15)",
    borderTop: "1px solid var(--neon-red)",
    padding: "10px 20px",
    fontFamily: "var(--font-display)",
  },
  warningText: {
    fontSize: "11px",
    color: "#fff",
    fontWeight: "bold",
    letterSpacing: "0.5px",
  },
  warningConfidence: {
    fontSize: "10px",
    fontFamily: "var(--font-mono)",
    color: "var(--neon-amber)",
    fontWeight: "bold",
  }
};
