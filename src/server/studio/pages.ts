import { STUDIO_CSS } from "./styles.js";
import type { ProjectInfo } from "../project-manager.js";

function layout(title: string, breadcrumbs: { label: string; href?: string }[], body: string, opts?: { fullWidth?: boolean; headerExtra?: string }): string {
  const crumbs = breadcrumbs.map((b, i) => {
    const isLast = i === breadcrumbs.length - 1;
    if (isLast) return `<span class="current">${b.label}</span>`;
    return `<a href="${b.href}">${b.label}</a><span class="sep">/</span>`;
  }).join(" ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — webdev studio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${STUDIO_CSS}</style>
</head>
<body>
  <header class="studio-header">
    ${crumbs}
    ${opts?.headerExtra || ""}
  </header>
  <main class="studio-main${opts?.fullWidth ? " full-width" : ""}">
    ${body}
  </main>
</body>
</html>`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function galleryPage(projects: ProjectInfo[]): string {
  const cards = projects.map((p) => {
    const screenCount = p.screens.length;
    const firstScreen = p.screens[0];
    const thumbUrl = firstScreen ? `/api/projects/${p.name}/screens/${firstScreen}/thumbnail` : "";

    return `
      <a href="/studio/${p.name}" class="card">
        ${thumbUrl
          ? `<img class="card-thumb" src="${thumbUrl}" alt="${p.name}" loading="lazy">`
          : `<div class="card-thumb-empty">No screens</div>`
        }
        <div class="card-body">
          <div class="card-title">${p.name}</div>
          <div class="card-meta">${screenCount} screen${screenCount !== 1 ? "s" : ""} &middot; ${timeAgo(p.createdAt)}</div>
        </div>
      </a>`;
  }).join("");

  const body = projects.length === 0
    ? `<div class="empty-state">
        <h2>No projects yet</h2>
        <p>Use <code>open_project</code> from Claude Code to create one.</p>
      </div>`
    : `<div class="card-grid">${cards}</div>`;

  return layout("Projects", [{ label: "studio" }], `
    <h1 class="page-title">Projects</h1>
    <p class="page-subtitle">${projects.length} project${projects.length !== 1 ? "s" : ""}</p>
    ${body}
  `);
}

export function projectPage(project: ProjectInfo, running: boolean): string {
  const cards = project.screens.map((s) => {
    const thumbUrl = `/api/projects/${project.name}/screens/${s}/thumbnail`;
    return `
      <a href="/studio/${project.name}/${s}" class="card">
        <img class="card-thumb" src="${thumbUrl}" alt="${s}" loading="lazy">
        <div class="card-body">
          <div class="card-title">${s}</div>
          <div class="card-meta">/screens/${s}</div>
        </div>
      </a>`;
  }).join("");

  const body = project.screens.length === 0
    ? `<div class="empty-state">
        <h2>No screens yet</h2>
        <p>Use <code>create_screen</code> to add one.</p>
      </div>`
    : `<div class="card-grid">${cards}</div>`;

  const statusDot = running ? "running" : "stopped";
  const statusLabel = running ? "Preview running" : "Not running";

  const headerExtra = `
    <div class="header-actions">
      <a href="/studio/${project.name}/canvas" class="btn btn-ghost">Canvas View</a>
    </div>`;

  return layout(project.name, [
    { label: "studio", href: "/studio" },
    { label: project.name },
  ], `
    <h1 class="page-title">${project.name}</h1>
    <p class="page-subtitle">
      <span class="status-dot ${statusDot}"></span>${statusLabel}
      &middot; ${project.screens.length} screen${project.screens.length !== 1 ? "s" : ""}
    </p>
    ${body}
  `, { headerExtra });
}

export function screenPage(project: ProjectInfo, screen: string, hash: string, running: boolean): string {
  const proxyUrl = `/proxy/${project.name}/screens/${screen}`;
  const thumbUrl = `/api/projects/${project.name}/screens/${screen}/thumbnail?t=${Date.now()}`;
  const codeUrl = `/api/projects/${project.name}/screens/${screen}/code`;
  const hashUrl = `/api/projects/${project.name}/hash`;

  const headerExtra = `
    <div class="header-actions">
      <button class="btn btn-ghost" id="btn-preview" onclick="showPane('preview')">Live</button>
      <button class="btn btn-ghost active" id="btn-split" onclick="showPane('split')">Split</button>
      <button class="btn btn-ghost" id="btn-code" onclick="showPane('code')">Code</button>
      <button class="btn btn-ghost" onclick="refresh()">Refresh</button>
    </div>`;

  const body = `
    <div class="split-pane" id="split-container">
      <div class="pane" id="pane-left">
        <div class="pane-label">${running ? "Live Preview" : "Preview unavailable"}</div>
        ${running
          ? `<iframe id="preview-iframe" src="${proxyUrl}"></iframe>`
          : `<div class="card-thumb-empty" style="width:100%;height:100%">Preview server not running</div>`
        }
      </div>
      <div class="pane" id="pane-right">
        <div class="pane-label" id="right-label">Screenshot</div>
        <img id="screenshot-img" src="${thumbUrl}" alt="Screenshot">
        <div class="pane-code" id="code-panel" style="display:none"></div>
      </div>
    </div>

    <script>
      let currentHash = "${hash}";
      let codeLoaded = false;
      let currentMode = "split";

      function showPane(mode) {
        currentMode = mode;
        const left = document.getElementById("pane-left");
        const right = document.getElementById("pane-right");
        const container = document.getElementById("split-container");
        const img = document.getElementById("screenshot-img");
        const code = document.getElementById("code-panel");
        const label = document.getElementById("right-label");

        // Reset buttons
        document.querySelectorAll(".header-actions .btn").forEach(b => b.classList.remove("active"));
        document.getElementById("btn-" + mode)?.classList.add("active");

        if (mode === "preview") {
          container.style.gridTemplateColumns = "1fr";
          left.style.display = "";
          right.style.display = "none";
        } else if (mode === "split") {
          container.style.gridTemplateColumns = "1fr 1fr";
          left.style.display = "";
          right.style.display = "";
          img.style.display = "";
          code.style.display = "none";
          label.textContent = "Screenshot";
        } else if (mode === "code") {
          container.style.gridTemplateColumns = "1fr 1fr";
          left.style.display = "";
          right.style.display = "";
          img.style.display = "none";
          code.style.display = "";
          label.textContent = "Code";
          if (!codeLoaded) loadCode();
        }
      }

      async function loadCode() {
        try {
          const res = await fetch("${codeUrl}");
          const data = await res.json();
          document.getElementById("code-panel").textContent = data.code;
          codeLoaded = true;
        } catch (e) {
          document.getElementById("code-panel").textContent = "Failed to load code";
        }
      }

      function refresh() {
        const iframe = document.getElementById("preview-iframe");
        if (iframe) iframe.src = iframe.src;
        document.getElementById("screenshot-img").src = "${thumbUrl.split("?")[0]}?t=" + Date.now();
        codeLoaded = false;
        if (currentMode === "code") loadCode();
      }

      // Poll for changes
      setInterval(async () => {
        try {
          const res = await fetch("${hashUrl}");
          const data = await res.json();
          if (data.hash && data.hash !== currentHash) {
            currentHash = data.hash;
            refresh();
          }
        } catch {}
      }, 3000);
    </script>`;

  return layout(`${screen} — ${project.name}`, [
    { label: "studio", href: "/studio" },
    { label: project.name, href: `/studio/${project.name}` },
    { label: screen },
  ], body, { fullWidth: true, headerExtra });
}
