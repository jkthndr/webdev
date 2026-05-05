# webdev V1 Product Requirements and Technical Spec

Date: 2026-05-04
Status: Draft for Penny/Claude review
Scope: Web design only. No slide decks, office docs, social assets, audio, video, or native mobile.

## Product Vision

webdev is a self-hosted design-to-code studio for AI agents.

An agent should be able to take a product brief, ask the few questions that matter, generate real React/TSX screens using the user's design system, render screenshots for human approval, accept pinned feedback, iterate safely through checkpoints, and hand off production-ready code.

The core invariant remains:

- Source of truth is TSX/React + Tailwind + shadcn/ui.
- Export is the code.
- No separate `.pen`-style document compiler in V1.
- Mobile means responsive web screens.

## Product Goals

1. Let a user explore web UI ideas without burning Claude Design/Stitch/Pencil usage.
2. Produce higher implementation fidelity than screenshot-only design tools by rendering real app code.
3. Make agent iteration visible: plans, changed files, screenshots, feedback, diffs, checkpoints.
4. Keep the product commercially defensible with original templates, user-owned design systems, and clean-room implementation.
5. Provide a narrow but polished MVP before expanding into general creative work.

## Non-Goals

- No slide deck creation.
- No general image/video/audio generation.
- No Figma/Penpot vector editing.
- No arbitrary visual node tree as source of truth.
- No cloned Open Design templates/prompts/design systems.
- No brand-replica design systems bundled as first-party content.
- No multi-tenant billing/auth in MVP, though the architecture should not block it.

## Primary Users

1. Solo builder/founder
Needs fast product screens and landing pages, wants self-hosted cost control.

2. Agent operator
Uses Codex/Claude/Cursor/Gemini to generate UI and wants a repeatable design workflow.

3. Product team reviewer
Does not write TSX directly, but reviews screenshots, leaves feedback pins, approves versions.

4. Future commercial customer
Needs private design-to-code generation using company design systems and existing frontend stack.

## MVP Product Shape

The MVP is not "a generic AI chat that writes HTML." It is:

- A web Studio for projects, screens, screenshots, comments, versions, and design systems.
- An MCP/API server for agents to create and edit screens.
- A guided generation layer that turns briefs into TSX using skill recipes.
- A deterministic review pipeline: build, screenshot, lint, feedback, checkpoint.

Preview and rendering decision:

- The live preview is required and must render the real generated Next app.
- Studio can show the live app inside an iframe, but it should load through webdev's existing preview proxy, for example `/proxy/<project>/screens/<screen>`.
- Do not use a generated `srcdoc` iframe as the primary preview or design artifact.
- Playwright screenshots remain the approval source of truth for visual QA, checkpoint diffs, and handoff.
- Use development mode/HMR for fast in-progress preview, then run production build/start before screenshot approval.

## Major Requirements

### R1. Project and Run Persistence

Current state:

- Projects are filesystem folders under `projects/<name>`.
- Git checkpoints exist per generated project.
- Studio layout and feedback are stored in `.studio` JSON files.

Requirement:

- Add a metadata store for projects, design briefs, conversations/runs, produced files, comments, tabs, screenshots, and approvals.
- SQLite is acceptable for Studio state; TSX files and git checkpoints remain the durable deliverable.

Suggested tables:

- `projects(id, name, dir, design_system_id, created_at, updated_at)`
- `screens(id, project_id, name, route, file_path, created_at, updated_at)`
- `runs(id, project_id, screen_id, status, agent, prompt, plan_json, started_at, ended_at)`
- `run_events(id, run_id, type, payload_json, created_at)`
- `feedback(id, project_id, screen_id, selector, x, y, text, status, created_at, updated_at)`
- `design_systems(id, project_id, name, path, tokens_json, created_at, updated_at)`
- `approvals(id, project_id, screen_id, checkpoint_hash, status, created_at)`

Acceptance criteria:

- Studio can reopen and show the last active project, active screen, run history, comments, and current checkpoint.
- A completed run shows prompt, plan, changed files, screenshot, lint findings, and checkpoint.

### R2. Guided Brief Capture

Requirement:

- Add a structured `DesignBrief` object before create-from-prompt.
- The agent can still skip if user explicitly says "no questions, build it", but the default workflow collects a short brief.

Fields:

- `surface`: landing, dashboard, internal-tool, auth-flow, settings, docs, pricing, mobile-web-flow, other.
- `audience`
- `job_to_be_done`
- `tone`: restrained, editorial, utility, warm, bold, playful, refined, experimental.
- `brand_context`: use existing design system, upload/provide brand spec, choose a style recipe.
- `screens_or_sections`
- `responsive_targets`: desktop, mobile, tablet, all.
- `constraints`: accessibility, copy, data, anti-references.

Acceptance criteria:

- Studio can create/save/edit a brief.
- Agent tools can read the active brief.
- New generation runs include the brief in their context.

### R3. Web-Only Skill Registry

Requirement:

- Add file-based skill recipes, but make them webdev-native and TSX-focused.
- Skills are guidance and seed files, not executable plugins.

Initial skill set:

- `landing-page`
- `saas-pricing`
- `dashboard`
- `internal-tool`
- `auth-flow`
- `settings-page`
- `docs-page`
- `data-table-workflow`
- `mobile-web-flow`
- `empty-state-and-error-states`

Skill folder shape:

```text
skills/<id>/
  SKILL.md
  seed/
    page.tsx
  references/
    layout-patterns.md
    component-map.md
    review-checklist.md
```

Acceptance criteria:

- `GET /api/skills` lists webdev skills.
- `get_skill` MCP/resource access returns the skill body and seed metadata.
- `create_screen_from_brief` can select a skill and scaffold a TSX screen.

### R4. Design Systems and Token Binding

Requirement:

- Add project-level `DESIGN.md` support with original schema.
- Convert design-system guidance into concrete Next/Tailwind/shadcn code.

Minimum `DESIGN.md` sections:

- Brand voice
- Color tokens
- Typography
- Spacing/radius/shadow
- Layout rules
- Component rules
- Motion rules
- Accessibility rules
- Anti-patterns

Generated project files:

- `src/app/globals.css` CSS variables
- Tailwind configuration or CSS token layer, depending on template stack
- `src/lib/design-system.ts` typed token metadata if useful
- shadcn component variant guidance in generated skill context

Acceptance criteria:

- A project can have a design system attached.
- Screens generated after attachment use the tokens.
- Lint catches hardcoded token drift for common colors/radii/fonts.

Commercial note:

- Ship only generic/original style recipes.
- Allow users to import their own company `DESIGN.md`.
- Avoid bundled "Stripe/Apple/Linear-inspired" brand systems in a paid product unless cleared.

### R5. Agent Run Engine

Requirement:

- Add a run API that can orchestrate generation from the Studio UI.
- Keep MCP authoring tools, but add a first-party run abstraction for product UX.

MVP options:

- Phase 1: run engine calls internal project services and expects an external MCP client/agent to perform edits.
- Phase 2: local daemon spawns Codex/Claude/Cursor CLIs with cwd set to the generated project.

Run states:

- `queued`
- `awaiting_brief`
- `planning`
- `editing`
- `building`
- `screenshotting`
- `reviewing`
- `failed`
- `completed`
- `canceled`

Acceptance criteria:

- Studio shows live run status and plan.
- A failed build surfaces logs and exact file references.
- User can cancel a running generation.

### R6. MCP and API Surface

Keep current MCP tools:

- `open_project`
- `create_screen`
- `edit_screen_code`
- `render_screenshot`
- `list_screens`
- `checkpoint`
- `restore_checkpoint`
- `get_feedback`

Add authoring tools:

- `get_project`
- `get_screen_code`
- `get_design_brief`
- `set_design_brief`
- `list_design_systems`
- `get_design_system`
- `set_design_system`
- `list_skills`
- `get_skill`
- `create_screen_from_brief`
- `run_design_lint`
- `resolve_feedback`

Add read-only handoff tools:

- `get_screen_bundle`
- `get_latest_screenshot`
- `search_screen_code`
- `list_checkpoints`
- `get_checkpoint_diff`

Acceptance criteria:

- MCP tools are grouped/documented as authoring vs handoff.
- Handoff tools are read-only and safe to expose to agents working in downstream app repos.

### R7. Studio UX

Requirement:

- Studio becomes the main product surface, not just a gallery.

Target layout:

- Left: project/screens/versions/design-system/skill context.
- Center: canvas with a live iframe of the real proxied app route plus Playwright screenshots for approval states.
- Right: inspector with comments, lint findings, run details, and code references.
- Bottom or side rail: chat/run timeline when generation is active.

MVP improvements:

- Project home shows brief, design system, screens, latest status.
- Preview panel starts the real app server when needed and clearly shows `starting`, `live`, `build failed`, and `stale screenshot` states.
- Canvas supports feedback pins and checkpoint diff as first-class workflows.
- Edit mode supports text edits reliably and marks code changes as uncheckpointed.
- Comments can be attached to agent runs.

Acceptance criteria:

- A user can create a project, pick a skill/style recipe, generate a screen, review screenshot, leave feedback, rerun, and approve without leaving Studio.

### R8. Design Quality Gate

Requirement:

- Add deterministic design linting for TSX/Tailwind/CSS plus rendered screenshots where feasible.

Checks:

- Build/type errors.
- Missing responsive states.
- Text overflow at mobile and desktop viewport.
- Low contrast.
- Unlabeled inputs/buttons.
- Excessive hardcoded colors outside design tokens.
- Default AI tropes: purple/blue gradients, emoji icons, fake metrics, filler copy, side-stripe cards.
- shadcn misuse: nested cards, buttons used for non-actions, non-semantic tables.
- Visual screenshot sanity: nonblank, expected viewport dimensions, no obvious horizontal overflow.

Acceptance criteria:

- `run_design_lint` returns structured findings with severity, file, line if static, and screenshot region if visual.
- A generation run can fail or warn based on lint thresholds.

### R9. Import and Export

Requirement:

- Keep "export is code" as the main path.
- Add convenience handoff flows.

MVP:

- Download screen/project ZIP.
- Copy handoff prompt for downstream implementation.
- Read-only MCP handoff tools.

Later:

- Import Claude Design or Open Design HTML ZIP into an "external prototype" project.
- Convert external HTML into TSX only through an explicit clean-room rewrite process.

Acceptance criteria:

- Exported project can run independently with `npm ci && npm run build`.
- Handoff bundle includes TSX, CSS/tokens, screenshots, design brief, comments, and checkpoint hash.

### R10. Security, Licensing, and Commercial Readiness

Requirement:

- Build with commercial use in mind from day one.

Rules:

- No copied Open Design source, prompts, templates, skill bodies, design-system markdown, or assets.
- Every bundled template/style recipe must be original.
- User-provided design systems are user content.
- Agent spawning must be opt-in and scoped to project cwd.
- Secrets must never be written into generated projects.
- Docker deployment remains the default for self-hosting.

Acceptance criteria:

- Repo has `docs/license-boundary.md` before template/skill work begins.
- New templates include provenance metadata: author, license, created date.
- Any import from external tools is marked as user-provided source material.

## Proposed Milestones

### Milestone 0: Align the running environment

- Canonical webdev runtime target is the Dell laptop at `http://100.115.18.15:4500`.
- Health checks should use `http://100.115.18.15:4500/api/health` for the Tailscale URL and `http://localhost:4500/api/health` only on the Dell host.
- `100.102.138.90` remains the Playbook/3095 host, not the webdev runtime host.
- Merge or rebase `dev` deployment updates.
- Make e2e tests run without colliding with Docker ports.

### Milestone 1: Prove the vertical loop

This milestone should stay intentionally thin. It proves the core product before hardening registries and persistence.

- Capture a brief for one screen.
- Add `create_screen_from_brief`.
- Generate real TSX in the existing project scaffold.
- Run automatic build + screenshot + checkpoint after generation.
- Show run status and changed files in Studio.
- Let a user leave pinned feedback against the rendered screenshot.

### Milestone 2: Wrap the proven loop in product structure

- Add minimal SQLite metadata for projects, screens, briefs, runs, and approvals.
- Add project home improvements.
- Add project/user `DESIGN.md` attach/read flow.
- Add original style recipes with provenance metadata.
- Add a web-only skill registry once at least one generation loop is working.

### Milestone 3: Feedback, quality, and handoff

- Convert feedback pins into actionable run context.
- Add targeted text/style/component edits.
- Add design lint.
- Add approval states and visual diff review.
- Add read-only handoff MCP tools.

### Milestone 4: Commercial hardening

- Original template library.
- Workspace/user model.
- Auth and access control.
- Usage tracking and billing hooks.
- Import/export polish.

## V1 Cut Line

Must have for MVP:

- Canonical local/Docker environment with passing build and e2e path.
- One guided brief path for one web screen.
- `create_screen_from_brief` MCP/API tool.
- Real TSX output in the existing Next/shadcn/Tailwind scaffold.
- Live Studio preview of the real generated app route through the preview proxy.
- Automatic build, screenshot, and git checkpoint after generation.
- Studio run status showing current step, changed files, screenshot, and checkpoint.
- Pinned screenshot feedback stored and available to the next run.
- Clean-room provenance metadata for bundled templates/style recipes.

Defer until the vertical loop feels good:

- Full SQLite history beyond the minimum needed for runs and feedback.
- Rich design-system editor/API.
- Large skill marketplace or registry UI.
- Claude Design ZIP import.
- Read-only handoff MCP expansion.
- Auth, workspace roles, billing, and usage caps.

Do not build for this product:

- Slide decks, presentations, office docs, social graphics, audio, or video.
- A Figma-style vector editor.
- A broad agent-orchestration playground.
- Bundled third-party brand design systems.
- Copied Open Design prompts, templates, skills, design systems, assets, or UX copy.

## MVP Acceptance Test

A fresh user can:

1. Start webdev locally or through Docker.
2. Open Studio.
3. Create a project.
4. Choose a web skill and original style recipe or attach `DESIGN.md`.
5. Generate a screen from a brief.
6. See the agent plan and changed files.
7. See a live preview of the real generated route.
8. Review a Playwright-rendered approval screenshot.
9. Leave a pinned comment.
10. Regenerate or patch the screen.
11. Compare checkpoint diff.
12. Approve the screen.
13. Export or hand off the TSX bundle.

If that works reliably, webdev is a real MVP.
