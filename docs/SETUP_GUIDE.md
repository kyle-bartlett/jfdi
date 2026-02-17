# JFDI Setup & Usage Guide

## Prerequisites

| Requirement | Check | Notes |
|---|---|---|
| Node.js 22+ | `node -v` | Required for Next.js 16 |
| npm | `npm -v` | Comes with Node |
| Claude Code CLI | `claude --version` | Required for Chat module and slash commands |
| Google Cloud project | [console.cloud.google.com](https://console.cloud.google.com) | Already set up as `gmail-brain` project |

---

## Step 1: Google Cloud Console Configuration

You already have the `gmail-brain` Google Cloud project with Calendar + Gmail APIs enabled. You need to add one redirect URI.

| Action | Where | Value |
|---|---|---|
| Add OAuth redirect URI | Google Cloud Console > APIs & Credentials > OAuth 2.0 Client ID > Authorized redirect URIs | `http://localhost:3000/api/auth/callback` |

**Path**: [console.cloud.google.com](https://console.cloud.google.com) > Select `gmail-brain` project > APIs & Services > Credentials > Click your OAuth 2.0 Client ID > Add URI > Save

---

## Step 2: Start the App

| Command | What It Does |
|---|---|
| `cd ~/Personal/Bartlett_Labs/Apps/jfdi` | Navigate to project |
| `npm run dev` | Start dev server on `http://localhost:3000` |
| `npm run seed` | Re-seed database (only needed if you wipe the DB) |
| `npm run build` | Production build (for checking compile errors) |

---

## Step 3: Connect Google Accounts

| Step | Action |
|---|---|
| 1 | Open `http://localhost:3000` |
| 2 | Click **Connect Google** in the bottom-left sidebar |
| 3 | Sign in with `krbartle@gmail.com` (personal) |
| 4 | Grant Calendar + Gmail + Profile permissions |
| 5 | You'll be redirected back to the dashboard |
| 6 | Repeat for `kyle.bartlett@anker.com` (work) — click Connect Google again |

After connecting, the dashboard will auto-populate with calendar events and email stats.

---

## Step 4: Module-by-Module Usage

### Dashboard (`/`)

| Widget | Data Source | Requires Google? |
|---|---|---|
| Today's Priorities | Reminders DB | No |
| Calendar | Google Calendar API | Yes |
| Email | Gmail API | Yes |
| Projects | Projects DB | No |
| Relationships | Relationships DB | No |
| Goals | Goals DB | No |

### Reminders (`/reminders`)

| Action | How |
|---|---|
| Create | Click **+ New Reminder** > fill form > Save |
| Complete | Click the circle icon on the left of a reminder |
| Snooze | Click **1h** or **1d** buttons on the right |
| Filter | Click tabs: All, Overdue, Today, Next 3 Days, This Week, Later, Completed |
| Delete | Click **x** on the right |

### Projects (`/projects`)

| Action | How |
|---|---|
| Create | Click **+ New Project** > fill form (name, space, status, priority) > Create |
| View tasks | Click any project card to drill into ground-level task view |
| Add task | Inside a project, click **+ Add Task** |
| Change task status | Use the dropdown on each task (To Do / In Progress / Done / Blocked) |
| Switch view | Click **30K ft** (life overview), **10K ft** (projects), or **Ground** (tasks) |
| Filter by space | Click Anker / Personal / Bartlett Labs tabs |

### Relationships (`/relationships`)

| Action | How |
|---|---|
| Add contact | Click **+ New Contact** > fill name, email, type, priority, contact frequency |
| Record contact | Click **Contacted** button — sets last_contact to now |
| Search | Type in the search box |
| Sort | Use dropdown: Last Contact, Priority, Name |
| Filter by type | Use dropdown: Close, Peripheral, Casual, Personal, Professional |
| Yellow border | Means this contact is overdue for outreach (days since last contact > frequency) |

### Meetings (`/meetings`)

| Action | How |
|---|---|
| View calendar meetings | Automatically pulled from Google Calendar (if connected) |
| Create manual meeting | Click **+ New Meeting** > fill title + date |
| Mark complete | Click **Complete** button |
| Switch tabs | Upcoming / Completed |

### Knowledge (`/knowledge`)

| Action | How |
|---|---|
| Save entry | Click **+ New Entry** > fill title, URL, tags (comma-separated), content |
| Search | Type in the search box (searches by title) |
| Content | Stored as markdown text directly in the database |

### Spark (`/spark`)

| Action | How |
|---|---|
| Capture idea | Type in the text box > add optional tags > click **Spark It** |
| Tags | Comma-separated (e.g., `idea, automation, jfdi`) |

### Chat (`/chat`)

| Action | How |
|---|---|
| Send message | Type in the input box > click **Send** or press Enter |
| New session | Click **New Session** button |
| Requirement | Claude Code CLI must be installed and accessible in PATH |

---

## Step 5: Claude Code Slash Commands

Run these from Claude Code CLI (not the web chat):

| Command | What It Does |
|---|---|
| `/morning-overview` | Generates daily briefing with priorities, calendar, overdue items |
| `/add-reminder <text>` | Parses natural language into a structured reminder |
| `/meeting-prep <meeting>` | Creates a prep sheet with attendee context and talking points |
| `/meeting-debrief <notes>` | Processes brain dump into structured notes + action items |
| `/new-project <details>` | Creates a project from natural language description |
| `/quick-spark <idea>` | Captures an idea with auto-tagging |
| `/knowledge-save <content>` | Saves to knowledge base with auto-tags |

---

## API Endpoints (for scripting/automation)

All endpoints accept JSON. Use `Content-Type: application/json`.

| Endpoint | Methods | Query Params | Notes |
|---|---|---|---|
| `/api/reminders` | GET, POST, PATCH, DELETE | `?id=<uuid>` for PATCH/DELETE | |
| `/api/projects` | GET, POST, PATCH, DELETE | `?id=<uuid>` for PATCH/DELETE | |
| `/api/tasks` | GET, POST, PATCH, DELETE | `?project_id=<uuid>` for GET, `?id=<uuid>` for PATCH/DELETE | |
| `/api/relationships` | GET, POST, PATCH, DELETE | `?id=<uuid>` for PATCH/DELETE | |
| `/api/meetings` | GET, POST, PATCH, DELETE | `?id=<uuid>` for PATCH/DELETE | |
| `/api/knowledge` | GET, POST, PATCH, DELETE | `?search=<term>` for GET, `?id=<uuid>` for PATCH/DELETE | |
| `/api/spark` | GET, POST, PATCH, DELETE | `?id=<uuid>` for PATCH/DELETE | |
| `/api/goals` | GET, POST, PATCH, DELETE | `?id=<uuid>` for PATCH/DELETE | |
| `/api/dashboard` | GET | — | Aggregates all modules into one response |
| `/api/calendar` | GET, POST | `?view=today` or `?view=upcoming`, `?email=<email>`, `?source=google\|lark\|all` | Merges Google + Lark events |
| `/api/lark/calendar` | GET | `?view=today\|upcoming\|calendars`, `?calendar_id=<id>` | Lark-only calendar events |
| `/api/gmail` | GET | `?view=stats` or `?view=action-needed`, `?email=<email>` | Requires Google auth |
| `/api/claude` | POST | — | Body: `{ "message": "...", "sessionId": "..." }` |
| `/api/auth/google` | GET | — | Redirects to Google OAuth |
| `/api/auth/callback` | GET | — | Handles OAuth redirect |

---

## Data Locations

| Data | Location | Format |
|---|---|---|
| All structured data | Turso cloud DB (or `data/jfdi.db` locally) | SQLite via LibSQL |
| Knowledge content | `content` column in `knowledge_entries` table | Markdown text in DB |
| Relationship notes | `notes` column in `relationships` table | Markdown text in DB |
| Meeting prep/debrief | `prep_notes`/`debrief_notes` columns in `meetings` table | Markdown text in DB |
| Build logs | `docs/logs/*.md` | Markdown files |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| LibSQL connection errors | Check `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in `.env` |
| Google OAuth says "redirect_uri_mismatch" | Add `http://localhost:3000/api/auth/callback` in Google Cloud Console |
| Dashboard shows all zeros | Connect a Google account via sidebar, or create some data first |
| Chat says "Could not reach Claude" | Check `ANTHROPIC_API_KEY` env var and VPN connection (for Anker proxy) |
| Port 3000 already in use | Kill the process: `lsof -ti:3000 \| xargs kill` then `npm run dev` |
| Database is empty after a fresh clone | Run `npm run seed` |
