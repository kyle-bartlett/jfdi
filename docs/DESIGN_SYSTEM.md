# JFDI Design System — Anker Enterprise

## Brand Identity
- **Primary**: `#00A9E0` (HSL 196 100% 44%) — Anker Brand Blue
- **Focus/Ring**: `#40C7FB` (HSL 196 100% 62%) — Anker Focus Blue
- **Accent**: `#00DB84` (HSL 158 100% 43%) — Anker Green (positive/success only)

## Architecture
All colors are defined as HSL CSS variables in `src/app/globals.css`. Tailwind v4 maps them to utility classes via `@theme inline`. No hex values, hardcoded palette colors, or `var(--...)` references should exist outside `globals.css`.

## Tokens

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | White | Near-black | Page background |
| `--foreground` | Dark slate | Light gray | Body text |
| `--card` | White | Dark slate | Card surfaces |
| `--primary` | Anker Blue | Anker Blue | CTAs, active states, links |
| `--primary-foreground` | White | Dark | Text on primary bg |
| `--secondary` | Light gray | Dark gray | Secondary surfaces |
| `--muted` | Light gray | Dark gray | Disabled/inactive surfaces |
| `--muted-foreground` | Medium gray | Medium gray | Secondary text |
| `--accent` | Anker Green | Anker Green | Success, positive |
| `--destructive` | Red | Dark red | Errors, danger |
| `--warning` | Amber | Amber | Warnings, medium priority |
| `--border` | Light gray | Dark border | All borders |
| `--ring` | Anker Focus Blue | Anker Focus Blue | Focus rings |

## Tailwind Utilities
Use token-based classes everywhere:

```
bg-background   bg-card        bg-primary      bg-secondary
bg-muted         bg-accent      bg-destructive  bg-warning

text-foreground  text-muted-foreground  text-primary  text-primary-foreground
text-accent      text-destructive       text-warning

border-border    border-primary  border-warning
```

## Component Classes (from globals.css)

| Class | Usage |
|-------|-------|
| `.card` | Content cards with border |
| `.widget` | Dashboard widgets |
| `.widget-title` | Widget headings (uppercase, muted) |
| `.badge` | Base badge (combine with variant) |
| `.badge-primary` | Blue badge (Anker brand) |
| `.badge-accent` | Green badge (success/health) |
| `.badge-warning` | Amber badge (caution/medium) |
| `.badge-danger` | Red badge (error/high priority) |
| `.badge-muted` | Gray badge (low priority/inactive) |
| `.badge-secondary` | Subtle badge (secondary info) |
| `.btn` | Base button |
| `.btn-primary` | Primary CTA (Anker Blue) |
| `.btn-secondary` | Secondary action |
| `.btn-danger` | Destructive action |
| `.input` | Form inputs, textareas, selects |

## Rules

1. **No hex values** in `.tsx` files — all colors come from tokens
2. **No Tailwind palette colors** (e.g., `bg-blue-500`, `text-red-400`) — use semantic tokens
3. **No `var(--...)` in className** — use Tailwind utility classes (`text-muted-foreground`, not `text-[var(--text-muted)]`)
4. **No purple** — not in the Anker palette. Use `badge-secondary` instead of `badge-purple`
5. **No gradients** — flat Anker aesthetic
6. **Dark theme is default** — managed by `next-themes` with `attribute="class"`
7. **All new colors** must be added as HSL variables in `globals.css` `:root` and `.dark`, then registered in `@theme inline`

## Theme Toggle
System/Dark/Light toggle is in `src/components/theme-toggle.tsx`, rendered in the sidebar footer. Uses `next-themes`.

## Badge Migration Reference
Old → New:
- `badge-blue` → `badge-primary`
- `badge-green` → `badge-accent`
- `badge-yellow` → `badge-warning`
- `badge-red` → `badge-danger`
- `badge-gray` → `badge-muted`
- `badge-purple` → `badge-secondary`
