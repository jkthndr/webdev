# webdev V1 Validation Handoff

Date: 2026-05-05  
Owner context: Oliver is ending the active development session and starting a new validation session.

## Bottom Line

webdev V1 is no longer just a prototype branch. The MVP vertical loop is merged to `main` and live on the Dell laptop at `http://100.115.18.15:4500/studio`.

The next session should validate the real user journey, not reopen broad product planning. Treat this as a validation pass over the MVP loop: brief -> generated screen -> real live preview -> production Playwright proof -> checkpoint -> feedback iteration.

## Live Targets

- Studio: `http://100.115.18.15:4500/studio`
- Health: `http://100.115.18.15:4500/api/health`
- V1 canary: `http://100.115.18.15:4500/api/provenance`
- Playbook: `http://100.102.138.90:3095`
- Playbook project: `migrated_webd`
- Validation bridge thread: `webdev-v1-validation`
- Previous active development thread: `webdev-design-tool-v1-plan`

## Current Git State

- Primary branch: `main`
- V1 merged to `main`: `430a29c Ship V1 vertical loop to main`
- Deploy hotfix: `407e9c5 fix(deploy): use smithbuilder ghcr image`
- Runtime fixes after deploy:
  - `ddf8417 fix(workspace): resolve template dir from multiple candidates`
  - `28e8084 fix(docker): install git for per-project checkpoint repos`
  - `377e7ee fix(docker): set default git identity for checkpoint commits`

Known untracked local artifacts exist and should not be staged unless Oliver explicitly asks:

- `.claude/`
- `.mcp.json`
- `.playwright-mcp/`
- `bash.exe.stackdump`
- `docs/architecture-review-mvp.md`
- `docs/webdev-overall-project-evaluation-2026-05-05.html`
- `newlook.pen`
- `spikes/`

## What Was Completed

- Compared `nexu-io/open-design` against webdev and documented what should be borrowed conceptually, without copying source, prompts, templates, or design systems.
- Created product and technical docs for a narrow web-only design-to-code tool, not slide decks or general design tooling.
- Made Oliver's visual documentation preference durable in `AGENTS.md`.
- Coordinated with Penny and Claude through the bridge.
- Chose the core architecture: real generated Next app preview is advisory; production build/start plus Playwright screenshot is the proof artifact.
- Created the V1 Playbook task set and divided work across Codex and Claude.
- Added design brief storage/API/MCP.
- Added generation context from brief and pinned feedback.
- Added proof run pipeline with production build/start, Playwright screenshot, changed files, checkpoint state, and failed proof behavior.
- Added clean-room seed skill/template provenance metadata and `/api/provenance`.
- Added Studio UI pieces through Claude's UI branch, including brief panel, live preview, proof timeline, and feedback surfaces.
- Added full-loop and feedback round-trip smoke scripts.
- Merged the V1 vertical loop to `main`.
- Fixed the GHCR namespace deploy failure.
- Manually deployed the correct image on the Dell after discovering CI was running on HP while checking Dell.

## In Progress

- Validation of the live MVP on Dell.
- Playbook task `WEBD-74`: durable CI/CD fix so deploy and health check target the same canonical host.

## Blocked Or Deferred

- Durable CI/CD remains incomplete until a Dell runner is registered/targeted or deployment transport is changed.
- Stale pre-V1 canvas tasks `WEBD-1` and `WEBD-2` should be ignored for validation unless Oliver revives them.
- Rich design-system editing, imports, auth, billing, and commercial launch hardening are intentionally deferred until the MVP loop survives validation.

## Validation Checklist

1. Open Studio at `http://100.115.18.15:4500/studio`.
2. Confirm `/api/health` is green and `/api/provenance` returns `issues: 0`.
3. Create or select a project/screen.
4. Enter a design brief.
5. Generate a screen from the brief.
6. Confirm the live preview renders the real generated app route, not a synthetic iframe.
7. Run production proof.
8. Confirm Playwright screenshot is created and surfaced in Studio.
9. Confirm changed files/status are visible.
10. Add pinned feedback.
11. Run a follow-up generation/proof and verify feedback is included in run context.
12. Record any validation gaps as small Playbook tasks.

## Playbook Status

Completed V1 task range: `WEBD-55` through `WEBD-73`.

Open follow-up:

- `WEBD-74 CI/CD: target Dell runner for webdev deploy`

Validation tasks were created on 2026-05-05 after the MVP handoff:

- `WEBD-75 Validation: live Studio smoke on Dell`
- `WEBD-76 Validation: brief-to-proof walkthrough`
- `WEBD-77 Validation: pinned feedback iteration`
- `WEBD-78 Validation: review V1 gap list`

Stale and ignored unless revived:

- `WEBD-1 Phase 1: Interactive inline text editing on canvas`
- `WEBD-2 Phase 2: Delete and reorder elements`

## Bridge Coordination

Use `webdev-v1-validation` for the validation phase.

The old development thread `webdev-design-tool-v1-plan` was used for planning, implementation coordination, deploy recovery, and launch status. It should be treated as closed for new V1 validation discussion.

## Next Agent Guidance

- Start from `main`.
- Use one short feature branch per validation fix, for example `codex/validation-proof-screenshot-fix`.
- Post intended task IDs and file ownership to `webdev-v1-validation` before editing.
- Avoid Claude-owned Studio UI files unless coordinated first:
  - `src/server/studio/canvas-page.ts`
  - `src/server/studio/styles.ts`
- Keep validation tasks small. Do not create a new "phase 1" bucket.
- Keep the clean-room/commercial boundary visible in any template, prompt, skill, or generated seed work.

## Memory Notes

Completed this session:

- V1 MVP vertical loop is live on Dell and merged to `main`.

Work in progress:

- Validation pass over the MVP and `WEBD-74` CI/CD deploy-target hardening.

Blocked:

- Fully trustworthy CI/CD until deploy executor and health-check target are unified.

One thing learned:

- A normal health endpoint can false-green the wrong or old host. A V1-only canary such as `/api/provenance` is much better for confirming the live image really contains the release.

One thing to fix next time:

- Make CI/CD deploy to and validate the same canonical machine by construction, preferably a real Dell runner or explicit remote deployment to Dell.
