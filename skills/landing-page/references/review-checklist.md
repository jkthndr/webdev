# Landing page review checklist

Run this checklist before moving a generated landing page from draft to proof. Anything in the AI tells section is a soft block; anything in the structural section is a hard block.

## AI tells (soft block — fix before approval)

- Purple or violet gradients. Default landing palette is warm coral, not synthetic purple.
- Emoji used as feature-block icons. Use lucide icons or omit the icon.
- Stats with no source: "10x faster", "saves 40 hours/week", "trusted by thousands". Either cite or cut.
- Made-up customer logos, names, or quotes. If real social proof is missing, omit the section.
- Side-stripe accent cards (vertical colored bar on the left of every card). Generic 2023-AI aesthetic.
- "Honest", "honestly", "to be honest", "we get it" filler phrases.
- Three-paragraph CTAs. One sentence is enough.
- Six feature columns. Three is enough; four if the brief justifies it.

## Structural (hard block — fix before approval)

- Headline does not say what the product is. The hero must answer "what is this" in plain words.
- Two competing primary CTAs. The hero should have one primary and at most one secondary.
- Sections that do not map back to a goal in the brief. Cut them.
- Pricing tier called "Enterprise" with no real differentiator. Either remove the tier or name what's actually different.
- Subhead longer than two sentences.
- Header nav links that go nowhere or point at sections that do not exist.

## Build and proof

- `next build` passes locally.
- The route renders without runtime errors at the project preview proxy.
- Production proof run (build + start + Playwright screenshot) passes. Failed proof = failed run, even if dev preview rendered.
- Screenshot at the documented viewports (default `1280x800`, plus `390x844` if the brief lists mobile).

## Tone alignment

- Brief tone matches generated tone. If the brief says `restrained`, the page should not feel like a startup pitch deck.
- Brand voice is consistent across hero, features, pricing, and CTA.
- No filler superlatives ("amazing", "revolutionary", "game-changing"). Replace with specifics.

## Accessibility

- Every interactive element has a clear focus state. Tailwind's default focus ring is acceptable.
- Heading order is sequential (h1 once, then h2s, then h3s). No skipped levels.
- Contrast on coral primary against white text passes AA. (Default token combination passes; do not lighten the coral to a pastel.)
- Images and icons have alt text or are explicitly decorative.

## Provenance

- The page does not copy structural patterns or copy from named sites. Inspiration is fine; structural mimicry is not.
- If the project ships commercially, the bundled seed's `provenance.json` must remain marked `original: true, copiedThirdPartyMaterial: false`.
