# webdev — Agent-Native Design Tool

Self-hosted MCP server for creating, iterating on, and exporting production-ready web UI designs.

## Quick Start

To design a UI, use the MCP tools:

1. `open_project` — Create/open a design project
2. `create_screen` — Add a new screen (TSX + route)
3. `edit_screen_code` — Modify screen code
4. `render_screenshot` — See what it looks like
5. `list_screens` — See all screens
6. `checkpoint` — Save current state
7. `restore_checkpoint` — Undo to a saved state

## Workflow

```
open_project("my-app")
  → create_screen("my-app", "login")
  → edit_screen_code("my-app", "login", "<TSX code>")
  → render_screenshot("my-app", "login")
  → iterate...
  → checkpoint("my-app", "login screen v1")
```

## Design System

All screens use:
- **React + TypeScript** (TSX)
- **Tailwind CSS v4** for styling
- **shadcn/ui** components (Button, Card, Input, Dialog, Table, Tabs, Select, Label, Checkbox, etc.)
- **Lucide React** icons
- **Geist** font (Sans + Mono)

### Color Palette (no blue/purple)
- Primary: `#FF6B6B` (coral)
- Destructive: `#E8773A` (warm orange)
- Accent: `#F5C542` (gold) / `#7c9070` (sage)
- Background: `#FAF8F5` (warm off-white)
- Card: `#FFFFFF`
- Border: `#E8E4DF`
- Text: `#2D2A26`
- Muted: `#6B6560`

### Component Import Pattern
```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// etc.
```

## Infrastructure

- **MCP Server**: `http://100.102.138.90:4500`
- **Health**: `GET /api/health`
- **Preview**: Ports 4501+ (per-project)

## Architectural Rules

1. Source of truth is TSX. No intermediate design format.
2. Edit means writing TSX code, not manipulating a node tree.
3. Export IS the code. The TSX file is the deliverable.
4. Web-only. Mobile = responsive viewports.
