# Component map

How to use shadcn primitives if the project has them. The bundled webdev template does not pre-install shadcn components; an agent can add them via the shadcn CLI (`npx shadcn@latest add <component>`) when the brief justifies it.

## Defaults the seed uses

The seed uses plain Tailwind classes only, against the tokens declared in the project's `globals.css`. That keeps it portable and lets it render before any shadcn component is added.

## When shadcn helps

- **Button** (`@/components/ui/button`): replace the inline `<a>` CTAs with `<Button asChild>` if the project already has it. Keeps focus rings, disabled states, and variants consistent.
- **Card** (`@/components/ui/card`): replace the feature `<div className="rounded-lg border ...">` blocks if the project has shadcn's Card.
- **Tabs** (`@/components/ui/tabs`): only if the brief calls for a comparison view (Starter vs Team, Monthly vs Yearly). Do not introduce tabs to fill space.
- **Accordion** (`@/components/ui/accordion`): only for an FAQ section the brief explicitly asks for.
- **Dialog**: only for a real demo modal. Not for cookie banners.

## Components to skip on a landing page

- Carousel: distracts from the headline. If the brief insists, push back.
- Sheet: belongs in app surfaces, not marketing.
- Command palette / Combobox: not landing-page UX.

## Tokens

The seed uses these globals.css tokens directly:

- `bg-background`, `text-foreground`: page chrome.
- `bg-card`, `border-border`: feature blocks, header, footer.
- `bg-primary`, `text-primary-foreground`: primary CTA. Default coral.
- `bg-secondary`, `text-secondary-foreground`: muted accent.
- `text-muted-foreground`: secondary copy.

If the project attaches its own design system, keep the same Tailwind token names. The DESIGN.md flow will rebind the underlying values without code changes.

## Icons

`lucide-react` is in the template's `package.json`. Use one icon per feature block at most. Do not use emoji as icons; emoji bullets are an AI tell.
