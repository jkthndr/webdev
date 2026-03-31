export const STUDIO_CSS = `
  :root {
    --s-coral: #FF6B6B;
    --s-orange: #E8773A;
    --s-gold: #F5C542;
    --s-sage: #7c9070;
    --s-bg: #FAF8F5;
    --s-card: #FFFFFF;
    --s-border: #E8E4DF;
    --s-text: #2D2A26;
    --s-muted: #6B6560;
    --s-secondary: #F5F0EB;
    --s-radius: 0.75rem;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Geist Sans', system-ui, -apple-system, sans-serif;
    background: var(--s-bg);
    color: var(--s-text);
    line-height: 1.5;
  }

  a { color: inherit; text-decoration: none; }

  .studio-header {
    background: var(--s-coral);
    color: white;
    padding: 0.75rem 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .studio-header a { color: white; opacity: 0.85; }
  .studio-header a:hover { opacity: 1; }
  .studio-header .sep { opacity: 0.5; }
  .studio-header .current { opacity: 1; font-weight: 600; }

  .studio-main {
    max-width: 1280px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }

  .studio-main.full-width {
    max-width: none;
    padding: 0;
  }

  .page-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  .page-subtitle {
    color: var(--s-muted);
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
  }

  /* Project / screen cards */
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 1.5rem;
  }

  .card {
    background: var(--s-card);
    border: 1px solid var(--s-border);
    border-radius: var(--s-radius);
    overflow: hidden;
    transition: box-shadow 0.15s ease, transform 0.15s ease;
    cursor: pointer;
  }

  .card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }

  .card-thumb {
    width: 100%;
    aspect-ratio: 16/9;
    object-fit: cover;
    object-position: top left;
    background: var(--s-secondary);
    display: block;
  }

  .card-thumb-empty {
    width: 100%;
    aspect-ratio: 16/9;
    background: var(--s-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--s-muted);
    font-size: 0.875rem;
  }

  .card-body {
    padding: 1rem 1.25rem;
  }

  .card-title {
    font-weight: 600;
    font-size: 1.0625rem;
    margin-bottom: 0.25rem;
  }

  .card-meta {
    color: var(--s-muted);
    font-size: 0.875rem;
  }

  /* Split pane layout */
  .split-pane {
    display: grid;
    grid-template-columns: 1fr 1fr;
    height: calc(100vh - 48px);
  }

  .pane {
    position: relative;
    overflow: hidden;
    border-right: 1px solid var(--s-border);
  }

  .pane:last-child { border-right: none; }

  .pane-label {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    background: var(--s-text);
    color: white;
    font-size: 0.6875rem;
    font-weight: 600;
    padding: 0.25rem 0.625rem;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    z-index: 10;
    opacity: 0.85;
  }

  .pane iframe {
    width: 100%;
    height: 100%;
    border: none;
  }

  .pane img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: top left;
    background: var(--s-secondary);
  }

  .pane-code {
    width: 100%;
    height: 100%;
    overflow: auto;
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 1rem;
    font-family: 'Geist Mono', 'Fira Code', monospace;
    font-size: 0.8125rem;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* Header actions */
  .header-actions {
    margin-left: auto;
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .btn {
    padding: 0.375rem 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.8125rem;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: background 0.15s;
    font-family: inherit;
  }

  .btn-ghost {
    background: rgba(255,255,255,0.2);
    color: white;
  }
  .btn-ghost:hover { background: rgba(255,255,255,0.3); }
  .btn-ghost.active { background: rgba(255,255,255,0.35); }

  /* Status indicators */
  .status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 0.375rem;
  }

  .status-dot.running { background: var(--s-sage); }
  .status-dot.stopped { background: var(--s-muted); }

  /* Empty states */
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--s-muted);
  }

  .empty-state h2 {
    font-size: 1.125rem;
    margin-bottom: 0.5rem;
    color: var(--s-text);
  }
`;

export const CANVAS_CSS = `
  #canvas-viewport {
    width: 100%; height: calc(100vh - 48px);
    overflow: hidden; position: relative;
    background: var(--s-bg);
    background-image: radial-gradient(circle, var(--s-border) 1px, transparent 1px);
    background-size: 24px 24px;
  }

  #canvas-world {
    position: absolute; top: 0; left: 0;
    transform-origin: 0 0;
    will-change: transform;
  }

  .screen-card {
    position: absolute;
    width: 320px;
    background: var(--s-card);
    border: 2px solid var(--s-border);
    border-radius: var(--s-radius);
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    overflow: hidden;
    user-select: none;
  }

  .screen-card:hover {
    box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  }

  .screen-card.focused {
    border-color: var(--s-coral);
    box-shadow: 0 0 0 3px rgba(255,107,107,0.25);
  }

  .screen-card.entering {
    animation: fadeSlideIn 0.4s ease-out;
  }

  .screen-card.updated {
    animation: flashGold 1s ease-out;
  }

  .screen-card .sc-thumb {
    width: 100%;
    aspect-ratio: 16/10;
    object-fit: cover;
    object-position: top left;
    background: var(--s-secondary);
    display: block;
    cursor: grab;
  }

  .screen-card .sc-thumb-empty {
    width: 100%;
    aspect-ratio: 16/10;
    background: var(--s-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--s-muted);
    font-size: 0.8125rem;
    cursor: grab;
  }

  .screen-card .sc-label {
    padding: 0.5rem 0.75rem;
    font-weight: 600;
    font-size: 0.8125rem;
    border-top: 1px solid var(--s-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: grab;
  }

  .screen-card .sc-label .sc-hash {
    font-family: 'Geist Mono', monospace;
    font-size: 0.625rem;
    color: var(--s-muted);
    font-weight: 400;
  }

  .screen-card .sc-label .sc-new {
    font-size: 0.625rem;
    font-weight: 600;
    color: var(--s-coral);
    text-transform: uppercase;
  }

  @keyframes fadeSlideIn {
    from { opacity: 0; transform: scale(0.92) translateY(12px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  @keyframes flashGold {
    0%   { border-color: var(--s-gold); box-shadow: 0 0 0 4px rgba(245,197,66,0.35); }
    100% { border-color: var(--s-border); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
  }

  /* Preview overlay */
  #preview-overlay {
    position: fixed; inset: 0; z-index: 100;
    background: rgba(45,42,38,0.6);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 0.75rem;
    opacity: 0; pointer-events: none;
    transition: opacity 0.25s ease;
  }

  #preview-overlay.visible {
    opacity: 1; pointer-events: auto;
  }

  #preview-overlay iframe {
    width: 90vw; height: 85vh;
    border: none;
    border-radius: var(--s-radius);
    box-shadow: 0 8px 40px rgba(0,0,0,0.3);
    background: white;
  }

  #preview-overlay .overlay-close {
    color: rgba(255,255,255,0.7);
    font-size: 0.8125rem;
    cursor: pointer;
  }

  #preview-overlay .overlay-close:hover {
    color: white;
  }

  /* Minimap */
  #minimap {
    position: fixed;
    bottom: 1rem; right: 1rem;
    width: 180px; height: 120px;
    background: var(--s-card);
    border: 1px solid var(--s-border);
    border-radius: var(--s-radius);
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0,0,0,0.1);
    z-index: 50;
  }

  #minimap canvas {
    width: 100%; height: 100%;
  }

  /* Canvas toolbar */
  .canvas-toolbar {
    position: fixed;
    bottom: 1rem; left: 50%;
    transform: translateX(-50%);
    background: var(--s-card);
    border: 1px solid var(--s-border);
    border-radius: var(--s-radius);
    padding: 0.375rem;
    display: flex; gap: 0.25rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.1);
    z-index: 50;
  }

  .canvas-toolbar button {
    padding: 0.375rem 0.625rem;
    border: none;
    border-radius: 0.375rem;
    background: transparent;
    color: var(--s-text);
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
  }

  .canvas-toolbar button:hover {
    background: var(--s-secondary);
  }

  .canvas-toolbar .sep {
    width: 1px;
    background: var(--s-border);
    margin: 0.25rem 0;
  }
`;
