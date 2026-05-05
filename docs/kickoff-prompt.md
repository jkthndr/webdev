# Kickoff Prompt: Agent-Native Design Tool — Development

> Paste this into a fresh Claude Code session in the `C:\Users\olive\Projects\webdev` directory.

> 2026-05-04 note: this is an older kickoff prompt. Current agents should start from `AGENTS.md` and `docs/webdev-deploy-target.md`. webdev runs on Dell at `http://100.115.18.15:4500`; Playbook runs on HP at `http://100.102.138.90:3095`; old TaskQ `:3090` references are deprecated.

---

## Prompt

I'm building an **agent-native design tool** — a self-hosted MCP server that lets AI agents create, iterate on, and export production-ready web UI designs. The plan has been researched, reviewed by a third party, and approved. Now it's time to build.

### What to read first

1. **Check memory** — project context and architectural invariants are saved there
2. **Read the approved plan**: `docs/implementation-plan.html` (interactive HTML, but the content is readable as source)
3. **Read the review notes**: `docs/implementation-plan-review-notes.md`
4. **Check Playbook for your tasks**: use the API-key workflow in `AGENTS.md` and `C:\Users\olive\Projects\taskq\AGENT-OPS.md` against project `migrated_webd`.

### Architectural Invariants (Non-Negotiable)

1. **Source of truth is TSX/React + Tailwind + shadcn/ui.** No independent visual schema. No design document format. No `.pen`-style intermediate files.
2. **Node operations are AST operations over code.** The agent edits TSX files directly, not a shadow node tree.
3. **Export IS the code.** The TSX the agent writes IS the production deliverable. No format conversion in v1.
4. **Web-only.** Mobile means responsive web viewports, not native apps.

### MVP: 7 MCP Tools

```
open_project        — open/create a design project (Next.js + shadcn workspace)
create_screen       — scaffold a new TSX screen + route
edit_screen_code    — patch/modify screen code (AST-level operations on TSX)
render_screenshot   — Playwright screenshot with viewport param
list_screens        — list all screens in a project
checkpoint          — git commit current state (safe experimentation)
restore_checkpoint  — git reset to a saved checkpoint
```

### Build Order (Follow This Exactly)

**Phase 0.5 — Validation Spikes (do these FIRST, before building anything)**

1. **Spike: Fidelity** — Create 10 shadcn/ui test screens (Button, Card, Input, Dialog, Table, Tabs, Form, Select, Nav, full dashboard). Render each with Playwright. Verify screenshots match the live dev server pixel-accurately.

2. **Spike: Editability** — Test if you can reliably make targeted multi-file TSX edits → git checkpoint → intentional bad edit → git restore → verify clean round-trip.

3. **Spike: Determinism** — Same TSX → identical screenshot across 10 consecutive Playwright runs. Test font rendering (pin Geist Sans/Mono), viewport accuracy, timing.

**Phase 1 — MVP Build (only after spikes pass)**

4. Scaffold project repo + Docker setup
5. Project template (Next.js + shadcn/ui boilerplate)
6. MCP server skeleton (7 tools, @modelcontextprotocol/sdk)
7. Playwright screenshot pipeline
8. Git-based checkpoint system
9. Preview server routed through the webdev proxy on port 4500
10. Docker containerization (port 4500, restart: unless-stopped, healthcheck)
11. Claude Code skill (SKILL.md)
12. GitHub Actions deploy pipeline + runbook entry

### Infrastructure

- **Target**: Dell laptop (`100.115.18.15`)
- **Path**: `C:\Users\olive\Projects\webdev`
- **Ports**: 4500 (Studio/API/MCP; live preview uses `/proxy/<project>/...`)
- **Health check**: `GET /api/health` → `{"status":"ok","screens":N,"projects":N}`
- **Deploy pattern**: GitHub Actions + Docker Compose on the Dell self-hosted runner
- **Branching**: Work on `dev`, PR to `main`, merge triggers deploy
- **Docker**: `restart: unless-stopped`, `mem_limit: 1536m` on preview, `shm_size: 2gb`
- **Coexists with**: Agent Bridge (port 3100). Playbook is separate on HP at `100.102.138.90:3095`.

### Playbook

Track all work on the Playbook board:
- **API**: `http://100.102.138.90:3095/api`
- **Project ID**: `migrated_webd`
- Move tasks to `in_progress` when starting, `complete` when done
- Post comments on tasks as you make progress
- Check `AGENTS.md` and `C:\Users\olive\Projects\taskq\AGENT-OPS.md` for the current agent API-key workflow.

### Working Style

- Work autonomously — don't stop to ask permission to continue
- Start with the spikes. If any spike fails, stop and report findings before proceeding
- Use the established patterns from other projects in the codebase (check the Ops/runbook.md for deployment patterns)
- No blue or purple in any UI. Warm palette: coral #FF6B6B, orange #E8773A, gold #F5C542, sage #7c9070
- Keep terminal output concise. Report conclusions, not every intermediate step.

### Begin

Start by reading memory and the plan, then pick up the first task from Playbook and begin.
