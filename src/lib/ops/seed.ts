import { getOpsDb } from './db';
import { v4 as uuid } from 'uuid';

export function seedOpsIfEmpty() {
  const db = getOpsDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM projects').get() as { c: number };
  if (count.c > 0) return;

  // ===== PROJECTS (Updated 2026-02-20) =====
  const projects = [
    // P0 — Must ship NOW
    { title: 'ZipWise', priority: 'P0', status: 'In Progress', description: 'AI-powered zip code intelligence platform. Auth + onboarding built, deployed to zipwise.bartlettlabs.io. Clients waiting to test live. Quick-Complete Stops feature built overnight (tap stop badge to complete visit with animation + undo toast). MUST LAUNCH THIS WEEK.' },
    { title: 'Bartlett Labs Website', priority: 'P0', status: 'In Progress', description: 'Company website at bartlettlabs.io — deployed to Vercel, needs content + design polish to finish.' },
    { title: 'LinkedIn Business Page', priority: 'P0', status: 'In Progress', description: 'Professional LinkedIn presence for Bartlett Labs — page exists, needs content populated with generated ideas.' },
    { title: 'TuneUp / Auto-Commenter Platform', priority: 'P0', status: 'In Progress', description: 'Merged platform — old TuneUp trashed, fresh codebase at auto-commenter-platform. Clerk auth integrated. Competitors live, must launch ASAP.' },

    // P1 — High priority, active development
    { title: 'JFDI', priority: 'P1', status: 'In Progress', description: 'Personal ops dashboard at jfdi.bartlettlabs.io — merged with Ops Dashboard. 14 pages: Dashboard, Reminders, Projects, Tasks, Goals, Calendar, Meetings, Relationships, Ops Center (9 sub-tabs), Action Queue, Automations, Spark, Knowledge, Search. 8 cron-built features awaiting Kyle review: command palette (⌘K), quick-add (+), keyboard shortcuts (j/k/c/e/s/d/n), CSV export (⌘E), jump-to-week, reminders keyboard nav, ops seed overhaul, ZipWise quick-complete stops. Comprehensive seed data: 30 projects, 13 prospects, 18+ agent tasks.' },
    { title: 'C2 CPFR Dashboard', priority: 'P1', status: 'Review', description: 'Anker-C2W Charging CPFR collaboration dashboard at c2.bartlettlabs.io — LIVE. Mirror sheet architecture bypasses Anker sharing restrictions. Auto-sync every 2h business hours. Discrepancy detection, accept/reject, charts, CSV export.' },
    { title: 'LarkAgentX', priority: 'P1', status: 'In Progress', description: 'Lark/Feishu AI agent on Fly.io (larkagentx.fly.dev). AI proxy bridge complete via Cloudflare tunnel. Needs: Desktop Electron app, iOS app, professional UI overhaul, MCP reverse engineering. Will be shared with Anker team — must look impressive.' },
    { title: 'Lark Training Cartographer', priority: 'P1', status: 'In Progress', description: '4-session US training curriculum written (Lark doc D1cUdxrjWopL6Kx7gePcQCM9nXc). AI readiness survey created. 20 Knowledge Hub articles + 40 PPs scraped. Training sessions must be SCHEDULED by 2/21. Knox Bot ready as live AI assistant in training group.' },
    { title: 'Gmail Brain', priority: 'P1', status: 'In Progress', description: 'Intelligent Gmail processing at gmail-brain.bartlettlabs.io — LIVE but tokens expired. Needs: OAuth login flow (not admin token), multi-user architecture, Anker-themed professional UI, Desktop + iOS apps. Will be shared with Anker team.' },
    { title: 'DP Team Automation', priority: 'P1', status: 'In Progress', description: 'CPFR automations for demand planning team. Management directive: automate forecasting itself + build validation tool + A2UI dashboards with forecasting buttons/configs. Critical for career advancement.' },
    { title: 'Commerce Shopify', priority: 'P1', status: 'Backlog', description: 'E-commerce via ShopifyNicheApp — Phase 0 complete (70+ files scaffolded). Blocked on external service setup: Supabase, Shopify store, Printful account, API keys.' },

    // P2 — Important, active work
    { title: 'AI LinkedIn Machine', priority: 'P2', status: 'In Progress', description: 'Automated LinkedIn content & phantom persona management. MainUser posting should be close to ready NOW. 6 fake personas per release schedule, each from different locations. STEALTH CRITICAL — LinkedIn bans if detected.' },
    { title: 'WoW Forecast Automation', priority: 'P2', status: 'In Progress', description: 'Week-over-Week forecast automation replacing GAS scripts. Source → Parent → 5 child sheets (Canada, Charging, B2B, Soundcore, Eufy). Knox API approach via gog CLI. Automation schedule: Thu 7AM → Fri 8:30AM → Fri 4AM → 4:30AM → 5AM. Currently GAS handles distribution.' },
    { title: 'Analysis Dashboards (WoW)', priority: 'P2', status: 'In Progress', description: 'Charging WoW dashboard — polished dark theme with Anker branding. Used weekly (Mon/Tue), management approved. Fed by WoW data. Plan: auto-pull from Google Sheets every Tuesday.' },
    { title: 'KDP Book Studio', priority: 'P2', status: 'Review', description: 'Kindle Direct Publishing automation at kdp-book-app.vercel.app. Kyle has 1 book on Amazon (coloring book). Pending: Kyle review of Knox updates, CNAME books → Vercel DNS.' },
    { title: 'LinkedIn Machine', priority: 'P2', status: 'In Progress', description: 'Full LinkedIn automation engine with persona management at /Volumes/Bart_26/Dev_Expansion/Personal/Career/LinkedIn/ai-linkedin-machine. Needs subdomain + desktop app.' },
    { title: 'Alloy Email Automation', priority: 'P2', status: 'In Progress', description: 'Weekly report web scraper works, data processing fails. Knox to automate the data processing part — "way easier than the WoW file shit."' },
    { title: 'Sports Intel Platform', priority: 'P2', status: 'Backlog', description: 'Sports betting intelligence — designed and built, needs launching. Kyle says "could sell the fuck out of this thing." Decision pending: local vs full dashboard + iOS app.' },

    // P3 — Lower priority, in progress
    { title: 'Resume & Job Ops', priority: 'P3', status: 'In Progress', description: 'Resume update + LinkedIn personal page + Job Ops tool. Kyle targeting AI positions at 2x current Anker salary.' },
    { title: 'Portfolio Dashboard', priority: 'P3', status: 'In Progress', description: 'Showcase ALL projects (Anker + Personal + Bartlett Labs) for job applications. MUST blur/redact sensitive Anker data. Kyle needs design help — never built a portfolio before.' },
    { title: 'Remotion Videos', priority: 'P3', status: 'Backlog', description: 'Project demo videos — structure built, needs real dashboard screenshots once projects are further along.' },
    { title: 'Lego-OS', priority: 'P3', status: 'Backlog', description: 'Long-term SaaS vision ($100+/mo). 24/7 AI monitoring for Lego set investment signals. Kyle has ~$2K in sets for resale fall 2026. Project folder empty, notes scattered.' },
    { title: 'DP Chatbot', priority: 'P3', status: 'In Progress', description: 'Demand planning AI chatbot — Knox has checklist, proceeding as needed. Will be shared with Anker team — must be professional.' },
    { title: 'Freelance Tool', priority: 'P3', status: 'Backlog', description: 'Job search tool for freelance platforms. Started fall 2025. Needs review, UI overhaul (web/desktop/iOS, NOT terminal).' },
    { title: 'GitHub Audit', priority: 'P3', status: 'In Progress', description: 'Ongoing review of all repos. Fix bad code across the board.' },

    // P4 — Backlog / nice to have
    { title: 'Franchise Investment Platform', priority: 'P4', status: 'Backlog', description: 'Web app fully built, untested. Launch on bartlettlabs.io + iOS app eventually.' },
    { title: 'Gift Exchange Codex', priority: 'P4', status: 'Backlog', description: '~80% ready, iPhone functions were wrong. Personal use + possible revenue.' },
    { title: 'Image Optimizer', priority: 'P4', status: 'Backlog', description: 'Runs but terrible UX (python dashboard). Kyle would use daily once fixed. Needs desktop/web app.' },
    { title: 'iMessage Kit', priority: 'P4', status: 'Backlog', description: 'LLM responds to personal texts AS Kyle. Runs on iPhone but responses off. Needs proper settings dashboard.' },
    { title: 'YouTube Tutorial Aggregator', priority: 'P4', status: 'In Progress', description: 'Working personal tool. Search topic → aggregate video summaries into single "class." Used often.' },
    { title: 'Masterprompt / Structure Prompt', priority: 'P4', status: 'Backlog', description: 'Project template tools for new AI code users. Needs user-friendly UI. Small fee revenue potential.' },
  ];

  const insertProject = db.prepare('INSERT INTO projects (id, title, priority, status, description) VALUES (?, ?, ?, ?, ?)');
  for (const p of projects) {
    insertProject.run(uuid(), p.title, p.priority, p.status, p.description);
  }

  // ===== PIPELINE / PROSPECTS (Updated 2026-02-20) =====
  const prospects = [
    { business_name: 'Dun-Rite Exteriors', industry: 'Roofing/Exteriors', location: 'Crosby, TX', estimated_value: '$2,500', status: 'Contacted' },
    { business_name: 'Baytown Tire & Auto', industry: 'Auto Services', location: 'Baytown, TX', estimated_value: '$1,800', status: 'Lead' },
    { business_name: 'Crosby Dental Care', industry: 'Healthcare', location: 'Crosby, TX', estimated_value: '$3,500', status: 'Lead' },
    { business_name: 'Huffman Insurance', industry: 'Insurance', location: 'Huffman, TX', estimated_value: '$2,000', status: 'Lead' },
    { business_name: 'Lake Houston HVAC', industry: 'HVAC', location: 'Huffman, TX', estimated_value: '$3,000', status: 'Lead' },
    { business_name: 'Barrett Station BBQ', industry: 'Restaurant', location: 'Crosby, TX', estimated_value: '$1,500', status: 'Lead' },
    { business_name: 'Highlands Plumbing', industry: 'Plumbing', location: 'Highlands, TX', estimated_value: '$2,500', status: 'Lead' },
    { business_name: 'Crosby Fitness Center', industry: 'Fitness', location: 'Crosby, TX', estimated_value: '$2,200', status: 'Lead' },
    { business_name: 'Summit Roofing Co', industry: 'Roofing', location: 'Dallas, TX', estimated_value: '$2,500', status: 'Lead' },
    { business_name: 'Precision Plumbing', industry: 'Plumbing', location: 'Austin, TX', estimated_value: '$3,000', status: 'Lead' },
    { business_name: 'GreenScape Lawns', industry: 'Landscaping', location: 'Fort Worth, TX', estimated_value: '$1,800', status: 'Lead' },
    { business_name: 'Elite Auto Detailing', industry: 'Auto Services', location: 'Houston, TX', estimated_value: '$2,200', status: 'Lead' },
    { business_name: 'BrightSmile Dental', industry: 'Healthcare', location: 'San Antonio, TX', estimated_value: '$5,000', status: 'Lead' },
  ];

  const insertProspect = db.prepare('INSERT INTO pipeline (id, business_name, industry, location, estimated_value, status) VALUES (?, ?, ?, ?, ?, ?)');
  for (const p of prospects) {
    insertProspect.run(uuid(), p.business_name, p.industry, p.location, p.estimated_value, p.status);
  }

  // ===== PROMPTS =====
  const prompts = [
    { title: 'Cold Outreach Email', category: 'Outreach', prompt_text: 'Write a personalized cold outreach email for {business_name} based on their website analysis...', tags: 'email,cold,prospect' },
    { title: 'Code Review Checklist', category: 'Development', prompt_text: 'Review this code for: security vulnerabilities, performance issues, code quality, test coverage...', tags: 'code,review,quality' },
    { title: 'PP Square Submission', category: 'Development', prompt_text: 'Build a Personal Prompt for Anker PP Square that demonstrates practical AI usage for demand planning...', tags: 'anker,pp,leaderboard' },
    { title: 'LinkedIn Content Post', category: 'Content', prompt_text: 'Write a LinkedIn post about AI automation for small businesses. Tone: professional but human, value-first...', tags: 'linkedin,content,social' },
    { title: 'Prospect Research Brief', category: 'Research', prompt_text: 'Research {business_name} in {location}. Find: website quality, social presence, competitors, pain points, AI automation opportunities...', tags: 'research,prospect,scout' },
  ];

  const insertPrompt = db.prepare('INSERT INTO prompts (id, title, prompt_text, category, tags) VALUES (?, ?, ?, ?, ?)');
  for (const p of prompts) {
    insertPrompt.run(uuid(), p.title, p.prompt_text, p.category, p.tags);
  }

  // ===== QUEUE ITEMS (Updated 2026-02-20) =====
  const queueItems = [
    // Kyle's queue — things Kyle needs to do
    { queue_type: 'kyle', title: 'Update Supabase redirect URL for ZipWise', priority: 'P0', requested_by: 'Knox', status: 'Pending' },
    { queue_type: 'kyle', title: 'Review 8 cron-built features: C2 jump-to-week, C2 CSV export (⌘E), JFDI quick-add, JFDI command palette (⌘K), JFDI keyboard shortcuts, ZipWise quick-complete stops, ops seed overhaul x2', priority: 'P1', requested_by: 'Knox', status: 'Pending' },
    { queue_type: 'kyle', title: 'Review Lark Training Curriculum + schedule sessions by 2/21', priority: 'P0', requested_by: 'Knox', status: 'Pending' },
    { queue_type: 'kyle', title: 'Add Knox Bot to Lark training group', priority: 'P1', requested_by: 'Knox', status: 'Pending' },
    { queue_type: 'kyle', title: 'Add Cloudflare CNAME: books → cname.vercel-dns.com', priority: 'P2', requested_by: 'Knox', status: 'Pending' },
    { queue_type: 'kyle', title: 'Set up Reddit + X/Twitter accounts for Bartlett Labs', priority: 'P2', requested_by: 'Kyle', status: 'Pending' },

    // Knox's queue — things Knox needs to do
    { queue_type: 'knox', title: 'Deploy C2 jump-to-week feature to Vercel after Kyle review', priority: 'P1', requested_by: 'Knox', status: 'Pending' },
    { queue_type: 'knox', title: 'Verify Lark card rendering on next AI tips cron fire', priority: 'P2', requested_by: 'Knox', status: 'Pending' },
    { queue_type: 'knox', title: 'Start WoW Week 07 automation if data available', priority: 'P1', requested_by: 'Knox', status: 'Pending' },
    { queue_type: 'knox', title: 'Deploy Scout for new prospect research (Houston/Crosby area)', priority: 'P2', requested_by: 'Knox', status: 'Pending' },
    { queue_type: 'knox', title: 'Deploy Pulse for LinkedIn content creation', priority: 'P2', requested_by: 'Knox', status: 'Pending' },
    { queue_type: 'knox', title: 'Set up C2 CPFR sync cron (every 2h business hours)', priority: 'P1', requested_by: 'Knox', status: 'Done' },
    { queue_type: 'knox', title: 'Alloy email automation — fix data processing script', priority: 'P2', requested_by: 'Knox', status: 'Pending' },
  ];

  const insertQueue = db.prepare('INSERT INTO queues (id, queue_type, title, priority, requested_by, status) VALUES (?, ?, ?, ?, ?, ?)');
  for (const q of queueItems) {
    insertQueue.run(uuid(), q.queue_type, q.title, q.priority, q.requested_by, q.status || 'Pending');
  }

  // ===== AGENT TASKS (Updated 2026-02-20 — Recent deployments) =====
  const agentTasks = [
    // Today's / recent completed tasks
    { agent_name: 'Stack', task_description: 'C2 CPFR Dashboard — static MVP HTML build', status: 'Completed', result_summary: 'Single-file dark-theme HTML with C2W/VC badges, WOS color coding. Build verified.' },
    { agent_name: 'Stack', task_description: 'C2 CPFR — Next.js conversion + Google Sheets API integration', status: 'Completed', result_summary: 'Full app with auto-refresh, discrepancy detection, accept/reject buttons, settings modal, change log.' },
    { agent_name: 'Stack', task_description: 'C2 CPFR — design polish + dynamic column mapping + accept buttons', status: 'Completed', result_summary: 'Sticky header, name-based column discovery, graceful degradation. Deployed to Vercel.' },
    { agent_name: 'Stack', task_description: 'ZipWise code quality sweep (5 tasks)', status: 'Completed', result_summary: '6 commits — planning.tsx decomposed, error boundaries, Sentry, icon/splash, PDF overhaul, login UX.' },
    { agent_name: 'Stack', task_description: 'Auto-Commenter Platform code quality (4 tasks)', status: 'Completed', result_summary: '4 commits — dashboard refactor, env validation, ECDSA keys, lead scoring.' },
    { agent_name: 'Stack', task_description: 'ZipWise auth — login/signup with Supabase', status: 'Completed', result_summary: 'Supabase auth integrated, TS errors fixed. Deployed to zipwise.bartlettlabs.io.' },
    { agent_name: 'Stack', task_description: 'ZipWise onboarding wizard — 9-step flow with Lottie animations', status: 'Completed', result_summary: '17 files, +3,431 lines. Full onboarding wizard built.' },
    { agent_name: 'Stack', task_description: 'JFDI + Ops Dashboard merge — 33 files, 4,700+ lines', status: 'Completed', result_summary: 'New pages: Ops Center (9 sub-tabs), Action Queue (approval inbox), Automations. Deployed to jfdi.bartlettlabs.io.' },
    { agent_name: 'Stack', task_description: 'Gmail Brain assessment', status: 'Completed', result_summary: '6/10 — great QStash pipeline, needs auth + UI overhaul (60-90 hrs).' },
    { agent_name: 'Stack', task_description: 'LarkAgentX assessment', status: 'Completed', result_summary: '6/10 — solid FastAPI backend, 9 days to demo-ready.' },
    { agent_name: 'Stack', task_description: 'ZipWise evaluation + web deploy to Vercel', status: 'Completed', result_summary: '7/10, 70% complete. SSD version is source of truth. Deployed with DNS CNAME + protection toggle.' },
    { agent_name: 'Stack', task_description: 'TuneUp evaluation → merge recommendation', status: 'Completed', result_summary: '8/10 for auto-commenter-platform. Merge TuneUp into it, trash old TuneUp.' },
    { agent_name: 'Scout', task_description: 'Dev folder inventory — 27 project review', status: 'Completed', result_summary: '8 immediately useful, 8 need work, 3 trash.' },
    { agent_name: 'Scout', task_description: 'Clearmud / Muddy-OS research', status: 'Completed', result_summary: 'Marcelo Oliveira (Clearmud LLC) — top OpenClaw power user. Features to steal: voice standups, content cascade, self-improvement nightly cron.' },
    { agent_name: 'Scout', task_description: 'Lark AI Community scraping — Knowledge Hub, PP Square, APPS Platform', status: 'Completed', result_summary: '20 articles, 40+ PPs, 7 channels, 40+ published PAs cataloged. Training curriculum input.' },

    // Overnight cron-built features (2/20 early morning)
    { agent_name: 'Stack', task_description: 'C2 CPFR CSV Export — ⌘E keyboard shortcut + export button (cron-built)', status: 'Completed', result_summary: 'One-click CSV export respecting all active filters. Auto-names file with date + filter. Commit 1fa2b24, awaiting Kyle review.' },
    { agent_name: 'Stack', task_description: 'JFDI Reminders Keyboard Shortcuts — full keyboard nav (cron-built)', status: 'Completed', result_summary: 'j/k navigate, c complete, e edit, s snooze, d delete, n new, ? help. Focus ring + auto-scroll. Commit 149470b, awaiting Kyle review.' },
    { agent_name: 'Stack', task_description: 'Ops Dashboard seed data overhaul — 30 projects, 13 prospects, 15+ tasks (cron-built)', status: 'Completed', result_summary: 'Comprehensive seed update reflecting full PROJECTS-MASTER.md, CLIENT_LIST.md prospects, all recent agent deployments. Commit c56b709.' },
    { agent_name: 'Stack', task_description: 'ZipWise Quick-Complete Stops — tap stop badge to complete visit (cron-built)', status: 'Completed', result_summary: 'Tap stop number badge on StopCard → green checkmark spring animation → undo toast. 3 files (+189/-10 lines). Commit 1c55aab, awaiting Kyle review.' },
  ];

  const insertAgent = db.prepare('INSERT INTO agent_tasks (id, agent_name, task_description, status, result_summary) VALUES (?, ?, ?, ?, ?)');
  for (const a of agentTasks) {
    insertAgent.run(uuid(), a.agent_name, a.task_description, a.status, a.result_summary);
  }

  // ===== ACTIVITY LOG (Updated 2026-02-20 — Recent milestones & events) =====
  const activityEvents = [
    { event_type: 'milestone', title: 'Most productive day ever (2/19)', description: '1,500+ line daily notes, 8 Stack deploys, 3 dashboards built/updated, Lark training curriculum written, 5 autonomous cron features shipped overnight.', source: 'Knox', icon: '🏆' },
    { event_type: 'milestone', title: 'C2 CPFR Dashboard launched', description: 'Anker-C2W Charging CPFR dashboard live at c2.bartlettlabs.io. Mirror sheet architecture, dynamic column mapping, discrepancy detection.', source: 'Stack', icon: '🚀' },
    { event_type: 'milestone', title: 'JFDI + Ops Dashboard merged', description: '33-file, 4,700+ line merge. New: Ops Center (9 sub-tabs), Action Queue (approval inbox), Automations tracker. Deployed to jfdi.bartlettlabs.io.', source: 'Stack', icon: '🔧' },
    { event_type: 'milestone', title: 'Lark Training Curriculum complete', description: '4-session program: AI Ecosystem Intro, Using PAs, Building with MoPA, Advanced Tools. AI readiness survey created. Training group ready.', source: 'Knox', icon: '📚' },
    { event_type: 'milestone', title: 'Knox Bot → Lark Training AI Assistant', description: 'Knox Bot configured to answer @mentions in training group. groupPolicy: open, requireMention: true. Live demo of AI capabilities for trainees.', source: 'Knox', icon: '🤖' },
    { event_type: 'milestone', title: 'ZipWise deployed to Vercel', description: 'Auth + onboarding built. Live at zipwise.bartlettlabs.io. Clients waiting to test.', source: 'Stack', icon: '⚡' },
    { event_type: 'agent_complete', title: 'Stack: ZipWise code quality sweep', description: '6 commits — planning.tsx decomposed, error boundaries, Sentry, PDF overhaul, login UX.', source: 'Stack', icon: '✅' },
    { event_type: 'agent_complete', title: 'Stack: Auto-Commenter code quality', description: '4 commits — dashboard refactor, env validation, ECDSA keys, lead scoring.', source: 'Stack', icon: '✅' },
    { event_type: 'agent_complete', title: 'Scout: Lark AI Community scraping', description: '20 Knowledge Hub articles, 40+ PPs, 7 channels, 40+ PAs cataloged.', source: 'Scout', icon: '🔍' },
    { event_type: 'agent_complete', title: 'Scout: Clearmud/Muddy-OS research', description: 'Top OpenClaw power user researched. Voice standups, content cascade, self-improvement patterns identified.', source: 'Scout', icon: '🔍' },
    { event_type: 'system', title: 'Autonomous cron dev: 8 features shipped (2/19-2/20)', description: 'C2: discrepancy filter, jump-to-week, CSV export (⌘E). JFDI: quick-add, command palette (⌘K), reminders keyboard shortcuts. ZipWise: quick-complete stops. Ops: seed data overhaul. All built + verified, NOT deployed to prod — awaiting Kyle review.', source: 'Cron', icon: '🔄' },
    { event_type: 'system', title: 'C2 CPFR CSV Export built (2/20, 1:22 AM)', description: 'One-click export respects all active filters (category, search, discrepancies). ⌘E shortcut. Auto-names with date + filter. Commit 1fa2b24.', source: 'Cron', icon: '📥' },
    { event_type: 'system', title: 'JFDI Reminders Keyboard Shortcuts (2/20, 3:22 AM)', description: 'Full keyboard-driven triage: j/k navigate, c complete, e edit, s snooze, d delete, n new, ? help. Focus ring + auto-scroll. Commit 149470b.', source: 'Cron', icon: '⌨️' },
    { event_type: 'system', title: 'ZipWise Quick-Complete Stops (2/20, 5:22 AM)', description: 'Tap stop badge to complete visit — green checkmark animation, undo toast, enlarged hit slop for mobile. 3 files changed. Commit 1c55aab.', source: 'Cron', icon: '📱' },
    { event_type: 'system', title: 'Ops Dashboard seed overhaul (2/20, 3:58 AM)', description: '30 projects (was 12), 13 prospects (was 5), 15+ agent tasks (was 2), 16 activity events (was 2). Full PROJECTS-MASTER.md reflected. Commit c56b709.', source: 'Cron', icon: '📊' },
    { event_type: 'system', title: 'Heartbeat OK notifications silenced', description: 'showOk set to false — no more HEARTBEAT_OK spam in Telegram.', source: 'Knox', icon: '🔇' },
    { event_type: 'system', title: '3 cron delivery targets fixed', description: 'Phone numbers replaced with Telegram user ID 8516293230. AI Usage, Social Media, GitHub Push crons now delivering properly.', source: 'Knox', icon: '🔧' },
    { event_type: 'system', title: 'GitHub workspace backup — 298 files', description: 'knox-workspace repo created (PRIVATE). Brain state, daily notes, project docs, assessments, scraped content.', source: 'Knox', icon: '💾' },
    { event_type: 'note', title: 'Kyle #1 in AI usage (group of 200)', description: 'Ranked #82 company-wide. Goal: #1 overall. Strategy: productive tokens, APPS Platform, genuine tooling.', source: 'Kyle', icon: '📊' },
    { event_type: 'system', title: 'Ops Dashboard initialized', description: 'All systems online. 30+ projects tracked, 15 agent tasks logged, 13 queue items active.', source: 'System', icon: '🟢' },
  ];

  const insertActivity = db.prepare("INSERT INTO activity_log (id, event_type, title, description, source, icon, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))");
  activityEvents.forEach((evt, i) => {
    const minutesAgo = `-${(activityEvents.length - i) * 15} minutes`;
    insertActivity.run(uuid(), evt.event_type, evt.title, evt.description, evt.source, evt.icon, minutesAgo);
  });

  // ===== IDEAS (Updated 2026-02-20) =====
  const ideas = [
    { title: 'Knox Command Center', description: 'Real-time visual dashboard — spaceship cockpit for Knox agent operation. Live sub-agent status, cron registry, project tracker, memory bank, revenue pipeline. Dark sci-fi aesthetic.', potential_revenue: 'Personal tool (AI agent orchestration market)', effort: 'M', source: 'Billion $ Ideas Cron', status: 'Evaluating' },
    { title: 'DealFlow AI', description: 'AI-powered missed-call recovery engine for local service businesses. Missed call → AI texts back in 30s → books appointment. Landing page + ROI calculator built.', potential_revenue: '$10M+ ARR by Year 3 (projections)', effort: 'L', source: 'Billion $ Ideas Cron', status: 'Evaluating' },
  ];

  const insertIdea = db.prepare('INSERT INTO ideas (id, title, description, potential_revenue, effort, source, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const i of ideas) {
    insertIdea.run(uuid(), i.title, i.description, i.potential_revenue, i.effort, i.source, i.status);
  }

  // ===== DAILY METRICS (Updated 2026-02-20) =====
  const today = new Date().toISOString().split('T')[0];
  db.prepare('INSERT INTO daily_metrics (id, metric_date, agents_deployed, tasks_completed, prospects_contacted, ideas_logged, active_streak, mood, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(uuid(), today, 0, 4, 0, 0, 2, 'grinding', 'Overnight crons built 3 new features (C2 CSV export, JFDI keyboard shortcuts, ZipWise quick-complete stops) + ops seed overhaul x2. 8 total features awaiting Kyle review. Lark Training deadline tomorrow (2/21). WoW Step 1b fires at 8:30 AM.');

  // Also seed yesterday's metrics (2/19 was the most productive day)
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  db.prepare('INSERT OR IGNORE INTO daily_metrics (id, metric_date, agents_deployed, tasks_completed, prospects_contacted, ideas_logged, active_streak, revenue_closed, mood, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    uuid(), yesterday, 15, 12, 0, 2, 1, 0, 'on-fire',
    'Most productive day ever: C2 CPFR dashboard built & deployed, JFDI+Ops merged, Lark training curriculum, 7 autonomous cron features shipped (2/19 evening + 2/20 overnight), 1500+ line daily notes.'
  );
}
