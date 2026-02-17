# 2026-02-12 — Anker Enterprise Design System

## What Was Done

### Design System Foundation
- Rewrote `src/app/globals.css` with complete HSL-based Anker token system
- Light and dark theme tokens using CSS variables (`:root` and `.dark`)
- Tailwind v4 `@theme inline` block mapping vars to utility classes
- Component classes: `.card`, `.widget`, `.badge-*`, `.btn-*`, `.input`

### Theme Toggle
- Installed `next-themes` package
- Created `src/components/theme-provider.tsx` — wraps app with dark default
- Created `src/components/theme-toggle.tsx` — System/Dark/Light toggle
- Updated `src/app/layout.tsx` — ThemeProvider wrapper + suppressHydrationWarning
- Toggle rendered in sidebar footer

### Full Page Refactoring (10 files)
All `var(--...)` references, hardcoded Tailwind palette colors (`bg-blue-500`, `text-red-400`), and old badge classes (`badge-blue`, `badge-purple`, etc.) removed from:

1. `src/components/sidebar.tsx`
2. `src/app/page.tsx` (dashboard)
3. `src/app/reminders/page.tsx`
4. `src/app/projects/page.tsx`
5. `src/app/relationships/page.tsx`
6. `src/app/meetings/page.tsx`
7. `src/app/knowledge/page.tsx`
8. `src/app/spark/page.tsx`
9. `src/app/goals/page.tsx`
10. `src/app/chat/page.tsx`

### Badge Migration
- `badge-blue` → `badge-primary`
- `badge-green` → `badge-accent`
- `badge-yellow` → `badge-warning`
- `badge-red` → `badge-danger`
- `badge-gray` → `badge-muted`
- `badge-purple` → `badge-secondary`

### Documentation
- Created `docs/DESIGN_SYSTEM.md` — tokens, rules, component classes, badge reference
- Updated `CLAUDE.md` — added UI/Design System section with rules
- Created `docs/ios-color-scheme.md` — saved iOS SwiftUI design system spec for Phase 3

### Cleanup
- Deleted unused `src/lib/claude/headless.ts` (CLI wrapper replaced by Anthropic SDK)

## Anker Brand Colors
- Primary: `#00A9E0` (HSL 196 100% 44%)
- Focus/Ring: `#40C7FB` (HSL 196 100% 62%)
- Accent Green: `#00DB84` (HSL 158 100% 43%)

## Files Changed/Created
- `src/app/globals.css` — complete rewrite
- `src/components/theme-provider.tsx` — new
- `src/components/theme-toggle.tsx` — new
- `src/app/layout.tsx` — updated
- `src/components/sidebar.tsx` — refactored
- `src/app/page.tsx` — refactored
- `src/app/reminders/page.tsx` — refactored
- `src/app/projects/page.tsx` — refactored
- `src/app/relationships/page.tsx` — refactored
- `src/app/meetings/page.tsx` — refactored
- `src/app/knowledge/page.tsx` — refactored
- `src/app/spark/page.tsx` — refactored
- `src/app/goals/page.tsx` — refactored
- `src/app/chat/page.tsx` — refactored
- `docs/DESIGN_SYSTEM.md` — new
- `docs/ios-color-scheme.md` — new
- `CLAUDE.md` — updated
- `src/lib/claude/headless.ts` — deleted

## Verification
- `npm run build` passes clean (all 28 routes/pages)
- Grep for old color patterns (`var(--text-muted)`, `badge-blue`, `text-blue-`, etc.) returns zero matches
- No hex values in any `.tsx` file

## What's NOT Done Yet
- Vercel deployment (Turso setup, env vars, Google Console redirect URI)
- iOS SwiftUI app (Phase 3 — spec saved to `docs/ios-color-scheme.md`)
- Automated `lint:colors` npm script (design system is enforced by convention for now)
- No cron/scheduler for morning agent
- No tests
