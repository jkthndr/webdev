import { STUDIO_CSS, CANVAS_CSS } from "./styles.js";
import type { ProjectInfo } from "../project-manager.js";

export function canvasPage(project: ProjectInfo, running: boolean, hash: string): string {
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
  </div>

  <div id="minimap"><canvas id="minimap-canvas" width="180" height="120"></canvas></div>

  <div id="preview-overlay">
    <iframe id="preview-iframe" src="about:blank"></iframe>
    <div class="overlay-close" onclick="closePreview()">Press Escape or click here to close</div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/panzoom@9.4.3/dist/panzoom.min.js"></script>
  <script>
    const PROJECT = "${project.name}";
    const RUNNING = ${running};
    const CARD_W = 320;
    const CARD_H = 240;
    const GAP = 60;
    const COLS = 3;
    const OFFSET = 80;

    let screens = ${screensJson};
    let currentHash = "${hash}";
    let pz = null;
    let cardEls = {};
    let positions = {};
    let dragging = null;
    let dragStart = null;
    let saveTimer = null;

    // --- Init ---
    function init() {
      const world = document.getElementById("canvas-world");
      pz = panzoom(world, {
        maxZoom: 3,
        minZoom: 0.1,
        smoothScroll: false,
        filterKey: () => true,
        beforeMouseDown: (e) => {
          // Allow panzoom on viewport background, not on cards
          return !e.target.closest(".screen-card");
        }
      });
      pz.on("transform", () => { updateMinimap(); });

      loadLayoutThenRender();
      setInterval(pollForChanges, 3000);
      window.addEventListener("beforeunload", saveLayout);
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closePreview();
        if (e.key === "=" || e.key === "+") zoomIn();
        if (e.key === "-") zoomOut_();
        if (e.key === "0") fitAll();
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

      const thumbUrl = "/api/projects/" + PROJECT + "/screens/" + name + "/thumbnail?t=" + Date.now();
      card.innerHTML =
        '<img class="sc-thumb" src="' + thumbUrl + '" alt="' + name + '" onerror="this.outerHTML=\\'<div class=sc-thumb-empty>Loading...</div>\\'"/>' +
        '<div class="sc-label">' +
          '<span>' + name + '</span>' +
          (animate ? '<span class="sc-new">NEW</span>' : '<span class="sc-hash">' + currentHash.slice(0,7) + '</span>') +
        '</div>';

      // Click thumbnail → preview overlay
      card.querySelector(".sc-thumb, .sc-thumb-empty")?.addEventListener("click", (e) => {
        if (dragging) return;
        openPreview(name);
      });

      // Drag on label
      const label = card.querySelector(".sc-label");
      label.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        dragging = name;
        dragStart = { x: e.clientX, y: e.clientY, ox: pos.x, oy: pos.y };
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
        const card = cardEls[dragging];
        if (card) {
          card.style.zIndex = "";
          card.style.cursor = "";
        }
        dragging = null;
        dragStart = null;
        debounceSave();
      }
    });

    function autoPosition(index) {
      const col = index % COLS;
      const row = Math.floor(index / COLS);
      return { x: OFFSET + col * (CARD_W + GAP), y: OFFSET + row * (CARD_H + GAP) };
    }

    // --- Preview Overlay ---
    function openPreview(name) {
      if (!RUNNING) {
        window.location.href = "/studio/" + PROJECT + "/" + name;
        return;
      }
      const overlay = document.getElementById("preview-overlay");
      const iframe = document.getElementById("preview-iframe");
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

          // Refresh existing thumbnails
          screens.forEach(name => {
            if (oldScreens.has(name) && cardEls[name]) {
              const img = cardEls[name].querySelector(".sc-thumb");
              if (img) {
                img.src = "/api/projects/" + PROJECT + "/screens/" + name + "/thumbnail?t=" + Date.now();
                cardEls[name].classList.add("updated");
                setTimeout(() => cardEls[name].classList.remove("updated"), 1100);
              }
              // Update hash display
              const hashEl = cardEls[name].querySelector(".sc-hash");
              if (hashEl) hashEl.textContent = currentHash.slice(0,7);
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
      const vw = window.innerWidth;
      const vh = window.innerHeight - 48;
      const scale = Math.min(vw / bw, vh / bh, 1.5);
      const cx = minX + (maxX - minX) / 2;
      const cy = minY + (maxY - minY) / 2;
      const tx = vw / 2 - cx * scale;
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

    // --- Start ---
    init();
  </script>
</body>
</html>`;
}
