# Clean-Room and Commercial Boundary

Date: 2026-05-04
Status: Draft
Scope: Rules for building webdev as a potentially commercial web-design product.

## Purpose

webdev can learn from public products and open source tools at the product-pattern level, but it must not become a copied implementation or a derivative bundle of another tool's creative material.

This matters because the intended product may eventually be charged for, and because design tools often mix code, prompts, design systems, templates, sample assets, and UX copy. Those all need separate provenance.

## Hard Rules

- Do not copy Open Design source code, prompts, skill bodies, template files, design-system markdown, generated examples, assets, or UX copy into webdev.
- Do not bundle named third-party or brand-specific design systems unless we have explicit rights to do so.
- Do not copy Claude Design, Google Stitch, Pencil, or similar product flows so closely that webdev feels like a clone.
- Every bundled template, style recipe, prompt, and sample screen must be authored for webdev.
- Every bundled template and style recipe must include provenance metadata: author, license, created date, and source notes.
- User-provided design systems, screenshots, imported ZIPs, or references must be marked as user content.
- Imported material may guide a user-owned project, but it must not become redistributed webdev boilerplate.
- Dependencies must be reviewed for license compatibility before shipping in a paid package.

## Allowed Learning

- We may compare public feature sets.
- We may study high-level architecture patterns such as guided briefs, run history, screenshot review, design lint, and read-only handoff tools.
- We may implement our own versions of common ideas using webdev's architecture, naming, prompts, UI, and data model.
- We may cite public sources in docs when explaining why a product direction exists.

## Provenance Requirements

Each bundled template or style recipe should carry metadata like:

```yaml
provenance:
  author: webdev
  license: proprietary-or-project-license
  created: 2026-05-04
  notes: Original work for webdev. No third-party source copied.
```

Each imported user artifact should carry metadata like:

```yaml
source:
  type: user-provided
  importedAt: 2026-05-04T00:00:00Z
  redistributionAllowed: false
```

## Review Checklist

- Is this file original to webdev?
- Does it include any copied prompt, template, skill, or design-system language?
- Does it mention or mimic a named brand design system?
- Is any third-party dependency license compatible with a paid product?
- Is user-provided material clearly separated from bundled product material?
- Would a reasonable reviewer describe the work as inspired by general product patterns rather than copied from a specific project?

## Sources

- Open Design repository: https://github.com/nexu-io/open-design
- Claude Design announcement: https://www.anthropic.com/news/claude-design-anthropic-labs
