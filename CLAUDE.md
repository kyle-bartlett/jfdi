# JFDI - Personal Command Center

## Overview
JFDI is Kyle's personal productivity/life management system. A web-based command center integrating calendar, email, reminders, projects, relationships (CRM), meetings, knowledge base, goals, weather, and chat UI powered by the Anthropic SDK.

## Tech Stack
- **Framework**: Next.js 16 (App Router) with TypeScript
- **Database**: Turso (LibSQL) via @libsql/client + Drizzle ORM (falls back to local SQLite file for dev)
- **Styling**: Tailwind CSS v4
- **Google APIs**: googleapis npm package (Calendar + Gmail)
- **Lark/Feishu APIs**: Direct HTTP to Lark Open API (Calendar) + LarkAgentX proxy (Messages)
- **AI Backend**: Anker corporate proxy (`ai-router.anker-in.com`) routing to Claude Opus 4.6 via OpenAI-compatible format
- **Weather**: OpenWeatherMap API
- **Testing**: Vitest + @testing-library/react + @testing-library/jest-dom
- **Data Store**: All data in database (no filesystem writes)

## Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Dashboard
│   ├── reminders/          # Reminders module
│   ├── projects/           # Projects module
│   ├── relationships/      # CRM module
│   ├── meetings/           # Meetings module
│   ├── knowledge/          # Knowledge base
│   ├── spark/              # Spark file (idea capture)
│   ├── goals/              # Goals tracking
│   ├── chat/               # Chat UI (Claude SDK)
│   └── api/                # API routes (all CRUD)
├── components/             # Shared React components
│   ├── ui/                 # Reusable UI: Modal, ConfirmDialog, FormField, EmptyState, LoadingSkeleton, Toast, TagInput, SearchInput, MarkdownRenderer
│   ├── dashboard-widgets/  # Extracted dashboard widget components
│   ├── chat-panel.tsx      # Floating/sidebar chat panel (Cmd+K)
│   ├── sidebar.tsx         # App sidebar navigation
│   └── theme-*.tsx         # Theme provider + toggle
├── __tests__/              # Vitest test suites
│   ├── api/                # API route tests (6 files, 89 tests)
│   └── components/         # Component tests (6 files)
└── lib/                    # Core libraries
    ├── db.ts               # Turso/LibSQL database (auto-init on import)
    ├── schema.ts           # Drizzle ORM schema (11 tables)
    ├── weather.ts          # OpenWeatherMap integration
    ├── google/             # Google OAuth + APIs
    ├── lark/               # Lark/Feishu calendar + LarkAgentX integration
    └── claude/             # Claude client via Anker proxy
```

## Database
Turso (LibSQL) via `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` env vars. Falls back to local `file:./data/jfdi.db` for dev. Tables auto-initialize on first import of `@/lib/db`.

## Key Commands
- `npm run dev` - Start dev server on localhost:3000
- `npm run build` - Build for production
- `npm test` - Run all tests (vitest)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run seed` - Seed database with sample data
- `npm run db:studio` - Open Drizzle Studio (DB browser)
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:push` - Push schema to database

## API Routes
All routes support GET (list), POST (create), PATCH (update), DELETE:
- `/api/reminders` - Reminders CRUD
- `/api/projects` - Projects CRUD
- `/api/tasks?project_id=X` - Tasks CRUD (filtered by project)
- `/api/relationships` - Relationships/CRM CRUD
- `/api/meetings` - Meetings CRUD
- `/api/knowledge` - Knowledge entries CRUD
- `/api/spark` - Spark entries CRUD
- `/api/goals` - Goals CRUD
- `/api/dashboard` - Dashboard data aggregation
- `/api/calendar` - Unified calendar (Google + Lark merged, `?source=google|lark|all`)
- `/api/lark/calendar` - Lark calendar standalone (`?view=today|upcoming|calendars`)
- `/api/lark/messages` - LarkAgentX message proxy (optional, needs `LARK_AGENTX_URL`)
- `/api/gmail` - Gmail proxy
- `/api/claude` - Claude Code headless proxy
- `/api/auth/google` - Initiate Google OAuth
- `/api/auth/callback` - OAuth callback

## Conventions
- IDs are UUIDs (v4)
- Dates are ISO 8601 strings
- JSON arrays stored as serialized strings in SQLite
- Rich content (knowledge, relationship notes) stored directly in DB as markdown text
- Dark theme by default (managed by next-themes)
- All API routes return JSON

## UI / Design System (Anker Enterprise)
- **Design system docs**: `docs/DESIGN_SYSTEM.md`
- **All colors** defined as HSL CSS variables in `src/app/globals.css` — no hex in .tsx files
- **Use token classes only**: `bg-primary`, `text-muted-foreground`, `border-border`, etc.
- **Never use** Tailwind palette colors (`bg-blue-500`), `var(--...)` in className, or hex values
- **Badge classes**: `badge-primary`, `badge-accent`, `badge-warning`, `badge-danger`, `badge-muted`, `badge-secondary`
- **No purple** — not in the Anker palette. Use `badge-secondary` instead
- **No gradients** — flat Anker aesthetic
- **Theme toggle**: System/Dark/Light via `next-themes` in sidebar footer

## Google Accounts
- Personal: krbartle@gmail.com
- Work: kyle.bartlett@anker.com
- Connect via sidebar "Connect Google" link

## Lark/Feishu Integration
- App ID: set in LARK_APP_ID env var
- Uses tenant_access_token (app-level auth, auto-refreshing)
- Calendar events merged into dashboard and `/api/calendar` unified endpoint
- Graceful failure: if Lark is not configured/accessible, Google-only results returned

## Spaces (Project Organization)
- Anker (work)
- Personal
- Bartlett Labs (side projects)

## Shared UI Components
All pages use these shared components from `src/components/ui/`:
- **Modal** — Slide-over modal with backdrop, close on escape/click-outside, size variants
- **ConfirmDialog** — Destructive action confirmation (used before all deletes)
- **FormField** — Label + input + error message wrapper with required indicator
- **EmptyState** — Centered message with icon for empty lists
- **LoadingSkeleton** — Animated placeholder cards during data loading
- **Toast** (useToast hook) — Success/error notifications on CRUD operations
- **TagInput** — Multi-tag input with chips
- **SearchInput** — Debounced search input with clear button
- **MarkdownRenderer** — Renders markdown content (chat responses, notes)

## AI Integration
The Claude client (`src/lib/claude/client.ts`) routes through Anker corporate proxy:
- **Endpoint**: `https://ai-router.anker-in.com/v1/chat/completions` (OpenAI-compatible)
- **Model**: `vertex_ai/claude-opus-4-6`
- **Auth**: `Authorization: Bearer` header using `ANTHROPIC_API_KEY` env var
- **Streaming**: SSE via `/api/claude/stream` endpoint
- **Meeting AI**: Prep generation (`/api/meetings/[id]/prep`) and debrief processing (`/api/meetings/[id]/debrief`)
- **Compat**: `max_tokens` field (not `max_completion_tokens`), no `store` param, no `developer` role

## Deployment
- See `docs/DEPLOY.md` for step-by-step deployment guide
- Database tables auto-initialize on first request (no migration step needed for fresh deploy)
- Drizzle migrations available in `drizzle/` for schema versioning
- Environment variables documented in `.env.example`

## Build Logs
- **Always read** `docs/logs/BUILD_LOG.md` at the start of a session to understand project history
- **Always write** a new log file to `docs/logs/YYYY-MM-DD_description.md` at the end of a session
- Log should include: what was done, decisions made, files changed, issues found, and what's still pending
- Update `docs/logs/BUILD_LOG.md` index with the new entry


