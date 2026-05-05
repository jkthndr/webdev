# Planning Prompt: Agent-Native Design Tool (Pencil Alternative)

> Use this prompt to kick off a planning session. Paste it into a fresh Claude Code conversation
> in the target project directory once you're ready to begin.

> 2026-05-04 note: this is older planning context. The canonical webdev runtime target is now the Dell laptop at `http://100.115.18.15:4500`. HP `100.102.138.90` is Playbook/3095, not the webdev runtime.

---

## Prompt

I need to plan and build an **agent-native design tool** — a system that lets AI agents (Claude Code, via MCP/CLI/API) create, iterate on, and export production-ready web/mobile UI designs. Think of it as an open-source, self-hosted alternative to [Pencil](https://pencil.sdks.io/) (the `.pen` file design tool), but built agent-first rather than human-first.

### Context & Motivation

- Pencil is currently free but likely to monetize. I use it heavily via its MCP server to let Claude generate and iterate on designs before writing code.
- I want to own this capability — self-hosted, open-source core, no vendor lock-in on a critical workflow tool.
- **The primary user is the AI agent, not me.** I review and approve outputs, but the agent drives creation and iteration.
- This is a personal tool first (used across multiple projects), with potential to become a product on smithbuilder.app later.

### What Pencil Does That I Want to Replicate (Core Capabilities)

1. **Structured design documents** — A file format (like `.pen`) that represents a tree of UI nodes (frames, components, text, images, containers) with layout properties, styles, and constraints.
2. **Batch operations** — Insert, copy, update, replace, move, delete nodes in bulk. The agent needs to make sweeping changes efficiently, not one node at a time.
3. **Design guidelines / tokens** — A system for storing and applying design tokens (colors, spacing, typography, radii, shadows) so the agent produces consistent designs.
4. **Component library** — Pre-built component primitives (buttons, cards, inputs, modals, navigation, etc.) that map to real UI framework components (shadcn/ui, Tailwind, etc.).
5. **Screenshot / visual preview** — Render the design to an image so the agent (or I) can see what it looks like. This is critical for the human-approval step.
6. **Export to code-ready artifacts** — Export designs as React/TSX components, HTML/CSS, or structured specs that minimize the gap between mockup and implementation.
7. **Variables / dynamic content** — Support for placeholder data, variants, and responsive breakpoints.

### Key Design Principles

- **Production fidelity**: Designs must closely match what gets coded. If I approve a mockup, the coded version should look nearly identical. This means working with real component dimensions, real typography, real spacing — not abstract wireframe boxes.
- **Agent-native interface**: The primary API is for AI agents — MCP tools, CLI commands, or a REST API. No visual drag-and-drop editor needed (at least not in v1).
- **Real component mapping**: Design primitives should map 1:1 to actual UI framework components (shadcn/ui + Tailwind CSS is my default stack). A "Button" in the design tool IS a shadcn Button with specific variant/size props.
- **Iterative workflow**: The agent should be able to load a design, make targeted changes, re-render a preview, get my feedback, and iterate — all without starting from scratch.
- **Self-contained**: Runs locally or on a home server. No cloud dependencies for core functionality.

### Technical Constraints

- **Host machine**: Dell laptop on Tailscale (`100.115.18.15`)
  - Local repo: `C:\Users\olive\Projects\webdev`
  - Runs webdev Studio/API/MCP on port `4500`
  - Also runs Agent Bridge on port `3100`
  - HP `100.102.138.90` is Playbook/3095, not the webdev runtime
- **Deployment pattern**: GitHub Actions + Tailscale SSH (same as SmithBuilder, HolaCan, Coral Money). Push to `main` → workflow SSHes in → docker compose up. Work on `dev` branch, PR to `main`.
- **Tech stack**: Next.js/React/TypeScript + shadcn/ui + Tailwind (locked per research)
- **Integration targets**: Claude Code (MCP server — stdio local, HTTP remote), potentially other AI agents later.
- **Ports**: 4500 (Studio/API/MCP). Live previews route through `/proxy/<project>/...`; per-project preview ports are internal. Health check: `curl -sf http://100.115.18.15:4500/api/health`

### Competitive Landscape (Pre-Researched)

Before designing anything, study these existing tools — they represent the current state of the art for agent-driven design. I've already gathered initial research; deepen it during planning.

#### Google Stitch (stitch.withgoogle.com)
- **What it is**: Google Labs AI design tool. Text/sketch/image → high-fidelity multi-screen UI designs + frontend code. Free (Google Labs experiment).
- **Agent integration**: Full SDK (`@google/stitch-sdk`), MCP server, and official AI SDK integration (`@google/stitch-sdk/ai` with `stitchTools()`). Also has official Claude Code skills (`google-labs-code/stitch-skills`) for design system generation and React component conversion.
- **Key API**: `create_project`, `generate_screen_from_text` (prompt + deviceType → HTML + screenshot), `list_screens`, `get_html`, `get_image`. SDK is built on MCP internally.
- **Export**: HTML/CSS, React code, Figma files. Has a `react-components` skill for converting Stitch screens into validated React/Tailwind components with design token consistency.
- **Strengths**: Google-backed, excellent AI integration, free, SDK is well-designed. The `stitchTools()` → AI SDK pattern is exactly what agent-native looks like.
- **Risks**: Google Labs product — could be killed, pivoted, or monetized at any time. Not self-hostable. Cloud-only. You don't own the rendering engine or design format.
- **Docs**: https://stitch.withgoogle.com/ | Skills: `npx skills add google-labs-code/stitch-skills --list`

#### Paper.design (paper.design)
- **What it is**: Desktop design app where the canvas IS HTML/CSS — no translation layer. GPU shader rendering. MCP server on localhost.
- **Agent integration**: 24 MCP tools with full bidirectional read/write. AI agents can inspect AND modify designs. Connect via: `claude mcp add paper --transport http http://127.0.0.1:29979/mcp --scope user`
- **Key read tools**: `get_basic_info`, `get_selection`, `get_node_info`, `get_children`, `get_tree_summary`, `get_screenshot` (base64, 1x/2x), `get_jsx` (real JSX from the canvas — no conversion step), `get_computed_styles`
- **Key write tools**: `create_artboard`, `write_html`, `set_text_content`, `update_styles`
- **Export**: JSX via `get_jsx` is the actual code that represents the design (HTML/CSS canvas = code). Can sync design tokens from Figma, pull real API data, convert to React/Tailwind and commit to GitHub.
- **Strengths**: Designs ARE code (HTML/CSS canvas), so "mockup ≈ production" is literally built in. MCP is bidirectional. Desktop app runs locally.
- **Risks**: Desktop app (requires GUI), not fully headless/self-hostable as a server. Closed-source. Could monetize. 24 tools is rich but the write surface is narrower than Pencil's batch operations.
- **Docs**: https://paper.design/docs/mcp

#### Penpot (penpot.app) — Already running on Mac Mini at port 9001
- **What it is**: Open-source (MPL 2.0) design platform. SVG-based. Self-hosted via Docker.
- **Agent integration**: Has a REST API, but it's designed for human workflows (Figma-like), not agent-driven design generation. No official MCP server (community efforts exist but are thin).
- **Strengths**: Fully self-hosted, open-source, already deployed on your network. SVG-based format is well-understood.
- **Risks**: API is not agent-optimized. Adding MCP on top would be building a translation layer over a human-first tool. Heavy resource usage (6 Docker containers, ~4GB on your Mac Mini).

#### Other Tools to Investigate
- **Excalidraw**: Open-source, has a JSON data format and React component. Could work as a lightweight canvas backend. No MCP server.
- **tldraw**: Programmatic React-based canvas with a good API. Could be extended with MCP. Lower fidelity than production UI.
- **Figma API**: Not open-source, but the API design patterns are worth studying for agent interface design.
- **Stitch MCP (community)**: Go-based proxy (`obinnaokechukwu/stitch-mcp`) that wraps Stitch API with resilient generation tracking, connection drop recovery, and virtual tools for progress monitoring. Worth studying as an MCP architecture reference.

### Research Phase — What Still Needs Investigation

1. **Headless rendering options:**
   - Puppeteer/Playwright for rendering HTML/CSS to screenshots
   - Satori (Vercel's OG image renderer — can render React to SVG)
   - Canvas-based renderers (Konva, Fabric.js)
   - Whether Paper's "canvas IS HTML/CSS" approach can be replicated headlessly

2. **Design file formats:**
   - What makes a good design document format for AI agents (JSON schema vs. HTML/CSS vs. SVG)
   - How to represent responsive layouts, component variants, and design tokens
   - Should the format BE React/TSX (like Paper) or be an intermediate representation (like Pencil's `.pen`)?

3. **The "designs ARE code" question:**
   - Paper's approach (canvas = HTML/CSS, export = the same code) achieves "mockup ≈ production" by definition
   - Stitch generates HTML/CSS from prompts, then has a separate React conversion step
   - Pencil uses a proprietary intermediate format (`.pen`) with export
   - Which approach best serves agent workflows? Is the intermediate format even necessary, or should the agent just write/modify real React components and render them for preview?

4. **Existing MCP patterns to study:**
   - Pencil: 13+ tools, batch operations, structured node tree
   - Paper: 24 tools, HTML/CSS canvas, bidirectional read/write
   - Stitch: SDK-over-MCP, `generate_screen_from_text`, project/screen hierarchy
   - What patterns work best for iterative agent-driven design?

### Build vs. Extend Decision

After research, help me decide between:

- **Option A — Extend existing OSS tool**: Fork/extend Penpot or tldraw + build an MCP server on top. Leverage existing rendering engine and file format.
- **Option B — Build custom design engine**: Purpose-built for agent workflows. Custom document format, custom rendering, custom MCP server. Maximum control, maximum effort.
- **Option C — "Designs ARE code" (Paper-inspired)**: No intermediate design format. The agent writes/modifies real React+Tailwind+shadcn components. A rendering service (Playwright/Puppeteer) screenshots them for preview. The MCP server manages a component library, renders previews, and tracks design state. The "design file" IS the code.
- **Option D — Wrap Stitch + build escape hatch**: Use Google Stitch (free, excellent agent integration) as the primary engine NOW, but build a local MCP proxy layer that abstracts the Stitch API. If Stitch monetizes or dies, swap the backend to a self-hosted engine without changing the agent interface. Study the community `stitch-mcp` Go proxy as a starting point.
- **Option E — Hybrid**: Stitch/Paper for generation, custom MCP server for orchestration, Playwright for rendering real components. Best of both worlds but more integration complexity.

For each option, outline: effort estimate, fidelity ceiling, maintenance burden, vendor lock-in risk, and how well it achieves the "mockup ≈ production" goal.

### Architectural Invariants (Locked)

These were validated during research and third-party review. They are non-negotiable for v1:

1. **Source of truth is TSX/React + Tailwind + shadcn/ui.** No independent visual schema. No design document compiler. No `.pen`-style intermediate format.
2. **Node operations are AST operations over code**, not CRUD on a separate design model. The agent edits TSX files, not a shadow node tree.
3. **Export IS the code.** The TSX the agent writes IS the production deliverable. No format conversion in v1.
4. **Web-only scope.** Mobile means responsive web, not native iOS/Android.

### Key Decisions (Locked)

- **Approach**: Option C — "Designs ARE code"
- **Rendering**: React SSR + Playwright (81/100 score, ~200-500ms warm cycle, ~1GB memory)
- **File format**: TSX + Tailwind + shadcn/ui (validated by v0.dev at commercial scale)
- **Hosting**: Docker on Dell laptop (`100.115.18.15`, port 4500)

### Phase 0.5: Validation Spikes (Before Full Build)

Run 3 focused tests (1-2 days each) to validate core assumptions before committing to the full build:

1. **Fidelity Spike**: TSX → Playwright screenshot across 10 representative shadcn screens. Verify screenshots match rendered components.
2. **Editability Spike**: Agent creates screen → modifies 3 components → checkpoints → makes bad edit → restores. Verify clean round-trip.
3. **Determinism Spike**: Same TSX → identical screenshot across 10 runs in Docker on Windows. Test font pinning, asset timing, viewport accuracy.

### MVP Scope (7 MCP Tools)

Reduced from 16 to 7 tools per third-party review. Narrow but end-to-end:

**MCP tools:**
1. `open_project` — open/create design project
2. `create_screen` — scaffold TSX screen + route
3. `edit_screen_code` — patch/modify screen code (AST operations)
4. `render_screenshot` — Playwright screenshot with viewport param
5. `list_screens` — list all screens in project
6. `checkpoint` — git commit current state
7. `restore_checkpoint` — git reset to saved state

**End-to-end workflow:**
1. Agent opens a project
2. Agent creates a screen (scaffolds TSX + route)
3. Agent edits the screen code (writes shadcn/ui components)
4. Agent renders a screenshot
5. Human reviews screenshot in browser
6. Human provides feedback, agent edits and re-renders
7. When approved, the TSX file IS the deliverable

### V1.1 Scope (Deferred)
- `lint_design` — a11y/token/layout checks
- `bulk_style_replace` — find/replace across components
- `get_design_tokens` / `set_design_tokens` — Tailwind config management

### V2+ Scope (Deferred Further)
- `export_code` format transformations (react-shadcn mapping to other libraries)
- Multi-session support (concurrent agents)
- Productization on smithbuilder.app

### Operational Specs

- **Font pinning**: Bundle Geist Sans/Mono in Docker image. No external font loading.
- **Checkpoint TTL**: Auto-cleanup checkpoints older than 7 days (configurable).
- **Single-session**: V1 supports one agent session per project at a time.
- **Deterministic rendering**: Fixed viewport, preloaded fonts, `networkidle` wait strategy.

### Output Format

Produce the plan as a **single self-contained interactive HTML file** (no build tools, works from `file://`). I'm a visual learner — walls of markdown don't land for me. The HTML should include:

- **Competitive landscape** — Tabbed or card-based comparison of Pencil, Stitch, Paper, Penpot, and any other relevant tools. Show strengths, risks, agent API surface, self-hostability, and fidelity level side-by-side.
- **Recommended approach** — Which option (A–E) and why. Clickable pros/cons for each option so I can compare.
- **Architecture diagram** — Interactive flow diagram showing how the agent, MCP server, rendering engine, component library, and design state connect. Clickable nodes that expand to show detail.
- **Component breakdown** — What to build, in what order. Visual build sequence (dependency graph or timeline).
- **Tech stack** — Recommendation with rationale for each choice.
- **Hosting plan** — How it deploys to the Dell laptop (Docker? bare Node? ports?).
- **Risk assessment** — What could go wrong, what's hardest, what has unknowns.
- **Phase breakdown** — MVP → v1 → future, with clear scope boundaries per phase.
- **MCP tool inventory** — Side-by-side comparison of Pencil's tools, Stitch's tools, and Paper's tools, with a column for "our tool" showing proposed equivalents.

### Design Preferences (for ALL visual output)

- Warm palette: coral #FF6B6B, warm orange #E8773A, soft gold #F5C542, sage green #7c9070
- Light/pastel theme, warm off-whites, soft shadows, rounded corners
- **No blue or purple** — they look AI-generated
- Tabbed sections, collapsible cards, clickable diagrams
- Clean typography (system fonts are fine for the plan HTML, Geist for any product UI)
- If there's any web UI for previewing designs, use shadcn/ui + Geist fonts

### Reference: What I Know About Pencil's Architecture

From the MCP tool definitions, Pencil provides:
- `get_editor_state()` — current file, selection, context
- `open_document(path)` — open or create .pen files
- `get_guidelines(category?, name?)` — load design guides and styles
- `batch_get(patterns, nodeIds)` — search/read nodes by pattern or ID
- `batch_design(operations)` — bulk insert/copy/update/replace/move/delete/image operations
- `export_nodes(...)` — export designs
- `get_screenshot(...)` — render visual preview
- `get_variables()` / `set_variables()` — manage design variables
- `snapshot_layout(...)` — capture layout state
- `find_empty_space_on_canvas(...)` — spatial awareness
- `search_all_unique_properties(...)` / `replace_all_matching_properties(...)` — bulk property operations

This is a well-designed agent interface. Study it as a reference for what operations an AI agent actually needs when designing UIs.
