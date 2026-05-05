# Agent Working Notes

## Documentation Style For Oliver

Oliver is a visual reader. When creating long-form documentation, research summaries, product requirements, technical specs, audits, or planning docs for him, do not deliver only a wall of markdown.

Default behavior:

- For any substantial doc, create a concise markdown source document plus a visual HTML companion in `docs/`.
- If only one artifact is appropriate, prefer the visual HTML companion for human review and keep the markdown terse.
- Use `docs/webdev-design-tool-visual-brief.html` as the local style reference for long planning docs.
- Lead with the bottom line, then break the rest into cards, stat blocks, tabs, timelines, comparison tables, status badges, and cut-line sections.
- Make decision points easy to scan: `Must have`, `Defer`, `Do not build`, `Risks`, `Next move`.
- Keep paragraphs short. Prefer one idea per block.
- Include source links and file links, but keep them in a compact "Source docs" or "References" area.
- Static single-file HTML is preferred unless the user asks for a full app. It should open directly from disk.
- Preserve commercial and clean-room notes in visual docs when a product may be charged for later.

Do not:

- Hand Oliver a long markdown-only document when the content is intended for him to read and decide from.
- Bury the recommendation below background material.
- Create slide decks, presentation files, or decorative marketing pages unless explicitly requested.

Suggested visual doc shape:

1. Hero with date, topic, and one-sentence purpose.
2. Bottom-line verdict card.
3. 3-5 stat or decision cards.
4. Sticky tabs or anchor navigation.
5. Comparison table for tradeoffs.
6. Roadmap/timeline.
7. MVP cut line.
8. Risks/guardrails.
9. Source docs and links.

## Playbook / Task Tracking

Oliver uses Playbook for project tasks.

- Service URL: `http://100.102.138.90:3095`
- API base: `http://100.102.138.90:3095/api`
- Current webdev project: `migrated_webd`
- Current webdev prefix: `WEBD`
- Canonical ops doc: `C:\Users\olive\Projects\taskq\AGENT-OPS.md`
- Use the agent API key workflow from that ops doc. Do not rediscover auth every session.
- Preferred auth for Codex automation is the `x-api-key` header.
- Do not duplicate API keys in this repo; read them from the canonical ops doc or the configured environment.

Useful endpoints:

- `GET /api/projects` lists projects.
- `GET /api/tasks?projectId=migrated_webd` lists webdev tasks.
- `POST /api/tasks` creates a task.
- `PATCH /api/tasks/<id>` updates a task, including `ticketId`.

Task creation convention:

- Use the existing `webdev` project rather than creating a new project.
- Keep tasks short enough to finish frequently.
- Prefer one feature branch per task.
- Branch prefixes should match the owner, for example `codex/...` or `claude/...`.
- Use `backlog` for newly planned work unless actively starting it.
- Use `codex` and `claude` as implementation assignees. Penny can be referenced for scope/product review in notes, but her workspace may be locked down.
- Include an `Outcome`, `Suggested branch`, and compact acceptance criteria in the task description.

## Active V1 Design Tool Context

Current initiative: turn webdev into a self-hosted web design-to-code studio with a real live preview and Playwright proof loop.

Current status as of 2026-05-05:

- V1 MVP vertical loop is merged to `main` and live on the Dell at `http://100.115.18.15:4500/studio`.
- The project has moved from active development into validation.
- Validation handoff docs:
  - `docs/webdev-v1-validation-handoff-2026-05-05.md`
  - `docs/webdev-v1-validation-handoff-2026-05-05.html`
- Completed this session: brief storage/API/MCP, generation context, real-app preview, production Playwright proof, changed files, checkpoint state, pinned feedback context, provenance metadata, smoke tests, merge to `main`, deploy recovery, and Dell live verification.
- In progress: validation of the live MVP and `WEBD-74` CI/CD deploy-target hardening.
- Blocked: fully trustworthy CI/CD until deploy executor and health-check target are unified on the Dell or through explicit Dell deployment transport.
- One thing learned: health checks can false-green the wrong or old host; use a V1-only canary such as `/api/provenance` to prove the live image is really the release.
- Future fix: make CI/CD deploy to and validate the same canonical machine by construction.

Important local references:

- Product/technical analysis: `docs/open-design-webdev-analysis.md`
- V1 requirements: `docs/webdev-v1-product-requirements.md`
- Canonical deploy target: `docs/webdev-deploy-target.md`
- Implementation task visual: `docs/webdev-v1-implementation-readout.html`
- User journey visual: `docs/webdev-user-journey-visual.html`
- Clean-room/commercial guardrails: `docs/license-boundary.md`
- Design context: `.impeccable.md`

Active bridge coordination:

- Current validation thread slug: `webdev-v1-validation`
- Previous active development thread slug: `webdev-design-tool-v1-plan` (closed for new V1 validation discussion)
- Bridge URL used locally: `http://localhost:3100`
- Bridge URL from ops inventory: `http://100.115.18.15:3100`
- Claude can help with implementation branches. Penny is useful for product/design review, but her workspace may be locked down.

Current look-and-feel anchor:

- Fresh Pencil file created for webdev: `pencil-new.pen`
- Frame: `webdev Studio - Live Proof Workbench`
- Exported reference image: `docs/pencil-exports/bi8Au.png`

Core product decision:

- Live preview must render the real generated app through webdev's proxy and is advisory.
- Playwright proof is the acceptance artifact: build/start the generated app, open the route, screenshot it, record changed files/status, then checkpoint.

Canonical runtime target:

- webdev runs on the Dell laptop at `http://100.115.18.15:4500`.
- Health check: `http://100.115.18.15:4500/api/health`.
- `http://localhost:4500` is equivalent only when running on the Dell host.
- Playbook remains separate on the HP laptop at `http://100.102.138.90:3095`.
- Do not use `100.102.138.90:4500` for webdev unless `docs/webdev-deploy-target.md` has been updated in the same change.

## V1 Branch Strategy

Use `main` as the stable upstream base for validation fixes and keep work in small, mergeable feature branches.

Current integration base:

- `main`
- Purpose: shipped V1 MVP containing docs, design brief storage/API/MCP, generation context, production proof runs, failed proof state, preview port hardening, Studio UI integration, provenance, and runtime Docker fixes.
- New validation fixes should branch from `main`, not from older task branches.

Recommended active branches:

- Claude UI branch examples: `claude/validation-studio-<short-task>`
  - Owns `src/server/studio/canvas-page.ts` and `src/server/studio/styles.ts`.
  - Can call the already-built APIs for brief, generation context, proof runs, screenshots, and advisory preview state.
- Codex backend/ops branches: keep using task-specific `codex/<short-task-name>` branches from `main`.
  - Avoid editing Claude-owned Studio UI files unless coordinating on bridge first.

Completed task branches kept for traceability:

- `codex/playbook-agent-ops`
- `codex/design-brief-storage`
- `codex/design-brief-api`
- `codex/proof-run-pipeline`
- `codex/proof-failure-state`
- `codex/feedback-run-context`

Conflict rule:

- Before starting a new branch, post intended task IDs and file ownership to bridge thread `webdev-v1-validation`.
- If a task needs shared files, pick one owner and have the other agent review or add follow-up patches after the first branch lands.

## Approval Courtesy

If a future command/tool approval request might put Codex idle waiting on Oliver:

- Post a short courtesy note to the active agent-bridge thread first so the other agents know Codex may pause for human approval.
- Ask Oliver for a broad, task-scoped approval envelope rather than many tiny one-command approvals.
- Phrase the approval around the work outcome and safe command family, for example "allow Docker/Playbook API checks for task setup" or "allow npm test/build commands for this repo".
- Do not ask for destructive permissions unless Oliver explicitly requested that operation.
