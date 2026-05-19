# Pentagon-QC // Autonomous Batch-End PCB Quality Control

Pentagon-QC is an **AI-Native Agentic Computer Vision System** designed for High-Density Interconnect (HDI) and Multi-Layer Printed Circuit Board manufacturing quality control. 

This platform replaces brittle, rule-based Automated Optical Inspection (AOI) with an autonomous agentic inspector capable of **perceiving, reasoning about, and dynamically acting on PCB defects** (such as solder bridges, hairline trace cracks, component placement skews, and missing vias) at the close of each fabrication batch.

---

## 🚀 Key AI-Native Architecture Capabilities

1. **Perception & Adaptive Lighting Loop (`perception.py` & `agent.py`)**
   - If initial computer vision scan returns low confidence (ambiguous SMT components/traces due to reflective glare or shadow), the agent autonomously fires specialized hardware correction tools:
     - `adjust_lighting(lux, angle)`: Change LED structure to coaxial or high oblique.
     - `adjust_zoom_focus(camera_id, zoom)`: Refocus on complex areas.
   - A secondary capture is triggered immediately, clarifying ambiguity and moving confidence scores from 60% up to 98% without human operator intervention.

2. **Cross-Batch Vector Memory Analyst (`memory.py`)**
   - Defects are indexed in a semantic vector store.
   - A background statistics engine aggregates sliding-window defect patterns. 
   - If consecutive assemblies fail with identical coordinate offsets (e.g. three consecutive capacitor rotations), the agent identifies a **systemic manufacturing machine drift** (such as Pick-and-Place nozzle misalignment) and triggers an auto-line halt and alarm.

3. **Data Flywheel MES Connector (`flywheel.py`)**
   - Connects visual inspection predictions with downstream physical electrical E-Test outcomes.
   - Automatically matches predictions to isolate missed-defects (escapes) and false-positives.
   - Mismatches are saved directly as high-priority labeled coordinate JSON datasets, feeding a continuous data flywheel that retrains models toward zero false alarms.

4. **Engineered Safety Guardrails (`guardrails.py`)**
   - Implements sequential error tracking.
   - Enforces a **blast-radius limit** (5 consecutive board failures triggers physical line shutdown to prevent scrap compounding).
   - Manages a visual Human-in-the-Loop (HITL) triage overrides queue.

---

## 📂 Workspace Folder Scaffolding

```
pentagon-/
│
├── AI_Native_PCB_One_Page_Brief.docx   # System specifications brief
├── README.md                           # Main workspace setup & instruction manual
│
├── backend/                            # FastAPI Python Service
│   ├── app/
│   │   ├── main.py                     # App entry point, CORS, and Telemetry WebSocket
│   │   ├── api/                        # REST Controller Endpoints
│   │   │   ├── router.py               # Aggregated routers
│   │   │   └── v1/                     # Version 1 routers (camera, stats, triage)
│   │   ├── core/                       # Configurations, logging, and event bus
│   │   │   ├── config.py               # Pydantic environment configurations
│   │   │   ├── logging.py              # System logger setup
│   │   │   └── telemetry_bus.py        # Asynchronous decoupled event publisher
│   │   ├── services/                   # Core Business & AI Engines
│   │   │   ├── perception.py           # CV Perception simulation & hardware tethers
│   │   │   ├── agent.py                # Agentic reasoning loop & adaptive toolsets
│   │   │   ├── memory.py               # VectorDB & cross-board analyst
│   │   │   ├── guardrails.py           # Safety checks & Human triage queue
│   │   │   └── flywheel.py             # Data flywheel & E-Test MES matchers
│   │   └── schemas/                    # Pydantic schemas
│   └── requirements.txt                # Python package list (FastAPI, websockets, chromadb)
│
└── frontend/                           # React (Vite) Control Deck Application
    ├── index.html                      # Landing page with SEO optimizations
    ├── src/
    │   ├── App.jsx                     # Core HUD coordinator & WS listener
    │   ├── index.css                   # Premium Dark-Glass design tokens & scanline beams
    │   ├── hooks/                      # Custom React hooks (resilient useWebSocket)
    │   └── components/                 # Visual glassmorphic sub-panels
    │       ├── Header.jsx              # Banner displaying line speed & halt resets
    │       ├── CameraFeed.jsx          # Vector (SVG) interactive live PCB inspect window
    │       ├── AgentConsole.jsx        # Live-scrolling Agent Thought Step terminal
    │       ├── TriageQueue.jsx         # HITL operator manual override queue
    │       └── BatchStats.jsx          # Pareto yield metrics and statistical drift alerts
```

---

## 🛠️ Step-by-Step Local Deployment Setup

### 1. Run the Agentic Backend
In a terminal, navigate to the `backend/` folder:

```bash
# Navigate to backend
cd backend

# Activate virtual environment
# Windows:
..\.venv\Scripts\activate
# macOS/Linux:
source ../.venv/bin/activate

# Install high-performance package tethers
pip install -r requirements.txt

# Run the FastAPI server (reloading active)
python app/main.py
```
*The backend REST servers will boot on `http://localhost:8000` with interactive Swagger docs at `http://localhost:8000/docs`, and the live Telemetry WebSocket on `ws://localhost:8000/api/v1/ws`.*

### 2. Run the React Control Deck
In a second terminal, navigate to the `frontend/` folder:

```bash
# Navigate to frontend
cd frontend

# Install package dependencies
npm install

# Boot Vite developer dashboard
npm run dev
```
*Open `http://localhost:5173` in your browser to experience the real-time operational dashboard!*

---

## 🎮 Operational Dashboard Walkthrough
1. **System Dials**: The top header tracks simulated line conveyor speed (12.5 m/min) and sequential threat boundaries (safe bounds up to 5 consecutive boards).
2. **Triggering Perceptions**: Click **LAUNCH INSPECTION** in the bottom left deck.
3. **Adaptive Lighting**: Detections will flash. If a defect is found under uncertainty, you will see the **Agent Reasoning Console** document its thought steps (e.g. glare suspected, adjusting lighting). You'll witness the LED/Angle dials in the camera panel adjust, scale, and update in real-time, followed by a secondary resolution capture!
4. **Nozzle Drifts**: Trigger 3 component skews in a row by rolling boards. The **Vector Memory Analyst** will instantly trigger a critical **Nozzle Calibration Alert** panel.
5. **Manual Overrides**: Low-confidence resolutions escalate to the **Visual Triage Queue** in the bottom right, allowing operators to confirm or reject defect classifications to feed the **Data Flywheel**.
