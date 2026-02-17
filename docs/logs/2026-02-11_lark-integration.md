# JFDI Build Log - 2026-02-11 (Session 2)

## Session: Lark Calendar Integration

### What Happened
Added Lark/Feishu calendar integration to the JFDI dashboard and calendar endpoints. Lark events now merge with Google Calendar events and display with source badges (Google = green, Lark = blue). All integration is graceful — if Lark isn't configured or accessible, the app falls back to Google-only.

### Files Created
- `src/lib/lark/client.ts` — Lark Open API client with tenant_access_token auth, calendar list, today events, upcoming events
- `src/app/api/lark/calendar/route.ts` — Standalone Lark calendar API endpoint

### Files Modified
- `.env` — Added LARK_APP_ID and LARK_APP_SECRET
- `src/app/api/dashboard/route.ts` — Merges Google + Lark events, sorted by start time
- `src/app/api/calendar/route.ts` — Unified calendar endpoint with `?source=google|lark|all` filter
- `src/app/page.tsx` — Calendar widget shows source badges (Google/Lark), shows up to 8 events
- `src/app/meetings/page.tsx` — Calendar events show Google/Lark source badge
- `CLAUDE.md` — Documented Lark integration, new API route, lark/ lib directory
- `docs/SETUP_GUIDE.md` — Added Lark calendar endpoints to API table

### Technical Details
- Lark auth uses tenant_access_token (app-level, auto-refreshes 5 min before expiry)
- Token cached in memory to avoid repeated auth calls
- Calendar events normalized to same shape as Google events (id, title, start, end, attendees)
- Lark timestamps are Unix seconds → converted to ISO 8601

### What's NOT Done Yet
- No cron/scheduler for morning agent (manual only via slash command)
- No tests
- No mobile swipe gestures on reminder cards
- No voice-to-text for meeting debrief
- Lark calendar may need user-level OAuth for personal calendar access (tenant token may only see org-level calendars)
