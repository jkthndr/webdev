# Landing Page Skill

Surface: marketing landing page (single route, anchor-linked sections).
Audience: end users discovering a product, deciding whether to start a trial or sign up.
Goal: turn a brief into a single TSX route that renders a believable production-ready landing page.

## When to use

Use this skill when the design brief's `surface` is `landing` and the brief covers a product or service. Skip for dashboards, internal tools, auth flows, or doc pages — those have their own skills.

## Output shape

Produce one TSX file at `src/app/screens/<screen-name>/page.tsx` in the user's project. Default export a server component. Use Tailwind classes only; do not introduce styled-components, CSS modules, or runtime CSS-in-JS.

The route should render:

1. Hero with one headline, one subhead, and a primary plus secondary CTA.
2. Three to four feature blocks that map to the brief's `goals` or `mustHaves`.
3. One section of supporting context: short customer quote, logo strip, or stat row. Pick the one that suits the brief's `tone`.
4. Pricing or call-to-action section.
5. Footer with a final CTA and minimal nav.

Skip sections the brief explicitly says to avoid. Do not invent features the brief did not list.

## How to use the seed

`seed/page.tsx` is a starting scaffold. It has the layout in place with placeholder copy and structure. Edit it in place rather than rewriting from scratch:

- Replace headline, subhead, and CTA copy with values derived from the brief.
- Swap feature block titles and bodies for the real `goals` / `mustHaves`.
- Keep the section order unless the brief explicitly demands a different one.
- Keep the warm coral palette unless the brief attaches a different design system.

The seed deliberately uses only Tailwind classes that match the bundled template's `globals.css` tokens, so it renders on any project generated from the webdev project template.

## Tone defaults

If the brief gives a `tone`, honor it. If the brief is silent:

- Default to `warm`: coral primary, sage success, gold accent, off-white background. Confident but not loud.
- Avoid the AI tells listed in `references/review-checklist.md` (purple gradients, fake stats, side-stripe cards, emoji bullets).

## Anti-patterns

- Do not copy hero patterns or section structures from named sites (Linear, Stripe, Apple, Notion, etc.). Inspiration is fine; structural mimicry is not, especially because webdev may eventually be commercial.
- Do not invent customer logos, names, or quantitative claims. If the brief lacks real social proof, omit the section or use a generic empty-state.
- Do not import design tokens or components from third-party brand systems. Use the project's own tokens.

## References

- `references/layout-patterns.md`: Common landing layouts and when each works.
- `references/component-map.md`: How to use shadcn primitives if the project has them.
- `references/review-checklist.md`: What to verify after generation, before approving.
- `provenance.json`: Clean-room metadata. Read this if you are auditing the skill's authorship.

## Build target

The output must:

- Type-check under the project's `tsconfig.json`.
- Build under `next build`.
- Render without errors at the project's preview proxy.
- Pass the production proof run (build + start + Playwright screenshot) before approval.
