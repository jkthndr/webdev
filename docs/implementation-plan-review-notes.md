# Implementation Plan Review Notes

## What I Understand You Are Building

You are building an agent-native, self-hosted design system/toolchain that lets an AI agent:

1. Create and modify UI designs programmatically
2. Render screenshots for human approval
3. Iterate quickly based on feedback
4. Export production-ready frontend code

You are explicitly trying to avoid lock-in from tools like Pencil/Stitch/Paper while preserving their best agent workflows.

## What Is Strong in the Current Docs

- Clear product thesis: the agent is the primary user.
- Good benchmark references for capability shape:
  - Pencil batch operations and node model
  - Paper HTML/CSS-native "design is code" model
  - Stitch generation and workflow abstractions
- Strong emphasis on mockup ~= production fidelity.
- Practical initial MVP boundary (small component set + screenshot + export + iterate loop).
- The proposed MCP surface is thoughtful and close to what an agent actually needs.

## Main Concerns and Risks

## 1) Strategy Conflict: "No Intermediate Format" vs Node-Centric MCP

The docs recommend React/TSX as source of truth (good), but proposed MCP tools (`get_node_tree`, `batch_modify`, `write_html`, `export_code`) imply a parallel internal design model.
Risk: you unintentionally build both:

- a code-first system
- a schema/translation system

That doubles complexity fast.

## 2) `react-shadcn` Export Is High-Risk

Converting arbitrary HTML/TSX into idiomatic `shadcn/ui` components is a hard semantic mapping problem.
Risk: export quality becomes inconsistent and brittle, especially with nested layouts and variant inference.

## 3) Scope Creep in v1 MCP Surface

The proposed 16-tool set is good directionally, but too large for a first reliable release.
Risk: many partially-working tools instead of a few excellent ones.

## 4) Evidence Quality Is Mixed

A lot of sources are community/blog posts; some are likely lower-confidence than official docs/specs.
Risk: architecture choices made on noisy data (performance, memory, feature claims).

## 5) Security Model Is Under-Specified

If the agent can write/render arbitrary code for previews, you need strict execution isolation and resource controls.
Risk: unsafe code execution, runaway resource usage, and unclear trust boundaries.

## 6) Mobile Goal Is Underdelivered

Docs discuss responsive web screenshots, but "web/mobile UI designs" can imply native stacks.
Risk: expectation mismatch unless scope is explicitly "mobile web first".

## 7) Missing Operational Concerns

The docs under-spec:

- data/version migrations
- checkpoint retention/cleanup
- concurrent agent sessions
- deterministic rendering (fonts, asset loading, timing)

These become painful once used across many projects.

## Architecture Thoughts

If you commit to Designs Are Code, keep that commitment strict:

- Source of truth: TSX/React + Tailwind + component library
- Manifest/metadata only for indexing and workflow hints
- No independent visual schema compiler in v1

Treat "node operations" as AST operations over code, not a separate design document language.

## Suggested v1 Cut (to Reduce Risk)

Start with 6-7 core tools, not 16:

1. `open_project`
2. `create_screen` (scaffold TSX + route)
3. `edit_screen_code` (patch/code-op)
4. `render_screenshot`
5. `list_screens`
6. `checkpoint`
7. `restore_checkpoint`

Optional in v1.1:

- `lint_design` (token/a11y/layout checks)
- `bulk_style_replace`

Delay until later:

- `write_html`
- `export_code` transformations into `react-shadcn`

## Highest-Priority Validation Spikes

Before full build, run 3 short spikes:

1. Fidelity Spike: TSX -> Playwright screenshot loop across 10 representative screens/components.
2. Editability Spike: can the agent reliably make targeted multi-file updates with checkpoints and recover cleanly?
3. Determinism Spike: same input produces stable screenshots (fonts/assets/timing) in Docker + Windows host.

## Key Decisions You Should Lock Early

- Is v1 strictly code-first with no independent design schema?
- Is mobile scope responsive web only (for now)?
- Is `react-shadcn` export a v2 concern?
- What is the minimum safe sandbox model for rendering untrusted generated UI code?

## Bottom Line

The direction is strong and well-researched. The biggest risk is accidental dual-architecture (code-first + hidden schema/translator).
If you keep v1 focused on a code-native pipeline with a minimal MCP surface, you can ship faster and de-risk the hard parts before they become platform debt.
