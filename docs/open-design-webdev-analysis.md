# Open Design vs webdev: web-design analysis

Date: 2026-05-04
Open Design repo: https://github.com/nexu-io/open-design
Open Design commit inspected: `b4e69ac61b50576298f9f564603e5a4beb27417f`
Scope: web design and web prototype workflows only. Deck, office-doc, audio, video, and presentation capabilities are treated as out of scope except when they reveal reusable architecture.

## Executive Read

Open Design is useful to study, but it is not the same product as webdev.

Open Design is a broad creative-workflow shell. It detects existing agent CLIs, wraps them in a chat UI, injects file-based design skills and markdown design systems, streams artifacts into a sandboxed iframe, persists conversations/projects in SQLite, and exposes generated files through a read-only MCP server.

webdev is currently a narrower and more production-aligned code-first design runtime. It creates real Next.js + shadcn/ui projects, lets an agent write TSX screens, renders them through Playwright, checkpoints them with git, and provides a Studio canvas with thumbnails, annotations, checkpoint history, basic inline text editing, and visual diff support.

The biggest gap is not rendering. webdev already has a stronger production-fidelity foundation because the source of truth is real TSX. The gap is product workflow: webdev lacks the guided design process that makes Claude Design/Open Design feel usable.

## What Open Design Is

Open Design is:

- A local-first web app plus daemon for AI-assisted creative artifact generation.
- An agent orchestration layer that delegates work to installed CLIs such as Claude Code, Codex, Cursor Agent, Gemini CLI, OpenCode, Qwen, and others.
- A prompt/workflow product: skills, discovery forms, direction pickers, design-system injection, live todos, linting, and critique are the core value.
- A file workspace where generated HTML/JSX/CSS artifacts are stored on disk and previewed in sandboxed iframes.
- A catalog product: many skills and many `DESIGN.md` style systems are bundled or discoverable.
- A bridge into external coding agents through a read-only MCP server that exposes projects, active context, files, and artifact bundles.

## What Open Design Is Not

Open Design is not:

- A Figma/Pencil-style structured design editor with durable node operations.
- A production React app generator by default. Its main artifact loop is mostly HTML-first.
- A shadcn/ui or Next.js specific design pipeline.
- A clean product-MVP reference for us to copy wholesale. The repo is broad, fast-moving, and includes many non-web surfaces.
- A safe source of commercial-ready brand systems. Many systems are named after real companies; for a paid product, we should not ship "make it look like Stripe/Apple/Figma" as first-party brand replicas without legal review.
- A replacement for webdev's code-first thesis. It proves the value of orchestration and taste scaffolding, not the value of a separate design format.

## Web-Design Ideas Worth Bringing Into webdev

1. Guided discovery before generation
Open Design's strongest product decision is forcing a short structured brief before the agent writes code. webdev should add a `design_brief` object to projects and make every "create from prompt" flow collect: surface, audience, tone, brand context, target screens, responsiveness, and constraints.

2. First-class design systems
Open Design treats `DESIGN.md` as portable markdown. webdev should adopt an original `DESIGN.md` schema for user-owned systems, but translate it into real project tokens: CSS variables, Tailwind theme extensions, shadcn component guidance, typography rules, and anti-patterns.

3. Web-focused skill catalog
Open Design's skill folders are the right extension shape. webdev needs a smaller catalog: `landing-page`, `dashboard`, `admin-tool`, `auth-flow`, `settings`, `pricing`, `docs`, `mobile-web-flow`, `data-table`, and `empty-state`. Each skill should generate TSX, not standalone HTML.

4. Visual direction presets
When users do not have a brand, Open Design offers deterministic visual directions. webdev should ship a small set of original, legally clean "style recipes" that bind tokens and component posture without referencing third-party brands.

5. Live agent progress
Open Design streams todo/progress/tool events. webdev currently has no chat/runtime layer. A generation run should expose status, plan items, changed files, build errors, screenshots, and review findings in Studio.

6. Artifact linting and self-review
Open Design has a deterministic anti-slop linter. webdev should add a design quality gate that checks generated TSX/CSS for accessibility, responsive layout, token drift, forbidden visual tropes, fake metrics, contrast, text overflow, and shadcn misuse.

7. Read-only MCP handoff
Open Design's MCP server is read-only and optimized for "build this design in my app." webdev's current MCP is authoring-oriented. We should add read-only handoff tools: `get_project`, `get_screen_code`, `get_screen_bundle`, `get_design_system`, `search_screens`, `list_assets`, and `get_latest_screenshot`.

8. Persistent conversations and tabs
Open Design stores projects, conversations, messages, tabs, comments, templates, and run statuses in SQLite. webdev stores generated projects and git state but not design conversations/runs. Add a metadata store for Studio and agent runtime state.

9. Import from Claude Design
Open Design can import Claude Design ZIPs. webdev should support "import external prototype" as an onboarding bridge, but convert into a reviewable Next/TSX project only after an explicit clean-room transformation step.

10. Commercial-safe templates
Open Design has many examples. webdev should ship fewer, better, original templates. For a paid product, curated quality and IP cleanliness matter more than a huge catalog.

## Comparison Table

| Capability | webdev today | Open Design | What webdev should become |
|---|---|---|---|
| Core thesis | Designs are code: TSX + Tailwind + shadcn/ui | Artifacts are files: mostly HTML/JSX/CSS generated by an external agent | Keep TSX source of truth. Add guided generation around it. |
| Primary interface | MCP authoring tools plus Studio pages | Chat UI plus daemon, agent picker, skill picker, design-system picker | Studio should become chat + canvas + code/screenshot review. |
| Agent runtime | No native runtime; external MCP client drives edits | Detects and spawns installed agent CLIs; also BYOK proxy | Add optional local run engine, but keep MCP authoring mode. |
| Project format | Real Next.js projects under `projects/<name>` | `.od/projects/<id>` with artifact files and metadata | Keep Next projects; add `.webdev/metadata` or SQLite for run state. |
| Design source | TSX screen files | Generated HTML/JSX/CSS artifacts | TSX only for v1; HTML import can be converted or wrapped. |
| Rendering | Playwright screenshot of real Next app, plus existing preview proxy/runtime | Sandboxed `srcdoc` iframe preview | Make the real Next app the only preview target. Embed it live through `/proxy/<project>` for speed, and use Playwright screenshots for approval. Do not introduce a separate `srcdoc` artifact path. |
| Screenshot pipeline | Strong: deterministic screenshots, thumbnails, cache by git hash | Preview-first; export and screenshot support elsewhere | Keep as a core differentiator. Add automated visual review. |
| Studio/canvas | Screen cards, layers, inspector, annotations, text edits, checkpoint diff | Chat, file workspace, sandbox preview, comments, examples | Merge: chat left, canvas center, inspector/review right. |
| Design systems | Hardcoded shadcn/Tailwind template; no user design system model | Markdown `DESIGN.md` catalog with swatches and previews | Add project/user `DESIGN.md` plus token generation. |
| Skills/templates | None beyond template project | Large skill catalog across many surfaces | Ship a small web-only TSX skill catalog. |
| Discovery flow | None | Structured question form before generation | Add brief capture as required for create-from-prompt. |
| Visual direction picker | None | Curated directions with palettes/fonts | Add original commercial-safe style recipes. |
| Comments/feedback | Studio feedback pins; MCP `get_feedback` | Preview comments and attachments; surgical edit partially implemented | Turn comments into agent tasks with target selectors and screenshots. |
| Inline editing | Text replacement only; delete/reorder stubbed | Preview comments and file workspace | Add text edit, style edit, component-level edit, and agent-assisted patch. |
| Checkpointing | Strong: git commits and restore per generated project | SQLite/project state; export archives | Keep git checkpoints; add named versions and screenshot diffs. |
| Quality gates | Build failures only; no design lint | Artifact lint and self-critique | Add TSX/design lint before screenshot approval. |
| Export/handoff | Source is the export; no zip/handoff tooling | HTML, PDF, PPTX, ZIP, Markdown; read-only MCP | Add ZIP/code bundle and read-only MCP handoff. Skip decks/PPT. |
| Persistence | Filesystem + per-project git | SQLite plus files | Add SQLite for Studio state; keep filesystem/git for deliverables. |
| Deployment | Docker compose, GHCR workflow in progress | Local `tools-dev`, web deploy, optional Electron | Keep Docker-first server. Maybe add desktop later, not MVP. |
| Commercial readiness | Clean original direction, but incomplete MVP | Apache-2.0 repo, broad borrowed catalog, brand/IP risk | Clean-room implementation with original templates and user-owned design systems. |

## Guidance For webdev

The product should not chase Open Design feature-for-feature. webdev should be narrower and more valuable:

- Target only production web UI design.
- Keep source of truth as real React/TSX.
- Turn Studio into an agent-operated design review room.
- Add a web-only skill/design-system workflow so agents do not start from a blank prompt.
- Make visual QA, version history, and code handoff better than the hosted tools.

Preview architecture decision:

- The live preview should be the real generated Next app running behind webdev's preview runtime and proxy.
- Studio may embed that real route in an iframe, but the iframe URL should be `/proxy/<project>/screens/<screen>`, not generated `srcdoc` HTML.
- Playwright screenshots remain the proof artifact for approval, diffs, QA, and handoff.
- Development mode can be used for fast live reload; production build/start should be used before checkpointed approval.

## Proposed Product Positioning

webdev is a self-hosted design-to-code studio for AI agents.

It helps an agent create production-ready React screens, render them exactly as code, collect human feedback on a canvas, iterate through checkpoints, and hand off the final TSX as the deliverable.

It is not a slide generator, image generator, deck tool, Figma clone, or general creative studio.

## Build Priorities

P0: Make the current loop feel like a product

- Add project/run persistence.
- Add guided brief capture.
- Add a web-only skill registry.
- Add design-system files and token binding.
- Add a chat/run API that can drive existing MCP operations or a local CLI.
- Add design lint plus screenshot review.

P1: Make feedback and iteration excellent

- Convert feedback pins into structured agent tasks.
- Support targeted text/style/component edits.
- Add side-by-side checkpoint diffs to the main Studio flow.
- Add generated variants: 2-3 directions from one brief.

P2: Make it commercially defensible

- Ship original templates and style recipes only.
- Provide org/workspace model, access control, secrets handling, and billing hooks later.
- Add import/export/handoff flows without depending on proprietary competitors.

## Clean-Room Boundary

Use Open Design as competitive research only. Do not copy source files, prompts, templates, design-system files, screenshots, or branded systems into webdev.

Acceptable to reimplement as original work:

- The concept of file-based skills.
- The concept of markdown design systems.
- The concept of structured discovery forms.
- The concept of live run progress.
- The concept of sandboxed previews.
- The concept of read-only MCP handoff.
- The concept of deterministic design lint.

Avoid for commercial risk:

- Bundling third-party brand design systems as "inspired by X".
- Vendoring Open Design prompt text or skill bodies.
- Importing their examples/templates/assets.
- Claiming compatibility with Claude Design beyond documented import formats we independently implement.

## Sources

- Open Design GitHub: https://github.com/nexu-io/open-design
- Anthropic Claude Design announcement: https://www.anthropic.com/news/claude-design-anthropic-labs
- Claude Design help center: https://support.claude.com/en/articles/14604416-get-started-with-claude-design
