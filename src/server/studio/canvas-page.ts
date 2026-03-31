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

  <div id="canvas-viewport">
    <div id="canvas-world"></div>
  </div>

  <div class="canvas-toolbar">
    <button onclick="zoomIn()" title="Zoom In">+</button>
    <button onclick="zoomOut_()" title="Zoom Out">&minus;</button>
    <div class="sep"></div>
    <button onclick="fitAll()" title="Fit All">Fit All</button>
    <button onclick="resetLayout()" title="Reset Layout">Reset</button>
    <div class="sep"></div>
    <button onclick="toggleTimeline()" title="Checkpoint History" id="btn-timeline">History</button>
    <button onclick="toggleAnnotate()" title="Add Feedback" id="btn-annotate">Annotate</button>
  </div>

  <div id="minimap"><canvas id="minimap-canvas" width="180" height="120"></canvas></div>

  <!-- Timeline panel -->
  <div id="timeline-panel" class="timeline-panel hidden">
    <div class="timeline-header">
      <span>Checkpoint History</span>
      <button class="timeline-close" onclick="toggleTimeline()">&times;</button>
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

  <div id="preview-overlay">
    <iframe id="preview-iframe" src="about:blank"></iframe>
    <div class="overlay-close" onclick="closePreview()">Press Escape or click here to close</div>
  </div>

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

    // --- Init ---
    function init() {
      const world = document.getElementById("canvas-world");
      const viewport = document.getElementById("canvas-viewport");

      pz = panzoom(world, {
        maxZoom: 3,
        minZoom: 0.1,
        smoothScroll: true,
        zoomSpeed: 0.065,
        filterKey: () => true,
        beforeMouseDown: (e) => {
          if (spaceDown) return true;
          return !e.target.closest(".screen-card");
        },
        beforeWheel: () => true,
        zoomDoubleClickSpeed: 1,
      });
      pz.on("transform", () => { updateMinimap(); });

      // Middle mouse button pan
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
          const dx = e.clientX - panStart.x;
          const dy = e.clientY - panStart.y;
          pz.moveTo(t.x + dx, t.y + dy);
          panStart = { x: e.clientX, y: e.clientY };
        }
      });
      document.addEventListener("mouseup", (e) => {
        if (e.button === 1) {
          middleDown = false;
          panStart = null;
          viewport.style.cursor = "";
        }
      });

      // Prevent middle-click scroll behavior
      viewport.addEventListener("auxclick", (e) => { if (e.button === 1) e.preventDefault(); });

      // Space + drag to pan (Pencil-style)
      document.addEventListener("keydown", (e) => {
        if (e.code === "Space" && !e.repeat && !document.getElementById("preview-overlay").classList.contains("visible")) {
          spaceDown = true;
          viewport.style.cursor = "grab";
          e.preventDefault();
        }
      });
      document.addEventListener("keyup", (e) => {
        if (e.code === "Space") {
          spaceDown = false;
          viewport.style.cursor = "";
        }
      });

      loadLayoutThenRender();
      setInterval(pollForChanges, 3000);
      window.addEventListener("beforeunload", saveLayout);

      // Keyboard shortcuts (Pencil-style)
      document.addEventListener("keydown", (e) => {
        // Don't trigger shortcuts when overlay is open (except Escape)
        const overlayOpen = document.getElementById("preview-overlay").classList.contains("visible");

        if (e.key === "Escape") { closePreview(); return; }
        if (overlayOpen) return;

        // Zoom
        if ((e.metaKey || e.ctrlKey) && (e.key === "=" || e.key === "+")) { e.preventDefault(); zoomIn(); }
        if ((e.metaKey || e.ctrlKey) && e.key === "-") { e.preventDefault(); zoomOut_(); }
        if (e.key === "+" || e.key === "=") zoomIn();
        if (e.key === "-") zoomOut_();

        // Fit all (1 key, like Pencil)
        if (e.key === "1") fitAll();
        // Zoom to 100% (0 key, like Pencil)
        if (e.key === "0") zoomTo100();

        // Select all (Ctrl/Cmd + A)
        if ((e.metaKey || e.ctrlKey) && e.key === "a") {
          e.preventDefault();
          Object.values(cardEls).forEach(c => c.classList.add("focused"));
        }
      });
    }

    async function loadLayoutThenRender() {
      try {
        const res = await fetch("/api/projects/" + PROJECT + "/layout");
        const data = await res.json();
        if (data.positions && Object.keys(data.positions).length > 0) {
          positions = data.positions;
        }
      } catch {}
      renderCards(screens, false);
      setTimeout(fitAll, 100);
    }

    // --- Card Rendering ---
    function renderCards(screenList, animate) {
      const world = document.getElementById("canvas-world");
      const existing = new Set(Object.keys(cardEls));
      const current = new Set(screenList);

      // Add new cards
      screenList.forEach((name, i) => {
        if (!cardEls[name]) {
          if (!positions[name]) {
            positions[name] = autoPosition(Object.keys(positions).length);
          }
          const card = createCard(name, positions[name], animate);
          world.appendChild(card);
          cardEls[name] = card;
        }
      });

      // Remove deleted cards
      existing.forEach(name => {
        if (!current.has(name)) {
          cardEls[name].style.opacity = "0";
          cardEls[name].style.transition = "opacity 0.3s";
          setTimeout(() => {
            cardEls[name].remove();
            delete cardEls[name];
            delete positions[name];
          }, 300);
        }
      });

      updateMinimap();
    }

    function createCard(name, pos, animate) {
      const card = document.createElement("div");
      card.className = "screen-card" + (animate ? " entering" : "");
      card.dataset.screen = name;
      card.style.left = pos.x + "px";
      card.style.top = pos.y + "px";

      const proxyUrl = "/proxy/" + PROJECT + "/screens/" + name;
      const newBadge = animate ? '<span class="sc-new-badge">NEW</span>' : '';
      const SCALE = CARD_W / 1280;
      const IFRAME_H = 1200;
      if (RUNNING) {
        card.innerHTML =
          '<div class="sc-frame-label">' + name + newBadge + '</div>' +
          '<div class="sc-frame-content">' +
            '<div class="sc-iframe-wrap" style="height:' + Math.ceil(IFRAME_H * SCALE) + 'px">' +
              '<iframe class="sc-iframe" src="' + proxyUrl + '" style="height:' + IFRAME_H + 'px;transform:scale(' + SCALE + ')" loading="lazy"></iframe>' +
            '</div>' +
          '</div>';
      } else {
        const thumbUrl = "/api/projects/" + PROJECT + "/screens/" + name + "/thumbnail?t=" + Date.now();
        card.innerHTML =
          '<div class="sc-frame-label">' + name + '</div>' +
          '<div class="sc-frame-content">' +
            '<img class="sc-thumb" src="' + thumbUrl + '" alt="' + name + '" onerror="this.outerHTML=\\'<div class=sc-thumb-empty>Not running</div>\\'"/>' +
          '</div>';
      }

      // Click → preview overlay (only if not dragging or panning)
      card.addEventListener("click", (e) => {
        if (spaceDown || dragStart?.moved) return;
        openPreview(name);
      });

      // Drag card by holding mousedown and moving
      card.addEventListener("mousedown", (e) => {
        if (e.button !== 0 || spaceDown) return;
        e.stopPropagation();
        dragging = name;
        dragStart = { x: e.clientX, y: e.clientY, ox: pos.x, oy: pos.y, moved: false };
        card.style.zIndex = "10";
        card.style.cursor = "grabbing";
      });

      if (animate) {
        setTimeout(() => card.classList.remove("entering"), 500);
      }

      return card;
    }

    // Global drag handlers
    document.addEventListener("mousemove", (e) => {
      if (!dragging || !dragStart) return;
      const t = pz.getTransform();
      const dx = (e.clientX - dragStart.x) / t.scale;
      const dy = (e.clientY - dragStart.y) / t.scale;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragStart.moved = true;
      const nx = dragStart.ox + dx;
      const ny = dragStart.oy + dy;
      positions[dragging] = { x: nx, y: ny };
      const card = cardEls[dragging];
      if (card) {
        card.style.left = nx + "px";
        card.style.top = ny + "px";
      }
      updateMinimap();
    });

    document.addEventListener("mouseup", () => {
      if (dragging) {
        const wasDrag = dragStart?.moved;
        const card = cardEls[dragging];
        if (card) {
          card.style.zIndex = "";
          card.style.cursor = "";
        }
        const screenName = dragging;
        dragging = null;
        dragStart = null;
        if (wasDrag) debounceSave();
      }
    });

    function autoPosition(index) {
      const col = index % COLS;
      const row = Math.floor(index / COLS);
      return { x: OFFSET + col * (CARD_W + GAP), y: OFFSET + row * (CARD_H + GAP) };
    }

    // --- Preview Overlay ---
    async function openPreview(name) {
      const overlay = document.getElementById("preview-overlay");
      const iframe = document.getElementById("preview-iframe");
      // Always load through proxy — it auto-starts and shows a "starting" page if needed
      iframe.src = "/proxy/" + PROJECT + "/screens/" + name;
      overlay.classList.add("visible");

      // Focus the card
      Object.values(cardEls).forEach(c => c.classList.remove("focused"));
      if (cardEls[name]) cardEls[name].classList.add("focused");
    }

    function closePreview() {
      const overlay = document.getElementById("preview-overlay");
      if (!overlay.classList.contains("visible")) return;
      overlay.classList.remove("visible");
      document.getElementById("preview-iframe").src = "about:blank";
      Object.values(cardEls).forEach(c => c.classList.remove("focused"));
    }

    // Click backdrop to close
    document.getElementById("preview-overlay")?.addEventListener("click", (e) => {
      if (e.target === document.getElementById("preview-overlay")) closePreview();
    });

    // --- Polling ---
    async function pollForChanges() {
      try {
        const res = await fetch("/api/projects/" + PROJECT + "/screens");
        const data = await res.json();
        if (data.hash !== currentHash) {
          const oldScreens = new Set(screens);
          screens = data.screens.map(s => s.name);
          currentHash = data.hash;

          // Refresh existing screens
          screens.forEach(name => {
            if (oldScreens.has(name) && cardEls[name]) {
              // Reload iframe or thumbnail
              const iframe = cardEls[name].querySelector(".sc-iframe");
              if (iframe) {
                iframe.src = iframe.src;
              } else {
                const img = cardEls[name].querySelector(".sc-thumb");
                if (img) img.src = "/api/projects/" + PROJECT + "/screens/" + name + "/thumbnail?t=" + Date.now();
              }
              cardEls[name].classList.add("updated");
              setTimeout(() => cardEls[name].classList.remove("updated"), 1100);
            }
          });

          // Add new / remove old
          renderCards(screens, true);
        }
      } catch {}
    }

    // --- Layout Persistence ---
    function debounceSave() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveLayout, 1000);
    }

    function saveLayout() {
      const t = pz.getTransform();
      fetch("/api/projects/" + PROJECT + "/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          positions: positions,
          viewport: { x: t.x, y: t.y, zoom: t.scale },
        })
      }).catch(() => {});
    }

    // --- Toolbar ---
    function zoomIn() {
      const t = pz.getTransform();
      pz.smoothZoomAbs(window.innerWidth / 2, window.innerHeight / 2, t.scale * 1.3);
    }

    function zoomOut_() {
      const t = pz.getTransform();
      pz.smoothZoomAbs(window.innerWidth / 2, window.innerHeight / 2, t.scale / 1.3);
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
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x + CARD_W > maxX) maxX = p.x + CARD_W;
        if (p.y + CARD_H > maxY) maxY = p.y + CARD_H;
      });
      const pad = 60;
      const bw = maxX - minX + pad * 2;
      const bh = maxY - minY + pad * 2;
      // Reserve space: 48px header, 200px right for minimap, 160px bottom for toolbar+minimap
      const vw = window.innerWidth - 200;
      const vh = window.innerHeight - 48 - 160;
      const scale = Math.min(vw / bw, vh / bh, 1.2);
      const cx = minX + (maxX - minX) / 2;
      const cy = minY + (maxY - minY) / 2;
      // Offset slightly left to avoid minimap area
      const tx = (vw / 2) - cx * scale;
      const ty = (vh / 2 + 48) - cy * scale;
      pz.smoothMoveTo(tx, ty);
      setTimeout(() => pz.smoothZoomAbs(vw / 2, vh / 2 + 24, scale), 200);
    }

    function resetLayout() {
      positions = {};
      const world = document.getElementById("canvas-world");
      world.innerHTML = "";
      cardEls = {};
      screens.forEach((name, i) => {
        positions[name] = autoPosition(i);
      });
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
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x + CARD_W);
        maxY = Math.max(maxY, p.y + CARD_H);
      });

      const pad = 40;
      const bw = maxX - minX + pad * 2;
      const bh = maxY - minY + pad * 2;
      const scale = Math.min(mw / bw, mh / bh);
      const ox = (mw - bw * scale) / 2 - minX * scale + pad * scale;
      const oy = (mh - bh * scale) / 2 - minY * scale + pad * scale;

      // Draw cards
      ctx.fillStyle = "#E8E4DF";
      names.forEach(n => {
        const p = positions[n];
        ctx.fillRect(ox + p.x * scale, oy + p.y * scale, CARD_W * scale, CARD_H * scale);
      });

      // Draw viewport
      if (pz) {
        const t = pz.getTransform();
        const vx = (-t.x / t.scale);
        const vy = ((-t.y + 48) / t.scale);
        const vw = window.innerWidth / t.scale;
        const vh = (window.innerHeight - 48) / t.scale;
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
      document.body.classList.add("dark");
      document.querySelector(".dark-toggle").textContent = "\\u2600";
    }

    // --- Timeline & Diff ---
    let timelineOpen = false;
    let checkpoints = [];
    let diffState = { hash: null, screenIdx: 0, screens: [] };

    function toggleTimeline() {
      timelineOpen = !timelineOpen;
      const panel = document.getElementById("timeline-panel");
      panel.classList.toggle("hidden", !timelineOpen);
      document.getElementById("btn-timeline").classList.toggle("active", timelineOpen);
      if (timelineOpen) loadCheckpoints();
    }

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
      if (checkpoints.length === 0) {
        list.innerHTML = '<div class="timeline-empty">No checkpoints yet</div>';
        return;
      }
      list.innerHTML = checkpoints.map((cp, i) => {
        const short = cp.hash.slice(0, 7);
        const date = new Date(cp.date).toLocaleString();
        const isCurrent = cp.isCurrent;
        const hasScreenshots = cp.screens.some(s => s.hasThumbnail);
        return '<div class="timeline-item' + (isCurrent ? ' current' : '') + '" data-hash="' + cp.hash + '">' +
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

    function prevDiffScreen() {
      if (diffState.screenIdx > 0) { diffState.screenIdx--; showDiffScreen(); }
    }
    function nextDiffScreen() {
      if (diffState.screenIdx < diffState.screens.length - 1) { diffState.screenIdx++; showDiffScreen(); }
    }

    function closeDiff() {
      document.getElementById("diff-overlay").classList.add("hidden");
    }

    async function restoreCheckpoint(hash, label) {
      if (!confirm("Restore to checkpoint " + label + "? Current changes will be lost.")) return;
      try {
        const res = await fetch("/api/projects/" + PROJECT + "/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hash }),
        });
        if (res.ok) location.reload();
        else alert("Restore failed");
      } catch { alert("Restore failed"); }
    }

    // --- Feedback Annotations ---
    let annotateMode = false;
    let annotations = [];

    function toggleAnnotate() {
      annotateMode = !annotateMode;
      document.getElementById("btn-annotate").classList.toggle("active", annotateMode);
      document.getElementById("canvas-viewport").classList.toggle("annotate-mode", annotateMode);
      if (annotateMode) loadAnnotations();
    }

    async function loadAnnotations() {
      try {
        const res = await fetch("/api/projects/" + PROJECT + "/feedback");
        const data = await res.json();
        annotations = data.feedback || [];
        renderPins();
      } catch {}
    }

    function renderPins() {
      // Remove old pins
      document.querySelectorAll(".feedback-pin").forEach(p => p.remove());
      // Add pins to their cards
      annotations.forEach(a => {
        const card = cardEls[a.screen];
        if (!card) return;
        const content = card.querySelector(".sc-frame-content");
        if (!content) return;
        content.style.position = "relative";
        const pin = document.createElement("div");
        pin.className = "feedback-pin" + (a.resolved ? " resolved" : "");
        pin.style.left = a.x + "%";
        pin.style.top = a.y + "%";
        pin.dataset.id = a.id;
        pin.title = a.text + " (" + a.author + ")";
        pin.innerHTML = '<div class="pin-dot"></div><div class="pin-tooltip">' +
          '<div class="pin-text">' + a.text.replace(/</g, "&lt;") + '</div>' +
          '<div class="pin-meta">' + a.author + '</div>' +
          '<div class="pin-actions">' +
            (a.resolved ? '' : '<button onclick="resolvePin(\\'' + a.id + '\\')">Resolve</button>') +
            '<button onclick="deletePin(\\'' + a.id + '\\')">Delete</button>' +
          '</div>' +
        '</div>';
        pin.addEventListener("click", (e) => { e.stopPropagation(); pin.classList.toggle("open"); });
        content.appendChild(pin);
      });
    }

    // Click on card content to add pin (in annotate mode)
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
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ screen, x, y, text, author: "human" }),
        });
        if (res.ok) { await loadAnnotations(); }
      } catch {}
    }

    async function resolvePin(id) {
      try {
        await fetch("/api/projects/" + PROJECT + "/feedback/" + id, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
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

    // Load annotations on init
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
