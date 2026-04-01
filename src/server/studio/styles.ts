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
  .status-dot.starting { background: var(--s-gold); animation: pulse 1.2s ease-in-out infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

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

  /* Dark mode */
  body.dark {
    --s-bg: #1a1917;
    --s-card: #262523;
    --s-border: #3a3835;
    --s-text: #e8e4df;
    --s-muted: #9b9590;
    --s-secondary: #2e2c29;
  }

  .dark-toggle {
    background: none;
    border: none;
    color: white;
    font-size: 1.125rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    opacity: 0.8;
    line-height: 1;
  }
  .dark-toggle:hover { opacity: 1; }
`;

export const CANVAS_CSS = `
  #canvas-viewport {
    width: 100%; height: calc(100vh - 48px);
    overflow: hidden; position: relative;
    background: #1a1917;
    background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 24px 24px;
  }

  #canvas-world {
    position: absolute; top: 0; left: 0;
    transform-origin: 0 0;
    will-change: transform;
    -webkit-font-smoothing: subpixel-antialiased;
    text-rendering: optimizeLegibility;
  }

  .screen-card {
    position: absolute;
    width: 420px;
    user-select: none;
    transform: translateZ(0);
    backface-visibility: hidden;
    -webkit-font-smoothing: subpixel-antialiased;
  }

  .screen-card .sc-iframe-wrap {
    image-rendering: -webkit-optimize-contrast;
  }

  .screen-card .sc-frame-label {
    color: rgba(255,255,255,0.55);
    font-size: 0.75rem;
    font-weight: 500;
    padding-bottom: 0.5rem;
    cursor: grab;
    white-space: nowrap;
  }

  .screen-card:hover .sc-frame-label { color: rgba(255,255,255,0.8); }
  .screen-card.focused .sc-frame-label { color: var(--s-coral); }

  .screen-card.entering { animation: fadeSlideIn 0.4s ease-out; }

  .screen-card.updated .sc-frame-content {
    animation: flashGold 1s ease-out;
  }

  .screen-card .sc-frame-content {
    background: white;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 2px 16px rgba(0,0,0,0.35);
  }

  .screen-card:hover .sc-frame-content {
    border-color: rgba(255,255,255,0.15);
    box-shadow: 0 4px 28px rgba(0,0,0,0.45);
  }

  .screen-card.focused .sc-frame-content {
    outline: 2px solid var(--s-coral);
    outline-offset: 3px;
  }

  .screen-card .sc-iframe-wrap {
    width: 100%;
    overflow: hidden;
    position: relative;
  }

  .screen-card .sc-iframe {
    position: absolute;
    top: 0; left: 0;
    border: none;
    pointer-events: none;
  }

  .screen-card .sc-thumb {
    width: 100%;
    object-fit: cover;
    object-position: top left;
    display: block;
  }

  .screen-card .sc-thumb-empty {
    width: 100%;
    min-height: 200px;
    background: #2a2826;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.4);
    font-size: 0.8125rem;
  }

  .screen-card .sc-new-badge {
    display: inline-block;
    font-size: 0.625rem;
    font-weight: 600;
    color: var(--s-gold);
    text-transform: uppercase;
    margin-left: 0.5rem;
  }

  @keyframes fadeSlideIn {
    from { opacity: 0; transform: scale(0.92) translateY(12px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  @keyframes flashGold {
    0%   { outline: 2px solid var(--s-gold); outline-offset: 3px; }
    100% { outline: 2px solid transparent; outline-offset: 3px; }
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
    width: 90vw; height: calc(85vh - 40px);
    border: none;
    border-radius: var(--s-radius);
    box-shadow: 0 8px 40px rgba(0,0,0,0.3);
    background: white;
  }

  .overlay-toolbar {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.5rem 1rem;
    background: rgba(26,25,23,0.9);
    border-radius: var(--s-radius);
    color: rgba(255,255,255,0.9);
    font-size: 0.8125rem;
    font-weight: 500;
  }

  .overlay-toolbar #overlay-screen-name {
    font-family: var(--s-mono);
    color: rgba(255,255,255,0.6);
  }

  .overlay-toolbar .btn.active {
    background: var(--s-coral);
    color: white;
  }

  .edit-status {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.5);
    font-family: var(--s-mono);
  }

  .toast {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(26,25,23,0.95);
    color: #e8e4df;
    padding: 0.5rem 1.25rem;
    border-radius: var(--s-radius);
    font-size: 0.8125rem;
    font-weight: 500;
    z-index: 200;
    transition: opacity 0.3s ease;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  }
  .toast.hidden { opacity: 0; pointer-events: none; }

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

  .canvas-toolbar button.active {
    background: var(--s-secondary);
    color: var(--s-coral);
  }

  /* Timeline panel */
  .timeline-panel {
    position: fixed;
    top: 48px; right: 0; bottom: 0;
    width: 320px;
    background: var(--s-card);
    border-left: 1px solid var(--s-border);
    z-index: 60;
    display: flex; flex-direction: column;
    box-shadow: -4px 0 20px rgba(0,0,0,0.15);
    transition: transform 0.25s ease;
  }
  .timeline-panel.hidden { transform: translateX(100%); pointer-events: none; }

  .timeline-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--s-border);
    font-weight: 600; font-size: 0.875rem;
  }
  .timeline-close {
    background: none; border: none; color: var(--s-muted);
    font-size: 1.25rem; cursor: pointer; padding: 0 0.25rem;
  }
  .timeline-close:hover { color: var(--s-text); }

  .timeline-list {
    flex: 1; overflow-y: auto; padding: 0.5rem 0;
  }
  .timeline-empty {
    text-align: center; color: var(--s-muted);
    padding: 2rem 1rem; font-size: 0.8125rem;
  }

  .timeline-item {
    display: flex; gap: 0.75rem;
    padding: 0.625rem 1rem;
    position: relative;
  }
  .timeline-item:not(:last-child)::after {
    content: "";
    position: absolute;
    left: calc(1rem + 4px);
    top: calc(0.625rem + 14px);
    bottom: -0.625rem;
    width: 1px;
    background: var(--s-border);
  }

  .timeline-dot {
    width: 9px; height: 9px;
    border-radius: 50%;
    background: var(--s-muted);
    margin-top: 0.25rem;
    flex-shrink: 0;
  }
  .timeline-dot.current { background: var(--s-coral); }

  .timeline-content { flex: 1; min-width: 0; }
  .timeline-msg {
    font-size: 0.8125rem; font-weight: 500;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .timeline-meta {
    font-size: 0.6875rem; color: var(--s-muted);
    margin-top: 0.125rem; font-family: var(--s-mono);
  }
  .timeline-actions {
    display: flex; gap: 0.375rem; margin-top: 0.375rem;
  }

  .btn-sm {
    padding: 0.125rem 0.5rem;
    border: 1px solid var(--s-border);
    border-radius: 0.25rem;
    background: transparent;
    color: var(--s-text);
    font-size: 0.6875rem;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
  }
  .btn-sm:hover { background: var(--s-secondary); }
  .btn-restore:hover { background: var(--s-coral); color: white; border-color: var(--s-coral); }

  .badge-current {
    font-size: 0.6875rem; color: var(--s-coral);
    font-weight: 600; padding: 0.125rem 0;
  }

  .timeline-item.current .timeline-msg { color: var(--s-coral); }

  /* Diff overlay */
  .diff-overlay {
    position: fixed; inset: 0; z-index: 90;
    background: rgba(26,25,23,0.95);
    display: flex; flex-direction: column;
    transition: opacity 0.2s ease;
  }
  .diff-overlay.hidden { opacity: 0; pointer-events: none; }

  .diff-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.9);
    font-weight: 600; font-size: 0.875rem;
  }
  .diff-controls { display: flex; align-items: center; gap: 0.5rem; }
  .diff-controls .btn { color: rgba(255,255,255,0.7); }
  .diff-close {
    background: none; border: none; color: rgba(255,255,255,0.5);
    font-size: 1.5rem; cursor: pointer;
  }
  .diff-close:hover { color: white; }

  .diff-body {
    flex: 1; display: flex; gap: 1.5rem;
    padding: 1.5rem;
    overflow: hidden;
  }
  .diff-pane {
    flex: 1; display: flex; flex-direction: column;
    overflow: hidden; border-radius: var(--s-radius);
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08);
  }
  .diff-pane-label {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem; font-weight: 600;
    color: rgba(255,255,255,0.6);
    border-bottom: 1px solid rgba(255,255,255,0.08);
    font-family: var(--s-mono);
  }
  .diff-pane img {
    flex: 1;
    object-fit: contain;
    padding: 0.5rem;
    min-height: 0;
  }

  /* Annotate mode */
  #canvas-viewport.annotate-mode { cursor: crosshair; }
  #canvas-viewport.annotate-mode .screen-card { cursor: crosshair; }
  #canvas-viewport.annotate-mode .sc-frame-label { cursor: crosshair; }

  /* Canvas edit mode */
  #canvas-viewport.canvas-edit-mode .screen-card .sc-iframe { pointer-events: auto !important; cursor: default; }
  #canvas-viewport.canvas-edit-mode .screen-card .sc-frame-content { border-color: rgba(59,130,246,0.3); }
  #canvas-viewport.canvas-edit-mode .screen-card:hover .sc-frame-content { border-color: rgba(59,130,246,0.5); }

  /* Feedback pins */
  .feedback-pin {
    position: absolute;
    z-index: 20;
    transform: translate(-50%, -50%);
    cursor: pointer;
  }
  .feedback-pin .pin-dot {
    width: 14px; height: 14px;
    border-radius: 50%;
    background: var(--s-coral);
    border: 2px solid white;
    box-shadow: 0 1px 6px rgba(0,0,0,0.3);
    transition: transform 0.15s;
  }
  .feedback-pin:hover .pin-dot,
  .feedback-pin.open .pin-dot { transform: scale(1.3); }
  .feedback-pin.resolved .pin-dot { background: var(--s-muted); opacity: 0.6; }

  .feedback-pin .pin-tooltip {
    display: none;
    position: absolute;
    top: 100%; left: 50%;
    transform: translateX(-50%);
    margin-top: 0.5rem;
    background: var(--s-card);
    border: 1px solid var(--s-border);
    border-radius: var(--s-radius);
    padding: 0.5rem 0.625rem;
    min-width: 160px; max-width: 240px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    z-index: 30;
  }
  .feedback-pin.open .pin-tooltip { display: block; }

  .pin-text { font-size: 0.8125rem; line-height: 1.4; margin-bottom: 0.25rem; }
  .pin-meta { font-size: 0.6875rem; color: var(--s-muted); font-family: var(--s-mono); }
  .pin-actions {
    display: flex; gap: 0.25rem; margin-top: 0.375rem;
    border-top: 1px solid var(--s-border); padding-top: 0.375rem;
  }
  .pin-actions button {
    padding: 0.125rem 0.375rem;
    border: 1px solid var(--s-border);
    border-radius: 0.25rem;
    background: transparent;
    color: var(--s-text);
    font-size: 0.625rem;
    cursor: pointer;
    font-family: inherit;
  }
  .pin-actions button:hover { background: var(--s-secondary); }
`;
