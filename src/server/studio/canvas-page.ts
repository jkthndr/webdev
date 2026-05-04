import { STUDIO_CSS, CANVAS_CSS } from "./styles.js";
import type { ProjectInfo } from "../project-manager.js";

export function canvasPage(project: ProjectInfo, running: boolean, starting: boolean, hash: string): string {
  const screensJson = JSON.stringify(project.screens);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name} canvas — webdev studio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${STUDIO_CSS}${CANVAS_CSS}</style>
</head>
<body>
  <header class="studio-header">
    <a href="/studio">studio</a> <span class="sep">/</span>
    <a href="/studio/${project.name}">${project.name}</a> <span class="sep">/</span>
    <span class="current">canvas</span>
    <div class="header-actions">
      <a href="/studio/${project.name}" class="btn btn-ghost">Grid View</a>
      <button class="dark-toggle" onclick="toggleDark()" title="Toggle dark mode">&#9790;</button>
    </div>
  </header>

  <div class="canvas-layout">
    <!-- Tool palette (Pencil-style left icons) -->
    <div class="tool-palette">
      <button class="tool-btn active" data-tool="select" title="Select (V)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
      </button>
      <button class="tool-btn" data-tool="pan" title="Pan (Space)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
      </button>
      <div class="tool-sep"></div>
      <button class="tool-btn" data-tool="edit" title="Edit Elements (E)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
      </button>
      <button class="tool-btn" data-tool="annotate" title="Annotate (A)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </button>
      <div class="tool-sep"></div>
      <button class="tool-btn" data-tool="history" title="History (H)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </button>
    </div>

    <!-- Left panel: Brief / Screens / Layers -->
    <div class="left-panel" id="left-panel">
      <div class="panel-tabs">
        <button class="panel-tab" data-tab="brief" onclick="switchLeftTab('brief')">Brief</button>
        <button class="panel-tab active" data-tab="screens" onclick="switchLeftTab('screens')">Screens</button>
        <button class="panel-tab" data-tab="layers" onclick="switchLeftTab('layers')">Layers</button>
      </div>
      <div id="tab-brief" class="tab-content">
        <div class="brief-panel" id="brief-panel">
          <div class="brief-loading">Loading brief…</div>
        </div>
      </div>
      <div id="tab-screens" class="tab-content active">
        <div id="screen-list" class="screen-list"></div>
      </div>
      <div id="tab-layers" class="tab-content">
        <div id="layers-tree" class="layers-tree">
          <div class="inspector-empty" style="padding:2rem 1rem"><p>Enter edit mode (E) to view element layers</p></div>
        </div>
      </div>
    </div>

    <!-- Center: Canvas -->
    <div class="canvas-center">
      <div id="canvas-viewport">
        <div id="canvas-world"></div>
      </div>

      <div class="canvas-toolbar">
        <button onclick="zoomOut_()" title="Zoom Out">&minus;</button>
        <span class="zoom-level" id="zoom-level">100%</span>
        <button onclick="zoomIn()" title="Zoom In">+</button>
        <div class="sep"></div>
        <button onclick="fitAll()" title="Fit All (1)">Fit All</button>
        <button onclick="resetLayout()" title="Reset Layout">Reset</button>
      </div>

      <div id="minimap"><canvas id="minimap-canvas" width="180" height="120"></canvas></div>
    </div>

    <!-- Right panel: Inspector + Run -->
    <div class="inspector-panel" id="inspector-panel">
      <div class="panel-tabs">
        <button class="panel-tab" data-rtab="run" onclick="switchInspectorTab('run')">Run</button>
        <button class="panel-tab active" data-rtab="design" onclick="switchInspectorTab('design')">Design</button>
      </div>
      <div id="rtab-design" class="tab-content active">
        <div id="inspector-content" class="inspector-content">
          <div class="inspector-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
            <p>Click a screen to inspect</p>
          </div>
        </div>
      </div>
      <div id="rtab-run" class="tab-content">
        <div id="run-content" class="run-content">
          <div class="run-loading">Loading proof runs…</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Timeline panel (slides over inspector) -->
  <div id="timeline-panel" class="timeline-panel hidden">
    <div class="timeline-header">
      <span>Checkpoint History</span>
      <button class="timeline-close" onclick="setTool('select')">&times;</button>
    </div>
    <div id="timeline-list" class="timeline-list"></div>
  </div>

  <!-- Diff overlay -->
  <div id="diff-overlay" class="diff-overlay hidden">
    <div class="diff-header">
      <span id="diff-title">Visual Diff</span>
      <div class="diff-controls">
        <button class="btn btn-ghost" onclick="prevDiffScreen()">&larr;</button>
        <span id="diff-screen-label">screen</span>
        <button class="btn btn-ghost" onclick="nextDiffScreen()">&rarr;</button>
      </div>
      <button class="diff-close" onclick="closeDiff()">&times;</button>
    </div>
    <div class="diff-body">
      <div class="diff-pane">
        <div class="diff-pane-label" id="diff-left-label">Before</div>
        <img id="diff-left-img" src="about:blank" alt="Before">
      </div>
      <div class="diff-pane">
        <div class="diff-pane-label" id="diff-right-label">After (current)</div>
        <img id="diff-right-img" src="about:blank" alt="After">
      </div>
    </div>
  </div>

  <div id="canvas-toast" class="toast hidden"></div>

  <script src="https://cdn.jsdelivr.net/npm/panzoom@9.4.3/dist/panzoom.min.js"></script>
  <script>
    const PROJECT = "${project.name}";
    const RUNNING = ${running};
    const CARD_W = 420;
    const CARD_H = 500;
    const GAP = 60;
    const COLS = 3;
    const OFFSET = 60;

    let screens = ${screensJson};
    let currentHash = "${hash}";
    let pz = null;
    let cardEls = {};
    let positions = {};
    let dragging = null;
    let dragStart = null;
    let saveTimer = null;

    let spaceDown = false;
    let middleDown = false;
    let panStart = null;
    let selectedCard = null;
    let canvasEditMode = false;
    let annotateMode = false;
    let currentTool = "select";
    let selectedElement = null;

    // --- Tool Palette ---
    function setTool(tool) {
      // Deactivate previous tool modes
      if (currentTool === "edit" && tool !== "edit") deactivateEditMode();
      if (currentTool === "annotate" && tool !== "annotate") deactivateAnnotateMode();
      if (currentTool === "history" && tool !== "history") {
        document.getElementById("timeline-panel").classList.add("hidden");
      }

      currentTool = tool;
      document.querySelectorAll(".tool-btn").forEach(b => b.classList.remove("active"));
      const btn = document.querySelector('[data-tool="' + tool + '"]');
      if (btn) btn.classList.add("active");

      const viewport = document.getElementById("canvas-viewport");
      viewport.className = "";

      if (tool === "edit") activateEditMode();
      if (tool === "annotate") activateAnnotateMode();
      if (tool === "history") {
        document.getElementById("timeline-panel").classList.remove("hidden");
        loadCheckpoints();
      }
      if (tool === "pan") viewport.style.cursor = "grab";
      else viewport.style.cursor = "";
    }

    document.querySelectorAll(".tool-btn").forEach(function(btn) {
      btn.addEventListener("click", function() { setTool(btn.dataset.tool); });
    });

    const ZOOM_STEPS = [0.15, 0.25, 0.35, 0.5, 0.65, 0.8, 1, 1.25, 1.5, 2, 2.5, 3];

    function nearestStep(scale, direction) {
      if (direction > 0) {
        for (let i = 0; i < ZOOM_STEPS.length; i++) {
          if (ZOOM_STEPS[i] > scale + 0.01) return ZOOM_STEPS[i];
        }
        return ZOOM_STEPS[ZOOM_STEPS.length - 1];
      } else {
        for (let i = ZOOM_STEPS.length - 1; i >= 0; i--) {
          if (ZOOM_STEPS[i] < scale - 0.01) return ZOOM_STEPS[i];
        }
        return ZOOM_STEPS[0];
      }
    }

    // --- Init ---
    function init() {
      const world = document.getElementById("canvas-world");
      const viewport = document.getElementById("canvas-viewport");

      pz = panzoom(world, {
        maxZoom: 3,
        minZoom: 0.1,
        smoothScroll: false,
        filterKey: () => true,
        beforeMouseDown: (e) => {
          if (spaceDown || currentTool === "pan") return true;
          if (canvasEditMode && e.target.closest("iframe")) return false;
          return !e.target.closest(".screen-card");
        },
        beforeWheel: () => true,
        zoomDoubleClickSpeed: 1,
      });

      viewport.addEventListener("wheel", (e) => {
        e.preventDefault();
        const t = pz.getTransform();
        const direction = e.deltaY < 0 ? 1 : -1;
        const next = nearestStep(t.scale, direction);
        const rect = viewport.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        pz.zoomAbs(cx, cy, next);
      }, { passive: false });

      pz.on("transform", () => {
        updateMinimap();
        const t = pz.getTransform();
        document.getElementById("zoom-level").textContent = Math.round(t.scale * 100) + "%";
      });

      // Middle mouse pan
      viewport.addEventListener("mousedown", (e) => {
        if (e.button === 1) {
          e.preventDefault();
          middleDown = true;
          panStart = { x: e.clientX, y: e.clientY };
          viewport.style.cursor = "grabbing";
        }
      });
      document.addEventListener("mousemove", (e) => {
        if (middleDown && panStart) {
          const t = pz.getTransform();
          pz.moveTo(t.x + e.clientX - panStart.x, t.y + e.clientY - panStart.y);
          panStart = { x: e.clientX, y: e.clientY };
        }
      });
      document.addEventListener("mouseup", (e) => {
        if (e.button === 1) { middleDown = false; panStart = null; viewport.style.cursor = ""; }
      });
      viewport.addEventListener("auxclick", (e) => { if (e.button === 1) e.preventDefault(); });

      // Space to pan
      document.addEventListener("keydown", (e) => {
        if (e.code === "Space" && !e.repeat && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
          spaceDown = true;
          viewport.style.cursor = "grab";
          e.preventDefault();
        }
      });
      document.addEventListener("keyup", (e) => {
        if (e.code === "Space") { spaceDown = false; viewport.style.cursor = ""; }
      });

      // Prevent browser zoom
      window.addEventListener("wheel", (e) => {
        if (e.ctrlKey || e.metaKey) e.preventDefault();
      }, { passive: false, capture: true });

      loadLayoutThenRender();
      loadProofRuns(); // WEBD-66: prime proof state for the Run tab + advisory plumbing
      setInterval(pollForChanges, 3000);
      window.addEventListener("beforeunload", saveLayout);

      // Keyboard shortcuts
      document.addEventListener("keydown", (e) => {
        if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") return;
        const diffOpen = !document.getElementById("diff-overlay").classList.contains("hidden");
        if (e.key === "Escape") {
          if (diffOpen) { closeDiff(); return; }
          if (selectedCard) { deselectCard(); return; }
          setTool("select");
          return;
        }
        if (diffOpen) return;

        // Tool shortcuts
        if (e.key === "v" || e.key === "V") setTool("select");
        if (e.key === "e" || e.key === "E") setTool("edit");
        if (e.key === "a" || e.key === "A") setTool("annotate");
        if (e.key === "h" || e.key === "H") setTool("history");

        // Zoom
        if ((e.metaKey || e.ctrlKey) && (e.key === "=" || e.key === "+")) { e.preventDefault(); zoomIn(); }
        if ((e.metaKey || e.ctrlKey) && e.key === "-") { e.preventDefault(); zoomOut_(); }
        if (e.key === "+" || e.key === "=") zoomIn();
        if (e.key === "-") zoomOut_();
        if (e.key === "1") fitAll();
        if (e.key === "0") zoomTo100();

        // Select all
        if ((e.metaKey || e.ctrlKey) && e.key === "a") {
          e.preventDefault();
          Object.values(cardEls).forEach(c => c.classList.add("focused"));
        }

        // Delete selected card's screen? No — too dangerous. Skip.
      });
    }

    // --- Layout ---
    let savedViewport = null;

    async function loadLayoutThenRender() {
      try {
        const res = await fetch("/api/projects/" + PROJECT + "/layout");
        const data = await res.json();
        if (data.positions && Object.keys(data.positions).length > 0) positions = data.positions;
        if (data.viewport) savedViewport = data.viewport;
      } catch {}
      renderCards(screens, false);
      updateScreenList();
      setTimeout(() => {
        if (savedViewport) {
          pz.moveTo(savedViewport.x, savedViewport.y);
          pz.zoomAbs(0, 0, savedViewport.zoom);
        } else {
          fitAll();
        }
      }, 100);
    }

    // --- Left Panel Tabs ---
    function switchLeftTab(tab) {
      document.querySelectorAll(".left-panel .panel-tab").forEach(t => t.classList.remove("active"));
      document.querySelector('[data-tab="' + tab + '"]').classList.add("active");
      document.querySelectorAll(".left-panel .tab-content").forEach(t => t.classList.remove("active"));
      document.getElementById("tab-" + tab).classList.add("active");
      if (tab === "brief" && !briefLoaded) loadDesignBrief();
    }

    // --- Design Brief Panel (WEBD-60) ---
    let briefState = null;
    let briefExists = false;
    let briefLoaded = false;
    let briefDirty = false;
    let briefSaveTimer = null;

    const BRIEF_CHIP_FIELDS = ["goals", "tone", "mustHaves", "avoid", "inspiration"];
    const BRIEF_CHIP_LABELS = {
      goals: "Goals",
      tone: "Tone",
      mustHaves: "Must-haves",
      avoid: "Avoid",
      inspiration: "Inspiration",
    };
    const BRIEF_CHIP_PLACEHOLDERS = {
      goals: "+ add goal (Enter)",
      tone: "+ add tone (Enter)",
      mustHaves: "+ add must-have (Enter)",
      avoid: "+ add avoid (Enter)",
      inspiration: "+ link or reference (Enter)",
    };

    function emptyBrief() {
      return {
        title: "", summary: "", audience: "",
        goals: [], tone: [], mustHaves: [], avoid: [], inspiration: [],
        routes: [], notes: "",
        createdAt: "", updatedAt: "",
      };
    }

    async function loadDesignBrief() {
      try {
        const res = await fetch("/api/projects/" + PROJECT + "/design-brief");
        const data = await res.json();
        briefState = data.brief || emptyBrief();
        briefExists = !!data.exists;
        briefLoaded = true;
        briefDirty = false;
        renderBriefPanel();
      } catch {
        document.getElementById("brief-panel").innerHTML =
          '<div class="brief-error">Could not load brief. <button class="brief-retry" onclick="loadDesignBrief()">Retry</button></div>';
      }
    }

    function renderBriefPanel() {
      const panel = document.getElementById("brief-panel");
      const b = briefState || emptyBrief();
      const status = briefExists
        ? '<span class="brief-status-dot saved"></span><span class="brief-status-text">Saved ' + briefRelativeTime(b.updatedAt) + '</span>'
        : '<span class="brief-status-dot new"></span><span class="brief-status-text">No brief yet — fill out and save</span>';

      let html = '<div class="brief-status">' + status + '</div>';

      html += briefSection("Title", '<input class="brief-input" id="brief-title" placeholder="Project title" value="' + briefAttr(b.title) + '"/>');
      html += briefSection("Summary", '<textarea class="brief-textarea" id="brief-summary" rows="3" placeholder="What we are building, why, for whom">' + briefHtml(b.summary) + '</textarea>');
      html += briefSection("Audience", '<input class="brief-input" id="brief-audience" placeholder="Who is the user?" value="' + briefAttr(b.audience) + '"/>');

      BRIEF_CHIP_FIELDS.forEach(function(field) {
        html += briefSection(BRIEF_CHIP_LABELS[field], renderBriefChips(field, b[field] || []));
      });

      html += briefSection("Notes", '<textarea class="brief-textarea" id="brief-notes" rows="3" placeholder="Anything else worth noting">' + briefHtml(b.notes) + '</textarea>');

      html += '<div class="brief-save-bar">' +
        '<button class="brief-save-btn" id="brief-save-btn" onclick="saveBrief()" disabled>Save brief</button>' +
        '<span class="brief-saved" id="brief-saved"></span>' +
      '</div>';

      panel.innerHTML = html;
      attachBriefHandlers();
    }

    function briefSection(title, body) {
      return '<div class="brief-section">' +
        '<div class="brief-section-title">' + title + '</div>' +
        body +
      '</div>';
    }

    function renderBriefChips(field, values) {
      const chips = values.map(function(v, i) {
        return '<span class="brief-chip" data-field="' + field + '" data-idx="' + i + '">' +
          '<span class="brief-chip-text">' + briefHtml(v) + '</span>' +
          '<button class="brief-chip-remove" onclick="removeBriefChip(\\'' + field + '\\', ' + i + ')" aria-label="Remove">&times;</button>' +
        '</span>';
      }).join("");
      return '<div class="brief-chips">' + chips + '</div>' +
        '<input class="brief-chip-input" data-field="' + field + '" placeholder="' + BRIEF_CHIP_PLACEHOLDERS[field] + '"/>';
    }

    function attachBriefHandlers() {
      ["brief-title", "brief-summary", "brief-audience", "brief-notes"].forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", markBriefDirty);
      });
      document.querySelectorAll(".brief-chip-input").forEach(function(input) {
        input.addEventListener("keydown", function(e) {
          if (e.key === "Enter") {
            e.preventDefault();
            const value = input.value.trim();
            if (!value) return;
            addBriefChip(input.dataset.field, value);
            input.value = "";
          }
        });
      });
    }

    function markBriefDirty() {
      briefDirty = true;
      const btn = document.getElementById("brief-save-btn");
      if (btn) btn.disabled = false;
      const saved = document.getElementById("brief-saved");
      if (saved) saved.textContent = "";
    }

    function addBriefChip(field, value) {
      if (!briefState) briefState = emptyBrief();
      briefState[field] = (briefState[field] || []).concat([value]);
      markBriefDirty();
      // Re-render only the affected section to preserve focus on input
      flushBriefScalars();
      renderBriefPanel();
      const input = document.querySelector('.brief-chip-input[data-field="' + field + '"]');
      if (input) input.focus();
    }

    function removeBriefChip(field, idx) {
      if (!briefState || !Array.isArray(briefState[field])) return;
      briefState[field] = briefState[field].filter(function(_, i) { return i !== idx; });
      markBriefDirty();
      flushBriefScalars();
      renderBriefPanel();
    }

    function flushBriefScalars() {
      // Capture current input values into briefState before re-render
      const titleEl = document.getElementById("brief-title");
      const summaryEl = document.getElementById("brief-summary");
      const audienceEl = document.getElementById("brief-audience");
      const notesEl = document.getElementById("brief-notes");
      if (!briefState) briefState = emptyBrief();
      if (titleEl) briefState.title = titleEl.value;
      if (summaryEl) briefState.summary = summaryEl.value;
      if (audienceEl) briefState.audience = audienceEl.value;
      if (notesEl) briefState.notes = notesEl.value;
    }

    async function saveBrief() {
      flushBriefScalars();
      const btn = document.getElementById("brief-save-btn");
      const saved = document.getElementById("brief-saved");
      if (btn) { btn.disabled = true; btn.textContent = "Saving…"; }
      try {
        const res = await fetch("/api/projects/" + PROJECT + "/design-brief", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: briefState.title || "",
            summary: briefState.summary || "",
            audience: briefState.audience || "",
            goals: briefState.goals || [],
            tone: briefState.tone || [],
            mustHaves: briefState.mustHaves || [],
            avoid: briefState.avoid || [],
            inspiration: briefState.inspiration || [],
            notes: briefState.notes || "",
          }),
        });
        if (!res.ok) throw new Error("save failed");
        const data = await res.json();
        briefState = data.brief;
        briefExists = true;
        briefDirty = false;
        if (btn) { btn.textContent = "Save brief"; btn.disabled = true; }
        if (saved) saved.textContent = "Saved";
        // Update only the status header, preserve form focus
        const statusEl = document.querySelector(".brief-status");
        if (statusEl) {
          statusEl.innerHTML =
            '<span class="brief-status-dot saved"></span>' +
            '<span class="brief-status-text">Saved ' + briefRelativeTime(briefState.updatedAt) + '</span>';
        }
      } catch (e) {
        if (btn) { btn.textContent = "Save brief"; btn.disabled = false; }
        if (saved) saved.textContent = "Save failed";
      }
    }

    function briefRelativeTime(iso) {
      if (!iso) return "";
      const then = new Date(iso).getTime();
      if (!then) return "";
      const diff = Date.now() - then;
      if (diff < 30 * 1000) return "just now";
      if (diff < 60 * 60 * 1000) return Math.round(diff / 60000) + "m ago";
      if (diff < 24 * 60 * 60 * 1000) return Math.round(diff / 3600000) + "h ago";
      return new Date(iso).toLocaleDateString();
    }

    function briefHtml(s) { return String(s || "").replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function briefAttr(s) { return String(s || "").replace(/&/g,'&amp;').replace(/"/g,'&quot;'); }

    // --- Proof Runs / Run Timeline (WEBD-66) ---
    let proofRuns = [];
    let proofLoaded = false;
    let proofPollTimer = null;
    let activeInspectorTab = "design";

    function switchInspectorTab(tab) {
      activeInspectorTab = tab;
      document.querySelectorAll(".inspector-panel .panel-tab").forEach(t => t.classList.remove("active"));
      const btn = document.querySelector('[data-rtab="' + tab + '"]');
      if (btn) btn.classList.add("active");
      document.querySelectorAll(".inspector-panel .tab-content").forEach(t => t.classList.remove("active"));
      document.getElementById("rtab-" + tab).classList.add("active");
      if (tab === "run") {
        if (!proofLoaded) loadProofRuns();
        startProofPolling();
      } else {
        stopProofPolling();
      }
    }

    function startProofPolling() {
      if (proofPollTimer) return;
      proofPollTimer = setInterval(loadProofRuns, 8000);
    }

    function stopProofPolling() {
      if (proofPollTimer) { clearInterval(proofPollTimer); proofPollTimer = null; }
    }

    async function loadProofRuns() {
      try {
        const res = await fetch("/api/projects/" + PROJECT + "/proof-runs");
        const data = await res.json();
        proofRuns = Array.isArray(data.proofRuns) ? data.proofRuns : [];
        proofLoaded = true;
        renderProofRuns();
        updateProofState();
      } catch {
        const el = document.getElementById("run-content");
        if (el) el.innerHTML = '<div class="run-error">Could not load proof runs. <button class="brief-retry" onclick="loadProofRuns()">Retry</button></div>';
      }
    }

    function renderProofRuns() {
      const el = document.getElementById("run-content");
      if (!el) return;

      // Filter to current screen if one is selected; otherwise show all
      const filtered = selectedCard
        ? proofRuns.filter(r => r.screen === selectedCard)
        : proofRuns;

      if (filtered.length === 0) {
        const hint = selectedCard
          ? 'No proof runs for <strong>' + briefHtml(selectedCard) + '</strong> yet.'
          : 'No proof runs in this project yet.';
        el.innerHTML = '<div class="run-empty">' +
          '<div class="run-empty-icon">⊙</div>' +
          '<div class="run-empty-title">No proof yet</div>' +
          '<div class="run-empty-hint">' + hint + '</div>' +
          '<div class="run-empty-hint">Run proof on a screen to capture the production-build screenshot. Live preview is advisory until then.</div>' +
        '</div>';
        return;
      }

      const latest = filtered[0];
      const history = filtered.slice(1);

      let html = '<div class="run-section run-section-latest">' +
        '<div class="run-section-title">Latest run</div>' +
        renderProofRunCard(latest, true) +
      '</div>';

      if (history.length > 0) {
        html += '<div class="run-section">' +
          '<div class="run-section-title">History (' + history.length + ')</div>' +
          history.map(r => renderProofRunCard(r, false)).join("") +
        '</div>';
      }

      el.innerHTML = html;
    }

    function renderProofRunCard(run, isLatest) {
      const passed = run.status === "passed";
      const pipClass = "run-status-pip " + (passed ? "passed" : "failed");
      const pipGlyph = passed ? "✓" : "✗";
      const vp = run.viewport ? run.viewport.width + "×" + run.viewport.height : "—";
      const time = run.completedAt || run.startedAt;
      const ago = briefRelativeTime(time);

      let card = '<div class="run-item' + (passed ? " passed" : " failed") + (isLatest ? " latest" : "") + '">';

      card += '<div class="run-item-header">' +
        '<span class="' + pipClass + '">' + pipGlyph + '</span>' +
        '<span class="run-screen">' + briefHtml(run.screen) + '</span>' +
        '<span class="run-vp">' + vp + '</span>' +
        '<span class="run-time">' + ago + '</span>' +
      '</div>';

      if (passed) {
        if (isLatest && run.screenshotPath) {
          card += '<a class="run-screenshot" href="/api/projects/' + PROJECT + '/proof-runs/' + run.id + '/screenshot" target="_blank">' +
            '<img src="/api/projects/' + PROJECT + '/proof-runs/' + run.id + '/screenshot" alt="Proof screenshot" loading="lazy"/>' +
          '</a>';
        }
        if (run.checkpointHash) {
          card += '<div class="run-meta-row"><span class="run-meta-label">Checkpoint</span><span class="run-meta-mono">' + run.checkpointHash.slice(0, 7) + '</span></div>';
        }
      } else {
        card += '<div class="run-failure">' +
          '<div class="run-failure-stage">Failed at: <span class="run-meta-mono">' + briefHtml(run.failureStage || "unknown") + '</span></div>' +
          (run.error ? '<div class="run-failure-error">' + briefHtml(run.error) + '</div>' : '') +
        '</div>';
      }

      if (Array.isArray(run.changedFiles) && run.changedFiles.length > 0 && isLatest) {
        card += '<details class="run-changed"' + (run.changedFiles.length <= 5 ? " open" : "") + '>' +
          '<summary>Changed files (' + run.changedFiles.length + ')</summary>' +
          '<ul class="run-changed-list">' +
            run.changedFiles.map(f => '<li>' + briefHtml(f) + '</li>').join("") +
          '</ul>' +
        '</details>';
      }

      card += '</div>';
      return card;
    }

    // Per-screen latest proof state — keyed by screen name.
    // Values: "passed" | "failed" | "stale" | "none"
    let screenProofStatus = {};
    // Latest *passed* run per screen; the proof-mode card uses it to source
    // the screenshot URL + meta. Distinct from screenProofStatus because a
    // screen can be classified "stale" while still having a viewable older
    // proof artifact.
    let screenLatestPassedProof = {};
    // Per-card view mode: "live" (iframe/thumb) or "proof" (screenshot).
    let cardModes = {};

    function classifyProof(run, sourceHash) {
      if (!run) return "none";
      if (run.status === "failed") return "failed";
      if (run.checkpointHash && sourceHash && run.checkpointHash.slice(0, 7) !== sourceHash.slice(0, 7)) {
        return "stale";
      }
      return "passed";
    }

    // Sets proof-state class on the inspector panel + each screen card,
    // and toggles the Advisory chip on cards whose proof is stale/missing
    // (WEBD-63: trust-hierarchy treatment).
    function updateProofState() {
      const panel = document.getElementById("inspector-panel");

      // Compute per-screen latest run + classify
      const latestByScreen = {};
      const latestPassedByScreen = {};
      for (const run of proofRuns) {
        if (!latestByScreen[run.screen]) latestByScreen[run.screen] = run;
        if (run.status === "passed" && !latestPassedByScreen[run.screen]) {
          latestPassedByScreen[run.screen] = run;
        }
      }
      screenProofStatus = {};
      screenLatestPassedProof = latestPassedByScreen;
      for (const screen of screens) {
        screenProofStatus[screen] = classifyProof(latestByScreen[screen], currentHash);
      }

      // Inspector rail: reflects the most concerning state across screens —
      // failed > stale > none > passed. (Pessimistic so the rail doesn't
      // read green when any screen is broken.)
      const summary = (() => {
        const states = Object.values(screenProofStatus);
        if (states.includes("failed")) return "failed";
        if (states.includes("stale")) return "stale";
        if (states.length === 0 || states.every(s => s === "none")) return "none";
        if (states.includes("none")) return "stale";
        return "passed";
      })();

      if (panel) {
        panel.classList.remove("proof-passed", "proof-failed", "proof-stale", "proof-none");
        panel.classList.add("proof-" + summary);
      }

      // Per-card advisory state
      Object.keys(cardEls).forEach(name => {
        const card = cardEls[name];
        if (!card) return;
        const status = screenProofStatus[name] || "none";
        card.classList.remove("proof-passed", "proof-failed", "proof-stale", "proof-none");
        card.classList.add("proof-" + status);

        // Add/update advisory chip on the frame label name span
        const labelName = card.querySelector(".sc-frame-label-name");
        if (!labelName) return;
        let chip = labelName.querySelector(".sc-advisory-chip");
        const needsChip = status === "stale" || status === "none" || status === "failed";
        if (needsChip) {
          if (!chip) {
            chip = document.createElement("span");
            chip.className = "sc-advisory-chip";
            labelName.appendChild(chip);
          }
          chip.classList.remove("stale", "none", "failed");
          chip.classList.add(status);
          chip.textContent = status === "failed" ? "Proof failed"
            : status === "stale" ? "Advisory · proof stale"
            : "Advisory · no proof";
        } else if (chip) {
          chip.remove();
        }

        // WEBD-62: refresh proof view + toggle availability
        updateCardProofView(name);
      });
    }

    // WEBD-62: populate proof view + enable/disable Proof toggle on a card
    function updateCardProofView(name) {
      const card = cardEls[name];
      if (!card) return;
      const proofView = card.querySelector(".sc-view-proof");
      const proofBtn = card.querySelector('.sc-mode-btn[data-mode="proof"]');
      if (!proofView || !proofBtn) return;
      const run = screenLatestPassedProof[name];

      if (!run) {
        proofBtn.disabled = true;
        proofBtn.title = "No passing proof yet — run proof to capture";
        proofView.innerHTML =
          '<div class="sc-proof-empty">' +
            '<div class="sc-proof-empty-icon">⊙</div>' +
            '<div class="sc-proof-empty-msg">No passing proof yet</div>' +
            '<div class="sc-proof-empty-hint">Run proof to capture an authoritative screenshot.</div>' +
          '</div>';
        // If currently in proof mode but no proof exists, fall back to live
        if (cardModes[name] === "proof") setCardMode(name, "live");
        return;
      }

      proofBtn.disabled = false;
      proofBtn.title = "Latest production proof (authoritative) — " + briefRelativeTime(run.completedAt);
      const screenshotUrl = "/api/projects/" + PROJECT + "/proof-runs/" + run.id + "/screenshot";
      const vp = run.viewport ? run.viewport.width + "×" + run.viewport.height : "—";
      const checkpoint = run.checkpointHash ? run.checkpointHash.slice(0, 7) : "—";
      const ago = briefRelativeTime(run.completedAt);
      const isStale = screenProofStatus[name] === "stale";

      proofView.innerHTML =
        '<a class="sc-proof-img" href="' + screenshotUrl + '" target="_blank" title="Open proof screenshot">' +
          '<img src="' + screenshotUrl + '" alt="Proof screenshot of ' + briefAttr(name) + '" loading="lazy"/>' +
        '</a>' +
        '<div class="sc-proof-meta">' +
          '<span class="sc-proof-status ' + (isStale ? "stale" : "current") + '">' +
            (isStale ? "Stale proof" : "Current proof") +
          '</span>' +
          '<span class="sc-proof-meta-mono">' + checkpoint + '</span>' +
          '<span class="sc-proof-meta-mono">' + vp + '</span>' +
          '<span class="sc-proof-meta-time">' + ago + '</span>' +
        '</div>';
    }

    function setCardMode(name, mode) {
      const card = cardEls[name];
      if (!card) return;
      cardModes[name] = mode;
      card.classList.remove("mode-live", "mode-proof");
      card.classList.add("mode-" + mode);
      card.querySelectorAll(".sc-mode-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.mode === mode);
      });
    }

    // --- Screen List ---
    let domTrees = {}; // screen name -> tree data

    function updateScreenList() {
      const list = document.getElementById("screen-list");
      list.innerHTML = screens.map((name, i) => {
        const isSelected = selectedCard === name;
        return '<div class="screen-list-item' + (isSelected ? ' selected' : '') + '" data-screen="' + name + '" onclick="selectCardByName(\\'' + name + '\\')">' +
          '<span class="screen-list-num">' + (i + 1) + '.</span>' +
          '<span class="screen-list-name">' + name + '</span>' +
        '</div>';
      }).join("");
    }

    function selectCardByName(name) {
      selectCard(name);
      const pos = positions[name];
      if (!pos) return;
      const t = pz.getTransform();
      const vp = document.getElementById("canvas-viewport");
      const tx = vp.clientWidth / 2 - (pos.x + CARD_W / 2) * t.scale;
      const ty = vp.clientHeight / 2 - (pos.y + CARD_H / 2) * t.scale;
      pz.moveTo(tx, ty);
    }

    // --- Layers Tree ---
    function updateLayersTree(screenName) {
      const container = document.getElementById("layers-tree");
      const tree = domTrees[screenName];
      if (!tree || tree.length === 0) {
        container.innerHTML = '<div class="inspector-empty" style="padding:2rem 1rem"><p>No elements found</p></div>';
        return;
      }
      container.innerHTML = renderTreeNodes(tree, 0);
    }

    function renderTreeNodes(nodes, depth) {
      return nodes.map(function(node) {
        const hasChildren = node.children && node.children.length > 0;
        const indent = depth * 16;
        const icon = hasChildren ? '<span class="tree-toggle" onclick="this.parentElement.classList.toggle(\\'collapsed\\')">&#9662;</span>' : '<span class="tree-leaf"></span>';
        let html = '<div class="tree-node" style="padding-left:' + indent + 'px">' +
          icon +
          '<span class="tree-label">' + escHtml(node.label) + '</span>' +
        '</div>';
        if (hasChildren) {
          html = '<div class="tree-group">' + html +
            '<div class="tree-children">' + renderTreeNodes(node.children, depth + 1) + '</div></div>';
        }
        return html;
      }).join("");
    }

    function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    // --- Card Selection ---
    function selectCard(name) {
      Object.values(cardEls).forEach(c => c.classList.remove("focused"));
      selectedCard = name;
      if (cardEls[name]) cardEls[name].classList.add("focused");
      updateScreenList();
      updateInspector();
      if (domTrees[name]) updateLayersTree(name);
      if (proofLoaded) renderProofRuns();
    }

    function deselectCard() {
      Object.values(cardEls).forEach(c => c.classList.remove("focused"));
      selectedCard = null;
      selectedElement = null;
      updateScreenList();
      updateInspector();
      if (proofLoaded) renderProofRuns();
    }

    // --- Inspector (Pencil-style sections) ---
    function updateInspector() {
      const content = document.getElementById("inspector-content");

      if (!selectedCard) {
        content.innerHTML = '<div class="inspector-empty">' +
          '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>' +
          '<p>Click a screen to inspect</p></div>';
        return;
      }

      // Element selected in edit mode — show Pencil-style properties
      if (selectedElement && canvasEditMode) {
        const sig = selectedElement.signature;
        const s = sig.styles || {};
        let html = '';

        // Element name header
        html += '<div class="inspector-el-header">' +
          '<span class="inspector-el-tag">&lt;' + sig.tagName + '&gt;</span>' +
          (sig.className ? '<span class="inspector-el-class">' + sig.className.split(' ').slice(0, 2).join(' ') + '</span>' : '') +
        '</div>';

        // Breadcrumb
        html += '<div class="inspector-breadcrumb">' + escHtml(sig.path || sig.tagName) + '</div>';

        // Content (editable text)
        if (sig.directText) {
          html += '<div class="inspector-section">' +
            '<div class="inspector-section-title">Content</div>' +
            '<div class="inspector-text-edit">' +
              '<textarea id="inspector-text-input" rows="2">' + escHtml(sig.directText) + '</textarea>' +
              '<button class="inspector-save-btn" onclick="saveInspectorText()">Save</button>' +
            '</div></div>';
        }

        // Position
        html += '<div class="inspector-section">' +
          '<div class="inspector-section-title">Position</div>' +
          '<div class="inspector-grid-2">' +
            '<div class="inspector-input-group"><span class="input-label">X</span><span class="input-value">' + sig.rect.x + '</span></div>' +
            '<div class="inspector-input-group"><span class="input-label">Y</span><span class="input-value">' + sig.rect.y + '</span></div>' +
          '</div></div>';

        // Dimensions
        html += '<div class="inspector-section">' +
          '<div class="inspector-section-title">Dimensions</div>' +
          '<div class="inspector-grid-2">' +
            '<div class="inspector-input-group"><span class="input-label">W</span><span class="input-value">' + sig.rect.w + '</span></div>' +
            '<div class="inspector-input-group"><span class="input-label">H</span><span class="input-value">' + sig.rect.h + '</span></div>' +
          '</div>' +
          '<div class="inspector-field"><span class="inspector-label">display</span><span class="inspector-value mono">' + (s.display || '') + '</span></div>' +
        '</div>';

        // Typography
        if (s.fontSize || s.fontFamily) {
          html += '<div class="inspector-section">' +
            '<div class="inspector-section-title">Typography</div>' +
            (s.fontFamily ? '<div class="inspector-field"><span class="inspector-label">Font</span><span class="inspector-value mono">' + s.fontFamily + '</span></div>' : '') +
            (s.fontSize ? '<div class="inspector-field"><span class="inspector-label">Size</span><span class="inspector-value mono">' + s.fontSize + '</span></div>' : '') +
            (s.fontWeight ? '<div class="inspector-field"><span class="inspector-label">Weight</span><span class="inspector-value mono">' + s.fontWeight + '</span></div>' : '') +
            (s.color ? '<div class="inspector-field"><span class="inspector-label">Color</span><span class="inspector-value mono"><span class="inspector-swatch" style="background:' + s.color + '"></span>' + s.color + '</span></div>' : '') +
          '</div>';
        }

        // Spacing
        if (s.padding || s.margin) {
          html += '<div class="inspector-section">' +
            '<div class="inspector-section-title">Spacing</div>' +
            (s.padding && s.padding !== '0px' ? '<div class="inspector-field"><span class="inspector-label">Padding</span><span class="inspector-value mono">' + s.padding + '</span></div>' : '') +
            (s.margin && s.margin !== '0px' ? '<div class="inspector-field"><span class="inspector-label">Margin</span><span class="inspector-value mono">' + s.margin + '</span></div>' : '') +
          '</div>';
        }

        // Fill / Background
        if (s.backgroundColor && s.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          html += '<div class="inspector-section">' +
            '<div class="inspector-section-title">Fill</div>' +
            '<div class="inspector-field"><span class="inspector-label">Background</span><span class="inspector-value mono"><span class="inspector-swatch" style="background:' + s.backgroundColor + '"></span>' + s.backgroundColor + '</span></div>' +
          '</div>';
        }

        // Border
        if (s.borderRadius && s.borderRadius !== '0px') {
          html += '<div class="inspector-section">' +
            '<div class="inspector-section-title">Border</div>' +
            '<div class="inspector-field"><span class="inspector-label">Radius</span><span class="inspector-value mono">' + s.borderRadius + '</span></div>' +
          '</div>';
        }

        content.innerHTML = html;
        return;
      }

      // Screen selected but no element — show screen info + hint
      let html = '<div class="inspector-el-header">' +
        '<span class="inspector-el-tag">' + selectedCard + '</span>' +
      '</div>';

      html += '<div class="inspector-section">' +
        '<div class="inspector-section-title">Position</div>' +
        '<div class="inspector-grid-2">' +
          '<div class="inspector-input-group"><span class="input-label">X</span><span class="input-value">' + Math.round(positions[selectedCard]?.x || 0) + '</span></div>' +
          '<div class="inspector-input-group"><span class="input-label">Y</span><span class="input-value">' + Math.round(positions[selectedCard]?.y || 0) + '</span></div>' +
        '</div></div>';

      html += '<div class="inspector-section">' +
        '<div class="inspector-section-title">Dimensions</div>' +
        '<div class="inspector-grid-2">' +
          '<div class="inspector-input-group"><span class="input-label">W</span><span class="input-value">' + CARD_W + '</span></div>' +
          '<div class="inspector-input-group"><span class="input-label">H</span><span class="input-value">' + CARD_H + '</span></div>' +
        '</div></div>';

      if (!canvasEditMode) {
        html += '<div class="inspector-section">' +
          '<div class="inspector-hint">Press <kbd>E</kbd> to edit mode to inspect elements</div></div>';
      }

      content.innerHTML = html;
    }

    function saveInspectorText() {
      const input = document.getElementById("inspector-text-input");
      if (!input || !selectedElement || !selectedCard) return;
      const newText = input.value;
      const oldText = selectedElement.signature.directText;
      if (newText === oldText) return;

      showToast("Saving...");
      fetch("/api/projects/" + PROJECT + "/screens/" + selectedCard + "/edit-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldText: oldText, newText: newText }),
      }).then(r => {
        if (r.ok) { showToast("Saved"); selectedElement.signature.directText = newText; }
        else showToast("Save failed");
      }).catch(() => showToast("Save failed"));
    }

    // --- Card Rendering ---
    function renderCards(screenList, animate) {
      const world = document.getElementById("canvas-world");
      const existing = new Set(Object.keys(cardEls));
      const current = new Set(screenList);

      screenList.forEach((name, i) => {
        if (!cardEls[name]) {
          if (!positions[name]) positions[name] = autoPosition(Object.keys(positions).length);
          const card = createCard(name, positions[name], animate);
          world.appendChild(card);
          cardEls[name] = card;
        }
      });

      existing.forEach(name => {
        if (!current.has(name)) {
          cardEls[name].style.opacity = "0";
          cardEls[name].style.transition = "opacity 0.3s";
          setTimeout(() => { cardEls[name].remove(); delete cardEls[name]; delete positions[name]; }, 300);
        }
      });

      updateMinimap();
      updateScreenList();
      if (proofLoaded) updateProofState();
    }

    function createCard(name, pos, animate) {
      const card = document.createElement("div");
      card.className = "screen-card mode-live" + (animate ? " entering" : "");
      card.dataset.screen = name;
      card.style.left = pos.x + "px";
      card.style.top = pos.y + "px";
      cardModes[name] = "live";

      const proxyUrl = "/proxy/" + PROJECT + "/screens/" + name;
      const newBadge = animate ? '<span class="sc-new-badge">NEW</span>' : '';
      const IFRAME_H = 700;

      const labelHtml =
        '<span class="sc-frame-label-name">' + name + newBadge + '</span>' +
        '<span class="sc-mode-toggle" data-screen="' + name + '">' +
          '<button class="sc-mode-btn active" data-mode="live" title="Live preview (advisory)">Live</button>' +
          '<button class="sc-mode-btn" data-mode="proof" title="Latest production proof (authoritative)" disabled>Proof</button>' +
        '</span>';

      let liveHtml;
      if (RUNNING) {
        liveHtml =
          '<div class="sc-iframe-wrap" style="height:' + IFRAME_H + 'px">' +
            '<iframe class="sc-iframe" src="' + proxyUrl + '" style="width:' + CARD_W + 'px;height:' + IFRAME_H + 'px" loading="lazy"></iframe>' +
            '<div class="sc-frame-overlay sc-frame-starting hidden">' +
              '<div class="sc-overlay-spin"></div>' +
              '<div class="sc-overlay-msg">Starting preview…</div>' +
            '</div>' +
            '<div class="sc-frame-overlay sc-frame-error hidden">' +
              '<div class="sc-overlay-msg">Preview failed to load</div>' +
              '<button class="sc-overlay-retry" data-screen="' + name + '">Retry</button>' +
            '</div>' +
          '</div>';
      } else {
        const thumbUrl = "/api/projects/" + PROJECT + "/screens/" + name + "/thumbnail?t=" + Date.now();
        liveHtml =
          '<img class="sc-thumb" src="' + thumbUrl + '" alt="' + name + '" onerror="this.outerHTML=\\'<div class=sc-thumb-empty>Not running</div>\\'"/>';
      }

      const proofHtml =
        '<div class="sc-proof-view sc-proof-empty">' +
          '<div class="sc-proof-empty-icon">⊙</div>' +
          '<div class="sc-proof-empty-msg">No passing proof yet</div>' +
          '<div class="sc-proof-empty-hint">Run proof to capture an authoritative screenshot.</div>' +
        '</div>';

      card.innerHTML =
        '<div class="sc-frame-label">' + labelHtml + '</div>' +
        '<div class="sc-frame-content">' +
          '<div class="sc-view sc-view-live">' + liveHtml + '</div>' +
          '<div class="sc-view sc-view-proof">' + proofHtml + '</div>' +
        '</div>';

      // Mode toggle handlers
      card.querySelectorAll(".sc-mode-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (btn.disabled) return;
          setCardMode(name, btn.dataset.mode);
        });
        btn.addEventListener("mousedown", (e) => e.stopPropagation());
      });

      // Iframe load/error handling for starting/error states
      const iframe = card.querySelector(".sc-iframe");
      if (iframe) {
        let loadTimer = setTimeout(() => {
          const overlay = card.querySelector(".sc-frame-starting");
          if (overlay) overlay.classList.remove("hidden");
        }, 600);
        iframe.addEventListener("load", () => {
          clearTimeout(loadTimer);
          const startingOv = card.querySelector(".sc-frame-starting");
          const errorOv = card.querySelector(".sc-frame-error");
          if (startingOv) startingOv.classList.add("hidden");
          if (errorOv) errorOv.classList.add("hidden");
        });
        iframe.addEventListener("error", () => {
          clearTimeout(loadTimer);
          const startingOv = card.querySelector(".sc-frame-starting");
          const errorOv = card.querySelector(".sc-frame-error");
          if (startingOv) startingOv.classList.add("hidden");
          if (errorOv) errorOv.classList.remove("hidden");
        });
      }
      const retryBtn = card.querySelector(".sc-overlay-retry");
      if (retryBtn) {
        retryBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const f = card.querySelector(".sc-iframe");
          if (f) f.src = f.src;
          const errorOv = card.querySelector(".sc-frame-error");
          if (errorOv) errorOv.classList.add("hidden");
        });
      }

      // Click → select card (Pencil-style, no preview overlay)
      card.addEventListener("click", (e) => {
        if (spaceDown || dragStart?.moved) return;
        if (canvasEditMode && e.target.closest("iframe")) return;
        selectCard(name);
      });

      // Drag by label
      card.querySelector(".sc-frame-label").addEventListener("mousedown", (e) => {
        if (e.button !== 0 || spaceDown) return;
        e.stopPropagation();
        dragging = name;
        dragStart = { x: e.clientX, y: e.clientY, ox: pos.x, oy: pos.y, moved: false };
        card.style.zIndex = "10";
        card.style.cursor = "grabbing";
      });

      // Also drag from card border area (not iframe)
      card.addEventListener("mousedown", (e) => {
        if (e.button !== 0 || spaceDown || e.target.closest("iframe") || e.target.closest(".sc-frame-label")) return;
        if (!canvasEditMode) {
          e.stopPropagation();
          dragging = name;
          dragStart = { x: e.clientX, y: e.clientY, ox: pos.x, oy: pos.y, moved: false };
          card.style.zIndex = "10";
          card.style.cursor = "grabbing";
        }
      });

      if (animate) setTimeout(() => card.classList.remove("entering"), 500);
      return card;
    }

    // Global drag
    document.addEventListener("mousemove", (e) => {
      if (!dragging || !dragStart) return;
      const t = pz.getTransform();
      const dx = (e.clientX - dragStart.x) / t.scale;
      const dy = (e.clientY - dragStart.y) / t.scale;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragStart.moved = true;
      positions[dragging] = { x: dragStart.ox + dx, y: dragStart.oy + dy };
      const card = cardEls[dragging];
      if (card) { card.style.left = positions[dragging].x + "px"; card.style.top = positions[dragging].y + "px"; }
      updateMinimap();
    });

    document.addEventListener("mouseup", () => {
      if (dragging) {
        const wasDrag = dragStart?.moved;
        const card = cardEls[dragging];
        if (card) { card.style.zIndex = ""; card.style.cursor = ""; }
        dragging = null; dragStart = null;
        if (wasDrag) debounceSave();
      }
    });

    function autoPosition(index) {
      const col = index % COLS;
      const row = Math.floor(index / COLS);
      return { x: OFFSET + col * (CARD_W + GAP), y: OFFSET + row * (CARD_H + GAP) };
    }

    // --- Edit Mode ---
    async function activateEditMode() {
      canvasEditMode = true;
      document.getElementById("canvas-viewport").classList.add("canvas-edit-mode");
      const editBtn = document.querySelector('[data-tool="edit"]');
      if (editBtn) editBtn.classList.add("active");

      showToast("Starting edit mode...");
      try { await fetch("/api/projects/" + PROJECT + "/switch-to-dev", { method: "POST" }); } catch {}
      showToast("Edit mode active");

      Object.keys(cardEls).forEach(function(name) {
        const iframe = cardEls[name].querySelector(".sc-iframe");
        if (iframe) {
          iframe.style.pointerEvents = "auto";
          iframe.src = "/proxy/" + PROJECT + "/screens/" + name + "?edit=1";
          iframe.dataset.screen = name;
        }
      });

      updateInspector();
    }

    function deactivateEditMode() {
      canvasEditMode = false;
      selectedElement = null;
      document.getElementById("canvas-viewport").classList.remove("canvas-edit-mode");

      Object.keys(cardEls).forEach(function(name) {
        const iframe = cardEls[name].querySelector(".sc-iframe");
        if (iframe) {
          iframe.style.pointerEvents = "none";
          iframe.src = "/proxy/" + PROJECT + "/screens/" + name;
        }
      });

      updateInspector();
    }

    // --- Annotate Mode ---
    function activateAnnotateMode() {
      annotateMode = true;
      document.getElementById("canvas-viewport").classList.add("annotate-mode");
      loadAnnotations();
    }

    function deactivateAnnotateMode() {
      annotateMode = false;
      document.getElementById("canvas-viewport").classList.remove("annotate-mode");
    }

    // --- Messages from editing runtime ---
    window.addEventListener("message", async (e) => {
      if (!e.data || !e.data.type) return;

      // Find which screen sent the message
      let screenName = null;
      Object.keys(cardEls).forEach(function(name) {
        const iframe = cardEls[name].querySelector(".sc-iframe");
        if (iframe && iframe.contentWindow === e.source) screenName = name;
      });

      // Canvas edit mode messages
      if (canvasEditMode && screenName) {
        if (e.data.type === "text-edited") {
          showToast("Saving...");
          try {
            const res = await fetch("/api/projects/" + PROJECT + "/screens/" + screenName + "/edit-text", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ oldText: e.data.oldText, newText: e.data.newText }),
            });
            if (res.ok) showToast("Saved");
            else showToast("Save failed");
          } catch { showToast("Save failed"); }
        }

        if (e.data.type === "element-selected") {
          selectedCard = screenName;
          selectedElement = { signature: e.data.signature, hasText: e.data.hasText, screen: screenName };
          Object.values(cardEls).forEach(c => c.classList.remove("focused"));
          if (cardEls[screenName]) cardEls[screenName].classList.add("focused");
          updateScreenList();
          updateInspector();
        }

        if (e.data.type === "element-deselected") {
          selectedElement = null;
          updateInspector();
        }

        if (e.data.type === "text-edit-started") {
          // Could show editing indicator in inspector
        }

        if (e.data.type === "text-edit-finished") {
          // Refresh inspector after text edit
          if (selectedElement) updateInspector();
        }

        if (e.data.type === "delete-element") {
          showToast("Delete — coming soon");
        }

        if (e.data.type === "reorder-element") {
          showToast("Reorder — coming soon");
        }

        if (e.data.type === "dom-tree") {
          domTrees[screenName] = e.data.tree;
          if (selectedCard === screenName) updateLayersTree(screenName);
          // Auto-switch to layers tab when tree arrives
          switchLeftTab("layers");
        }
      }
    });

    function showToast(msg) {
      const toast = document.getElementById("canvas-toast");
      toast.textContent = msg;
      toast.classList.remove("hidden");
      clearTimeout(toast._timer);
      toast._timer = setTimeout(() => toast.classList.add("hidden"), 2000);
    }

    // --- Polling ---
    async function pollForChanges() {
      try {
        const res = await fetch("/api/projects/" + PROJECT + "/screens");
        const data = await res.json();
        if (data.hash !== currentHash) {
          const oldScreens = new Set(screens);
          screens = data.screens.map(s => s.name);
          currentHash = data.hash;
          screens.forEach(name => {
            if (oldScreens.has(name) && cardEls[name]) {
              const iframe = cardEls[name].querySelector(".sc-iframe");
              if (iframe) iframe.src = iframe.src;
              else {
                const img = cardEls[name].querySelector(".sc-thumb");
                if (img) img.src = "/api/projects/" + PROJECT + "/screens/" + name + "/thumbnail?t=" + Date.now();
              }
              cardEls[name].classList.add("updated");
              setTimeout(() => cardEls[name].classList.remove("updated"), 1100);
            }
          });
          renderCards(screens, true);
          // Proof state can become stale when source changes — refresh classification
          if (proofLoaded) updateProofState();
        }
      } catch {}
    }

    // --- Layout Persistence ---
    function debounceSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveLayout, 1000); }

    function saveLayout() {
      const t = pz.getTransform();
      fetch("/api/projects/" + PROJECT + "/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positions, viewport: { x: t.x, y: t.y, zoom: t.scale } })
      }).catch(() => {});
    }

    // --- Toolbar ---
    function zoomIn() {
      const t = pz.getTransform();
      const next = nearestStep(t.scale, 1);
      pz.zoomAbs(window.innerWidth / 2, window.innerHeight / 2, next);
    }

    function zoomOut_() {
      const t = pz.getTransform();
      const next = nearestStep(t.scale, -1);
      pz.zoomAbs(window.innerWidth / 2, window.innerHeight / 2, next);
    }

    function zoomTo100() {
      pz.smoothZoomAbs(window.innerWidth / 2, window.innerHeight / 2, 1);
    }

    function fitAll() {
      const names = Object.keys(positions);
      if (names.length === 0) return;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      names.forEach(n => {
        const p = positions[n];
        minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x + CARD_W); maxY = Math.max(maxY, p.y + CARD_H);
      });
      const pad = 60;
      const bw = maxX - minX + pad * 2;
      const bh = maxY - minY + pad * 2;
      const vp = document.getElementById("canvas-viewport");
      const vw = vp.clientWidth;
      const vh = vp.clientHeight - 80;
      const scale = Math.min(vw / bw, vh / bh, 1.2);
      const cx = minX + (maxX - minX) / 2;
      const cy = minY + (maxY - minY) / 2;
      const tx = vw / 2 - cx * scale;
      const ty = vh / 2 + 20 - cy * scale;
      pz.smoothMoveTo(tx, ty);
      setTimeout(() => pz.smoothZoomAbs(vw / 2, vh / 2, scale), 200);
    }

    function resetLayout() {
      positions = {};
      document.getElementById("canvas-world").innerHTML = "";
      cardEls = {};
      screens.forEach((name, i) => { positions[name] = autoPosition(i); });
      renderCards(screens, false);
      setTimeout(fitAll, 100);
      debounceSave();
    }

    // --- Minimap ---
    function updateMinimap() {
      const canvas = document.getElementById("minimap-canvas");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const mw = 180, mh = 120;
      ctx.clearRect(0, 0, mw, mh);
      const names = Object.keys(positions);
      if (names.length === 0) return;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      names.forEach(n => {
        const p = positions[n];
        minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x + CARD_W); maxY = Math.max(maxY, p.y + CARD_H);
      });
      const pad = 40;
      const bw = maxX - minX + pad * 2;
      const bh = maxY - minY + pad * 2;
      const scale = Math.min(mw / bw, mh / bh);
      const ox = (mw - bw * scale) / 2 - minX * scale + pad * scale;
      const oy = (mh - bh * scale) / 2 - minY * scale + pad * scale;
      ctx.fillStyle = "#E8E4DF";
      names.forEach(n => {
        const p = positions[n];
        ctx.fillRect(ox + p.x * scale, oy + p.y * scale, CARD_W * scale, CARD_H * scale);
      });
      if (pz) {
        const t = pz.getTransform();
        const vp = document.getElementById("canvas-viewport");
        const vx = -t.x / t.scale;
        const vy = -t.y / t.scale;
        const vw = vp.clientWidth / t.scale;
        const vh = vp.clientHeight / t.scale;
        ctx.strokeStyle = "rgba(255,107,107,0.7)";
        ctx.lineWidth = 2;
        ctx.strokeRect(ox + vx * scale, oy + vy * scale, vw * scale, vh * scale);
      }
    }

    // --- Dark mode ---
    function toggleDark() {
      document.body.classList.toggle("dark");
      const isDark = document.body.classList.contains("dark");
      localStorage.setItem("studio-dark", isDark ? "1" : "0");
      document.querySelector(".dark-toggle").textContent = isDark ? "\\u2600" : "\\u263E";
    }
    if (localStorage.getItem("studio-dark") === "1") {
      document.body.classList.add("dark"); document.querySelector(".dark-toggle").textContent = "\\u2600";
    }

    // --- Timeline & Diff ---
    let checkpoints = [];
    let diffState = { hash: null, screenIdx: 0, screens: [] };

    async function loadCheckpoints() {
      try {
        const res = await fetch("/api/projects/" + PROJECT + "/checkpoints");
        const data = await res.json();
        checkpoints = data.checkpoints;
        renderTimeline(data.current);
      } catch {}
    }

    function renderTimeline(currentHash) {
      const list = document.getElementById("timeline-list");
      if (checkpoints.length === 0) { list.innerHTML = '<div class="timeline-empty">No checkpoints yet</div>'; return; }
      list.innerHTML = checkpoints.map((cp) => {
        const short = cp.hash.slice(0, 7);
        const date = new Date(cp.date).toLocaleString();
        const isCurrent = cp.isCurrent;
        const hasScreenshots = cp.screens.some(s => s.hasThumbnail);
        return '<div class="timeline-item' + (isCurrent ? ' current' : '') + '">' +
          '<div class="timeline-dot' + (isCurrent ? ' current' : '') + '"></div>' +
          '<div class="timeline-content">' +
            '<div class="timeline-msg">' + cp.message + '</div>' +
            '<div class="timeline-meta">' + short + ' &middot; ' + date + '</div>' +
            '<div class="timeline-actions">' +
              (hasScreenshots && !isCurrent ? '<button class="btn-sm" onclick="openDiff(\\'' + cp.hash + '\\')">Diff</button>' : '') +
              (!isCurrent ? '<button class="btn-sm btn-restore" onclick="restoreCheckpoint(\\'' + cp.hash + '\\', \\'' + short + '\\')">Restore</button>' : '<span class="badge-current">current</span>') +
            '</div>' +
          '</div>' +
        '</div>';
      }).join("");
    }

    function openDiff(hash) {
      const cp = checkpoints.find(c => c.hash === hash);
      if (!cp) return;
      diffState.hash = hash;
      diffState.screens = cp.screens.filter(s => s.hasThumbnail).map(s => s.name);
      if (diffState.screens.length === 0) return;
      diffState.screenIdx = 0;
      showDiffScreen();
      document.getElementById("diff-overlay").classList.remove("hidden");
      document.getElementById("diff-title").textContent = "Diff: " + hash.slice(0, 7) + " vs current";
    }

    function showDiffScreen() {
      const name = diffState.screens[diffState.screenIdx];
      document.getElementById("diff-screen-label").textContent = name + " (" + (diffState.screenIdx + 1) + "/" + diffState.screens.length + ")";
      document.getElementById("diff-left-img").src = "/api/projects/" + PROJECT + "/checkpoints/" + diffState.hash + "/screenshots/" + name;
      document.getElementById("diff-right-img").src = "/api/projects/" + PROJECT + "/screens/" + name + "/thumbnail?t=" + Date.now();
      document.getElementById("diff-left-label").textContent = diffState.hash.slice(0, 7);
      document.getElementById("diff-right-label").textContent = "current";
    }

    function prevDiffScreen() { if (diffState.screenIdx > 0) { diffState.screenIdx--; showDiffScreen(); } }
    function nextDiffScreen() { if (diffState.screenIdx < diffState.screens.length - 1) { diffState.screenIdx++; showDiffScreen(); } }
    function closeDiff() { document.getElementById("diff-overlay").classList.add("hidden"); }

    async function restoreCheckpoint(hash, label) {
      if (!confirm("Restore to checkpoint " + label + "? Current changes will be lost.")) return;
      try {
        const res = await fetch("/api/projects/" + PROJECT + "/restore", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hash }),
        });
        if (res.ok) location.reload();
        else alert("Restore failed");
      } catch { alert("Restore failed"); }
    }

    // --- Feedback Annotations ---
    let annotations = [];

    async function loadAnnotations() {
      try {
        const res = await fetch("/api/projects/" + PROJECT + "/feedback");
        const data = await res.json();
        annotations = data.feedback || [];
        renderPins();
      } catch {}
    }

    function renderPins() {
      document.querySelectorAll(".feedback-pin").forEach(p => p.remove());
      annotations.forEach(a => {
        const card = cardEls[a.screen];
        if (!card) return;
        const content = card.querySelector(".sc-frame-content");
        if (!content) return;
        content.style.position = "relative";
        const pin = document.createElement("div");
        pin.className = "feedback-pin" + (a.resolved ? " resolved" : "");
        pin.style.left = a.x + "%"; pin.style.top = a.y + "%";
        pin.dataset.id = a.id;
        pin.title = a.text + " (" + a.author + ")";
        pin.innerHTML = '<div class="pin-dot"></div><div class="pin-tooltip">' +
          '<div class="pin-text">' + a.text.replace(/</g, "&lt;") + '</div>' +
          '<div class="pin-meta">' + a.author + '</div>' +
          '<div class="pin-actions">' +
            (a.resolved ? '' : '<button onclick="resolvePin(\\'' + a.id + '\\')">Resolve</button>') +
            '<button onclick="deletePin(\\'' + a.id + '\\')">Delete</button>' +
          '</div></div>';
        pin.addEventListener("click", (e) => { e.stopPropagation(); pin.classList.toggle("open"); });
        content.appendChild(pin);
      });
    }

    document.getElementById("canvas-world").addEventListener("click", (e) => {
      if (!annotateMode) return;
      const content = e.target.closest(".sc-frame-content");
      if (!content) return;
      const card = content.closest(".screen-card");
      if (!card) return;
      if (dragStart?.moved) return;
      e.stopPropagation();
      const rect = content.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
      const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
      const text = prompt("Feedback for " + card.dataset.screen + ":");
      if (!text) return;
      addAnnotation(card.dataset.screen, parseFloat(x), parseFloat(y), text);
    });

    async function addAnnotation(screen, x, y, text) {
      try {
        const res = await fetch("/api/projects/" + PROJECT + "/feedback", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ screen, x, y, text, author: "human" }),
        });
        if (res.ok) await loadAnnotations();
      } catch {}
    }

    async function resolvePin(id) {
      try {
        await fetch("/api/projects/" + PROJECT + "/feedback/" + id, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resolved: true }),
        });
        await loadAnnotations();
      } catch {}
    }

    async function deletePin(id) {
      try {
        await fetch("/api/projects/" + PROJECT + "/feedback/" + id, { method: "DELETE" });
        await loadAnnotations();
      } catch {}
    }

    loadAnnotations();

    // --- Auto-start polling ---
    ${!running ? `(function pollStart() {
      const iv = setInterval(async () => {
        try {
          const res = await fetch("/api/projects/" + PROJECT + "/status");
          const d = await res.json();
          if (d.running) { clearInterval(iv); location.reload(); }
        } catch {}
      }, 2000);
    })();` : ""}

    // --- Start ---
    init();
  </script>
</body>
</html>`;
}
