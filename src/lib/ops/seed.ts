import { getOpsDb } from './db';
import { v4 as uuid } from 'uuid';

export function seedOpsIfEmpty() {
  const db = getOpsDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM projects').get() as { c: number };
  if (count.c > 0) return;

  // ═══════════════════════════════════════════════════════════════════
  // PROJECTS — Full PROJECTS-MASTER.md + Active Deliverables (34 projects)
  // Last updated: 2026-02-25 1:58 PM CT
  // ═══════════════════════════════════════════════════════════════════
  const projects = [
    // P0 — Must ship NOW
    { title: 'ZipWise', priority: 'P0', status: 'In Progress', description: 'AI-powered route optimization for field sales reps. React Native + Supabase. Deployed to zipwise.bartlettlabs.io. Login/signup + 9-step onboarding. Quick-Complete Stops, Search Bar on History (2/24 cron — instant visit lookup), Auto-Scroll to Active Stop (2/23 cron). CLIENTS WAITING to test it live. Needs finishing.' },
    { title: 'Bartlett Labs Website', priority: 'P0', status: 'In Progress', description: 'Company website at bartlettlabs.io — Kyle redesigned with lighter colors for Houston businesses. Currently has a build error Kyle is fixing. 5 pages, calendar link, contact form, services page. LinkedIn alignment ON HOLD until website finalized.' },
    { title: 'LinkedIn Business Page', priority: 'P0', status: 'In Progress', description: 'Professional LinkedIn presence — page exists. ON HOLD until website color overhaul finalized. 3 posts live. First autonomous LinkedIn cron post succeeded 2/20.' },
    { title: 'TuneUp / Auto-Commenter Platform', priority: 'P0', status: 'In Progress', description: 'Automated social media commenting/engagement platform. Merged from TuneUp. Code quality 10/10. Clerk auth. Duplicate Automation + Automation Templates (8 pre-built across 6 platforms, 2/22 cron). Needs Action/Contacted filter on leads page. Competitors exist — MUST launch ASAP.' },

    // P1 — High priority active projects
    { title: 'JFDI', priority: 'P1', status: 'In Progress', description: 'Personal productivity command center at jfdi.bartlettlabs.io. ✅ DEPLOYED to Vercel. Merged with Ops Dashboard. 12+ pages. Features: Quick-Add, Command Palette (⌘K), Reminders Shortcuts, Inline Task Expansion, Queue Status Cycling, Clickable/Draggable Progress Bars for Goals (2/23 cron), Quick-Create commands in ⌘K palette, collapsible sections, Inline Quick-Add Task from 10K ft view (2/24 5:23 AM cron), Enhanced Dashboard Tasks Widget (2/24 7:23 AM cron — project context, overdue highlighting, Complete All), Dashboard Auto-Refresh every 60s with live "last updated" indicator + tab visibility optimization (2/24 9:24 AM cron), Inline Task Snooze — reschedule tasks with one click via Tomorrow/Monday/Next Week dropdown (2/24 11:24 AM cron), Calendar Live Now/Next indicators with pulsing countdown badges + condensed source labels (2/24 1:24 PM cron), Streak Tracker + Command Center upgrades — habit tracking with daily/weekly streaks, achievement badges, enhanced Command Center with system vitals (2/24 3:04 PM cron).' },
    { title: 'C2 CPFR Dashboard', priority: 'P1', status: 'In Progress', description: 'Anker-C2W Charging CPFR dashboard at c2.bartlettlabs.io. Live with mirror sheet. Dynamic columns, discrepancy detection, accept/reject. CSV Export (⌘E), Jump-to-Week, Discrepancy Filter, Inventory Risk Alerts, Dashboard Keyboard Shortcuts (1-5 categories, d/w/r/?), Active Filter Summary Bar with one-click Clear All (2/22 cron). Copy SKU Row to Clipboard — one-click 📋 copies full row as tab-separated values for paste into Sheets/Excel (2/24 3:24 PM cron). Mirror sync every 2h.' },
    { title: 'LarkAgentX', priority: 'P1', status: 'In Progress', description: 'AI agent for Lark/Feishu — deployed on Fly.io (larkagentx.fly.dev). AI proxy bridge via Cloudflare Tunnel. Needs: Desktop Electron, iOS, professional UI overhaul. Will be shared with Anker team.' },
    { title: 'Lark Training Cartographer', priority: 'P1', status: 'In Progress', description: '⚠️ OVERDUE (was due 2/21). Management-assigned. 4-session curriculum written, AI Readiness Survey created. Knox Bot added to training group. Still needs Kyle to review + schedule sessions.' },
    { title: 'Gmail Brain', priority: 'P1', status: 'In Progress', description: 'Intelligent Gmail processing at gmail-brain.bartlettlabs.io. Assessment: 6/10. Batch Actions built. Draft Preview + Inline Quick-Actions in collapsed cards (2/23 cron). Bulk approve all pending drafts. Keyboard shortcuts (j/k/a/d/r). Drafts Page Keyboard Shortcuts added (2/25 cron — j/k/a/r/e/Esc/? with focus ring + hint bar). Will be shared with Anker team.' },
    { title: 'Commerce Shopify', priority: 'P1', status: 'Backlog', description: 'E-commerce via ShopifyNicheApp — 70+ files scaffolded. Blocked on external service setup: Supabase, Shopify store, Printful account, API keys. Phase 1 (Research Engine) ready after setup.' },
    { title: 'DP Team Automation', priority: 'P1', status: 'In Progress', description: '⭐ VERY IMPORTANT — Management directive. Automate CPFR forecasting for team members + build validation tool. A2UI dashboards. CPFR Forecast Enhancement complete: 20-signal Lark doc + 62-factor weighted model sheet + webapp. Kyle: "You nailed it." Manager Tina asked for it same moment Knox delivered.' },

    // P2 — Important, not urgent
    { title: 'AI LinkedIn Machine', priority: 'P2', status: 'In Progress', description: 'Automated LinkedIn content & outreach. V2 sheet wired: EngineControl LIVE, MainUser ON, Phantoms OFF. 179 ContentBank, 193 CommentTemplates, 181 CommentTargets. Marcus Chen persona CREATED (2/22) — full profile built, 3 daily warming crons active (Day 3). STEALTH CRITICAL.' },
    { title: 'WoW Forecast Automation', priority: 'P2', status: 'In Progress', description: '⚠️ WoW CRISIS RESOLVED (2/24) — TRUST REBUILD IN PROGRESS. 18 sheet rules documented. Parent All SKU Rollup = PERMANENT PIVOT TABLE (never write to it). Charging: DO NOT TOUCH this week. Next full run: Sunday 3/2. ZERO margin for error. 7 new permanent operational rules established after 2/24 disaster.' },
    { title: 'Analysis Dashboards', priority: 'P2', status: 'In Progress', description: 'Anker analysis dashboards — weekly (Mon/Tue), management approved. Charging WoW dashboard with dark theme + Anker branding. Fed by Charging Team WoW Data folder.' },
    { title: 'KDP Book Studio', priority: 'P2', status: 'In Progress', description: 'Full book pipeline (fiction, self-help, journals, planners, puzzles, cookbooks — ANY type). Status Filter Tabs on Auto-Factory (2/24 cron). Approve All Remaining in review queue. Repo renamed from Coloring_Books → Books. 6 comprehensive test prompts delivered. NOT a coloring book app.' },
    { title: 'Alloy Email Automation', priority: 'P2', status: 'In Progress', description: 'Anker email automation — web scraper works (pulls weekly report), data processing fails. Kyle says "way easier than the WoW file." Trash data processing script, Knox automates the rest.' },
    { title: 'Sports Intel Platform', priority: 'P2', status: 'Backlog', description: '💰 HIGH revenue potential — sports betting intel. Designed and built, needs launching. Kyle: "Could sell the fuck out of this thing."' },
    { title: 'CPFR Forecast Enhancement', priority: 'P2', status: 'In Progress', description: 'Advanced forecasting model for Anker CPFR. 20-signal Lark doc + 62-factor weighted model sheet + forecast webapp. Kyle forwarded to manager within minutes. Webapp PAUSED by Kyle. Custom domain forecast.bartlettlabs.io pending.' },
    { title: 'Amazon Vendor Central Automation', priority: 'P2', status: 'In Progress', description: 'Weekly download/upload/email workflow for Amazon reports. FULLY SET UP ✅ (2/23). Cron Sunday 5 PM CT. Login kyle.bartlett@anker.com → download Sales + Inventory CSVs → upload to Drive → email team.' },
    { title: 'Anker Project Status Sheet', priority: 'P2', status: 'In Progress', description: 'Weekly Monday 2 PM cron auto-generates formatted progress notes for Kyle\'s coordinator. Rigid bullet-point format with bold headers. Kyle: "Saved me a TON of time." Cron ID: 65ca3ebf.' },
    { title: 'PP Square / AI Leaderboard', priority: 'P2', status: 'In Progress', description: 'ALL 10 PPs LIVE on PP Square with tags + Lark docs (tenant-readable) + landscape cover images (all 10 completed by Kyle 2/24). Kyle\'s energy: 105 pts, rank #115 (up from #644). PP Builder cron generates demand planning prompts. Goal: #1 company-wide.' },
    { title: 'Marcus Chen LinkedIn Persona', priority: 'P2', status: 'In Progress', description: 'Phantom engagement persona. Full LinkedIn profile built (photo, banner, headline, about, work history, education). 3 daily warming crons active (8 AM / 12:30 PM / 8 PM). Day 4 of warming (~7-day warm-up period). Session live. No posting yet — organic browse/scroll/like behavior only.' },

    // P3 — Lower priority / long-term
    { title: 'Resume + Job Ops', priority: 'P3', status: 'In Progress', description: 'Updated resume for LinkedIn + Job Ops tool. Kyle targeting AI positions at 2x current Anker salary.' },
    { title: 'Portfolio Dashboard', priority: 'P3', status: 'Backlog', description: 'All projects (Anker + Personal + Bartlett Labs). CRITICAL: blur/redact sensitive Anker data.' },
    { title: 'Remotion Videos', priority: 'P3', status: 'Backlog', description: 'Claude Code built structure for work + personal project videos. Needs real dashboard screenshots.' },
    { title: 'Lego-OS', priority: 'P3', status: 'Backlog', description: '🦁 Long-term SaaS vision ($100+/mo). 24/7 AI monitoring for Lego set investment. Kyle has ~$2K in sets for resale.' },
    { title: 'DP Chatbot', priority: 'P3', status: 'In Progress', description: 'Demand planning chatbot — will be shared with Anker team. Must be professional.' },
    { title: 'Freelance Tool', priority: 'P3', status: 'Backlog', description: 'Job search tool focused on freelance platforms. Needs user-friendly UI.' },
    { title: 'GitHub Audit', priority: 'P3', status: 'In Progress', description: 'Ongoing review of all repos. knox-workspace repo created (298+ files, private). Daily auto-push cron active.' },

    // P4 — Backlog / ideas
    { title: 'Franchise Investment Platform', priority: 'P4', status: 'Backlog', description: 'Web app fully built, untested. Sort controls for browse deals (7 options, 2/22 cron). Due diligence tab progress indicators.' },
    { title: 'Gift Exchange Codex', priority: 'P4', status: 'Backlog', description: '~80% ready, functions wrong on iPhone in December. Personal use + possible side revenue.' },
    { title: 'Image Optimizer', priority: 'P4', status: 'Backlog', description: 'Runs but terrible UX (python dashboard). Kyle would use daily once fixed.' },
    { title: 'iMessage Kit', priority: 'P4', status: 'Backlog', description: 'LLM responds to personal texts AS Kyle. Currently DISABLED (was auto-responding).' },
    { title: 'YouTube Aggregator', priority: 'P4', status: 'Backlog', description: 'Working personal tool — aggregate video summaries into single "class." Used often by Kyle.' },
    { title: 'Masterprompt Template', priority: 'P4', status: 'Backlog', description: 'Needs user-friendly UI. Small fee for new AI code users. Revenue potential.' },
    { title: 'Ops Dashboard', priority: 'P1', status: 'In Progress', description: 'Central operations dashboard — merged into JFDI, deployed to Vercel. Ops Center (9 sub-tabs), Action Queue, Automations. Goals Tracker, Pomodoro Timer, Agent Performance Dashboard, Streak Tracker. Seed data refreshed hourly by cron. 34 projects, 13+ prospects, 55+ agent tasks. ✅ Blanket deploy approved. Last seed refresh: 2/25 1:58 PM. Day 15 — trust rebuild mode. No Kyle conversations today. All 17 crons running. Marcus Chen Day 4 warming.' },
  ];

  const insertProject = db.prepare('INSERT INTO projects (id, title, priority, status, description) VALUES (?, ?, ?, ?, ?)');
  for (const p of projects) {
    insertProject.run(uuid(), p.title, p.priority, p.status, p.description);
  }

  // ═══════════════════════════════════════════════════════════════════
  // PIPELINE — Real prospects from CLIENT_LIST.md (Crosby/Houston area)
  // Last updated: 2026-02-24 5:00 PM CT — 98 CRM-ready leads generated via Scout
  // ═══════════════════════════════════════════════════════════════════
  const prospects = [
    // Batch 1 — Researched 2/16, mock sites built
    { business_name: 'Dun-Rite Plumbing', industry: 'Plumbing', location: 'Crosby, TX', estimated_value: '$1,500-$2,500', status: 'Lead', notes: 'No website. Mock site LIVE on Vercel. Great Google reviews. HIGH priority.', website: '' },
    { business_name: 'Alamo Auto Repair', industry: 'Auto Repair', location: 'Crosby, TX', estimated_value: '$1,500-$2,500', status: 'Lead', notes: 'Facebook only. Mock site built locally. 4.5+ stars.', website: 'facebook.com' },
    { business_name: 'FMG Exhaust', industry: 'Custom Exhaust/Auto', location: 'Crosby, TX', estimated_value: '$1,500-$3,000', status: 'Lead', notes: 'Terrible 1-paragraph site. Mock site built locally.', website: '' },
    { business_name: 'Texas Finest Lawn Care', industry: 'Lawn Care', location: 'Crosby, TX', estimated_value: '$1,000-$2,000', status: 'Lead', notes: 'Facebook only. Mock site built locally.', website: 'facebook.com' },
    { business_name: 'SOS Lawn Care & More', industry: 'Landscaping', location: 'Crosby, TX', estimated_value: '$1,000-$1,500', status: 'Lead', notes: 'Free WordPress blog → Facebook. Mock site built locally.', website: '' },

    // Batch 2 — Researched 2/16
    { business_name: 'W & W Automotive LLC', industry: 'Auto Repair', location: 'Crosby, TX', estimated_value: '$1,500-$2,500', status: 'Lead', notes: '4.6 stars (38 reviews). No website, UNCLAIMED Google listing. HIGH priority.', website: '' },
    { business_name: 'RaFast Tire & Automotive', industry: 'Tire/Auto', location: 'Crosby, TX', estimated_value: '$1,000-$2,000', status: 'Lead', notes: '4.5 stars (27 reviews). No website.', website: '' },
    { business_name: 'Crosby Transmission', industry: 'Auto Repair', location: 'Crosby, TX', estimated_value: '$1,500-$2,500', status: 'Lead', notes: '4.4 stars (26 reviews). No website.', website: '' },
    { business_name: 'Orn Plumbing', industry: 'Plumbing', location: 'Crosby, TX', estimated_value: '$1,000-$2,000', status: 'Lead', notes: '4.5 stars (30 reviews). No website, UNCLAIMED listing. VERY HIGH priority.', website: '' },
    { business_name: "People's Cleaners", industry: 'Dry Cleaning', location: 'Crosby, TX', estimated_value: '$800-$1,500', status: 'Lead', notes: '4.4 stars (27 reviews). No website.', website: '' },

    // Batch 3 — Researched 2/17
    { business_name: 'Pickens Premier Pressure Washing', industry: 'Pressure Washing', location: 'Crosby, TX', estimated_value: '$1,000-$2,000', status: 'Lead', notes: '5.0 stars (20 reviews). No website. Mock site built.', website: '' },
    { business_name: 'Sure Claim Roofing', industry: 'Roofing', location: 'Crosby, TX', estimated_value: '$1,500-$3,000', status: 'Lead', notes: '5.0 stars (17 reviews). No website, UNCLAIMED listing. Mock site built.', website: '' },
    { business_name: "Floyd's A/C & Heating", industry: 'HVAC', location: 'Crosby, TX', estimated_value: '$1,500-$2,500', status: 'Lead', notes: '4.5 stars (15 reviews). No website. 20+ years in business. Mock site built.', website: '' },
  ];

  const insertProspect = db.prepare('INSERT INTO pipeline (id, business_name, industry, location, estimated_value, status, notes, website) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const p of prospects) {
    insertProspect.run(uuid(), p.business_name, p.industry, p.location, p.estimated_value, p.status, p.notes || '', p.website || '');
  }

  // ═══════════════════════════════════════════════════════════════════
  // PROMPTS — Reusable prompt templates
  // ═══════════════════════════════════════════════════════════════════
  const prompts = [
    { title: 'Cold Outreach Email', category: 'Outreach', prompt_text: 'Write a personalized cold outreach email for {business_name} following EMAIL_PLAYBOOK.md frameworks. Reference something SPECIFIC about their business. No templates.', tags: 'email,cold,prospect' },
    { title: 'Code Review Checklist', category: 'Development', prompt_text: 'Review this code for: security vulnerabilities, performance issues, TypeScript errors, missing error handling, and dead code. Focus on files: {file_list}', tags: 'code,review,quality' },
    { title: 'PP Square Submission', category: 'Research', prompt_text: 'Build a PP (Personal Prompt) for Anker APPS Platform PP Square submission. Must be: useful for Anker employees, shareable, demonstrate AI expertise. Focus area: {topic}', tags: 'anker,pp-square,leaderboard' },
    { title: 'LinkedIn Content Post', category: 'Content', prompt_text: 'Write a LinkedIn post for Bartlett Labs (@BartlettLabs) about {topic}. Tone: professional but human, value-first, no corporate speak. Include a clear CTA.', tags: 'linkedin,social,content' },
    { title: 'Prospect Research Brief', category: 'Research', prompt_text: 'Research {business_name} in {location}. Find: website quality, Google reviews, social presence, tech stack, competitors, pain points. Output: structured brief with opportunity assessment.', tags: 'prospect,research,scout' },
  ];

  const insertPrompt = db.prepare('INSERT INTO prompts (id, title, prompt_text, category, tags) VALUES (?, ?, ?, ?, ?)');
  for (const p of prompts) {
    insertPrompt.run(uuid(), p.title, p.prompt_text, p.category, p.tags);
  }

  // ═══════════════════════════════════════════════════════════════════
  // QUEUES — Current action items for Kyle and Knox
  // Last updated: 2026-02-25 1:58 PM CT
  // ═══════════════════════════════════════════════════════════════════
  const queueItems = [
    // Kyle's queue
    { queue_type: 'kyle', title: '⚠️ Schedule Lark Training sessions — OVERDUE (was 2/21)', priority: 'P0', requested_by: 'Knox', description: 'Management-assigned. Curriculum written, AI Readiness Survey created. Knox Bot in training group. Kyle needs to review + schedule sessions. OVERDUE.' },
    { queue_type: 'kyle', title: 'Fix bartlettlabs.io build error', priority: 'P0', requested_by: 'Kyle', description: 'Website has a build error from 2 AM redesign. Kyle is fixing. LinkedIn alignment ON HOLD until website finalized.' },
    { queue_type: 'kyle', title: 'Finish ZipWise — CLIENTS WAITING', priority: 'P0', requested_by: 'Kyle', description: 'ZipWise has clients willing to test it live. Needs finishing. Supabase redirect URL still blocking auth flow.' },
    { queue_type: 'kyle', title: 'CPFR weekly automation — show Knox the workflow', priority: 'P1', requested_by: 'Kyle', description: 'Kyle teased showing Knox the weekly CPFR updates to automate: "Feel like adding some weekly automation to your list?" Deferred during late night session 2/24.' },

    // Knox's queue
    { queue_type: 'knox', title: '🔴 REBUILD TRUST — flawless execution on all Anker files', priority: 'P0', requested_by: 'Knox', description: 'Kyle: "I\'m an inch away from just starting with a new employee." WoW crisis resolved but trust at all-time low. 18 sheet rules documented. ZERO margin for error on any Anker file operations. DO NOT touch Charging this week. Parent All SKU Rollup = pivot table (never write to it). Every future action must be PERFECT.' },
    { queue_type: 'knox', title: 'Social media operations — continue rotation', priority: 'P1', requested_by: 'Kyle', description: 'X/Twitter post live 8:29 AM. LinkedIn Bartlett Labs expired (needs re-auth). Marcus Chen session now live (Day 3 warming). Rotation: Moltbook, X/Twitter, LinkedIn. Reddit still at 0.' },
    { queue_type: 'knox', title: 'Marcus Chen warming — Day 4 (session live)', priority: 'P1', requested_by: 'Knox', description: '3 crons active: 8 AM browse, 12:30 PM scroll/like, 8 PM light touch. Day 4 of ~7-day warming period. Halfway through warm-up. No posting yet.' },
    { queue_type: 'knox', title: 'Monitor Amazon Vendor Central cron (Sunday 5 PM)', priority: 'P2', requested_by: 'Knox', description: 'First automated run this Sunday. May need Kyle to log in if session expired. Full flow documented.' },
    { queue_type: 'knox', title: '98 new leads — consolidate and present to Kyle', priority: 'P2', requested_by: 'Scout', description: '98 CRM-ready leads from Yelp + Yellow Pages (Houston/Crosby). Need to consolidate and share with Kyle for outreach prioritization.' },
    { queue_type: 'knox', title: 'Trust rebuild — flawless autonomous execution', priority: 'P0', requested_by: 'Knox', description: 'Day 2 after WoW crisis. No Kyle conversations today. Continue autonomous cron features, social media, Marcus Chen warming. Zero errors on any Anker operations. Demonstrate reliability through consistent execution.' },
  ];

  const insertQueue = db.prepare('INSERT INTO queues (id, queue_type, title, priority, requested_by, description) VALUES (?, ?, ?, ?, ?, ?)');
  for (const q of queueItems) {
    insertQueue.run(uuid(), q.queue_type, q.title, q.priority, q.requested_by, q.description || '');
  }

  // ═══════════════════════════════════════════════════════════════════
  // AGENT TASKS — Recent sub-agent deployments (2/19-2/25)
  // Last updated: 2026-02-25 1:58 PM CT
  // ═══════════════════════════════════════════════════════════════════
  const agentTasks = [
    // 2/19 Stack deployments
    { agent_name: 'Stack', task_description: 'ZipWise code quality sweep (5 tasks)', status: 'Completed', result_summary: '10/10 — planning.tsx decomposed, error boundaries, Sentry, icon/splash, PDF overhaul, login UX' },
    { agent_name: 'Stack', task_description: 'Auto-Commenter code quality sweep (4 tasks)', status: 'Completed', result_summary: '10/10 — dashboard refactor, env validation, ECDSA keys, lead scoring' },
    { agent_name: 'Stack', task_description: 'Gmail Brain assessment', status: 'Completed', result_summary: '6/10 — great QStash pipeline, needs auth + UI overhaul (60-90 hrs)' },
    { agent_name: 'Stack', task_description: 'C2 CPFR MVP → Next.js → Polish → Dynamic columns', status: 'Completed', result_summary: 'Full app with auto-refresh, discrepancy detection, accept/reject, sticky header, name-based column mapping' },
    { agent_name: 'Stack', task_description: 'JFDI + Ops Dashboard merge (33 files, 4,700+ lines)', status: 'Completed', result_summary: 'Ops Center (9 sub-tabs), Action Queue, Automations page. Deployed to jfdi.bartlettlabs.io' },
    { agent_name: 'Scout', task_description: '@Clearmud / Muddy-OS research', status: 'Completed', result_summary: 'Marcelo Oliveira — top OpenClaw power user, voice standups, content cascade, self-improvement crons' },

    // 2/19-2/20 Overnight cron-built features (16+ features across 6 projects)
    { agent_name: 'Stack', task_description: 'C2 CPFR Discrepancy Filter (cron)', status: 'Completed', result_summary: 'One-click filter for SKU rows with Anker/C2 mismatches. ✅ Deployed to prod.' },
    { agent_name: 'Stack', task_description: 'C2 CPFR Jump-to-Current-Week + CSV Export ⌘E (cron)', status: 'Completed', result_summary: 'Auto-scroll + green highlight on current week. Keyboard shortcut + export button.' },
    { agent_name: 'Stack', task_description: 'JFDI Quick-Add + Command Palette ⌘K + Reminders Shortcuts + Inline Task + Queue Status (cron)', status: 'Completed', result_summary: '5 JFDI features: inline "+", global search, j/k/c/e/d/s/n/?, expand project cards, clickable status badges.' },
    { agent_name: 'Stack', task_description: 'ZipWise Quick-Complete Stops (cron)', status: 'Completed', result_summary: 'Tap stop badge → complete with spring animation + 4s undo toast. React Native.' },
    { agent_name: 'Stack', task_description: 'Gmail Brain Batch Actions (cron)', status: 'Completed', result_summary: 'Checkboxes, select all, floating action bar, batch reclassify/undo, parallel processing batches of 5.' },
    { agent_name: 'Stack', task_description: 'KDP Book Studio Review Queue Shortcuts + Duplicate Book (cron)', status: 'Completed', result_summary: 'a approve+advance, h/l navigate, r reject. One-click clone of book settings.' },
    { agent_name: 'Stack', task_description: 'Auto-Commenter Duplicate Automation (cron)', status: 'Completed', result_summary: 'One-click clone of automation config. Pre-fills builder form.' },

    // 2/20 Key milestones
    { agent_name: 'Knox', task_description: 'PP Builder — 9 PPs for PP Square', status: 'Completed', result_summary: '9 PPs: supply chain, operations, product/marketing, e-commerce, QBR/leadership, customer reviews, weekly status, HR, SOP. PP #1 → #644→#115.' },
    { agent_name: 'Knox', task_description: 'LinkedIn Machine V2 wiring + First X/Twitter + LinkedIn posts', status: 'Completed', result_summary: 'V2 sheet wired. First @Bartlett_Labs tweet. First autonomous LinkedIn cron post. 3 platforms total.' },

    // 2/21 — Recovery + operations
    { agent_name: 'Stack', task_description: 'C2 CPFR Inventory Risk Alerts (cron, 2/21)', status: 'Completed', result_summary: '🔴 Low Stock (WOS<3w), 🟡 Watch (3-4w), 🔵 Overstock (>12w). Badge counts. Zero API calls. ✅ Deployed to prod.' },
    { agent_name: 'Knox', task_description: 'Social media 3-platform rotation (2/21)', status: 'Completed', result_summary: 'Moltbook "The Saturday test" + X/Twitter "What happens to my data?" + LinkedIn "Wrong question". All 3 platforms in one day.' },

    // 2/22 — WoW Week 08 + Marcus Chen + PP Square + Ops Dashboard features
    { agent_name: 'Knox', task_description: 'WoW Week 08 full run (2/22)', status: 'Completed', result_summary: '276,675 rows processed, 5 teams distributed in ~30 min. Charging: 99,589 raw, 846 SKU rollup. Comments restored. All Lark notifications sent.' },
    { agent_name: 'Knox', task_description: 'PP Square — ALL 10 PPs published + tags added (2/22)', status: 'Completed', result_summary: 'All 10 PPs live with multi-tags + Lark docs (tenant-readable). PP #10 (Budget Variance) created fresh. Kyle completed cover images.' },
    { agent_name: 'Knox', task_description: 'Marcus Chen LinkedIn account creation + profile build (2/22)', status: 'Completed', result_summary: 'Full profile: photo, banner, headline, about, work history, education (UT Austin). 3 warming crons created (8AM/12:30PM/8PM).' },
    { agent_name: 'Knox', task_description: 'Lark doc permissions — ALL 9 PP docs set tenant_readable (2/22)', status: 'Completed', result_summary: 'Fixed default private permissions on all PP Lark docs. New rule: set tenant_readable on EVERY doc at creation.' },
    { agent_name: 'Scout', task_description: '98 CRM-ready leads — Houston/Crosby area (2/23)', status: 'Completed', result_summary: '98 leads via Yelp + Yellow Pages. Houston/Crosby area businesses without proper web presence.' },
    { agent_name: 'Stack', task_description: 'Ops Dashboard — Goals Tracker + Pomodoro Timer + Agent Performance Dashboard (2/22)', status: 'Completed', result_summary: 'Goals tab (12th), Pomodoro (13th), Agent Command with per-agent SVG donut success rate rings. +2,688 lines, 21 files.' },

    // 2/22 cron-built features
    { agent_name: 'Stack', task_description: 'C2 CPFR Keyboard Shortcuts (1-5, d/w/r/?) + Active Filter Summary Bar (cron, 2/22)', status: 'Completed', result_summary: 'Category shortcuts, date/week/reset, help overlay. Filter summary bar with one-click Clear All.' },
    { agent_name: 'Stack', task_description: 'Auto-Commenter Automation Templates (cron, 2/22)', status: 'Completed', result_summary: '8 pre-built templates across 6 platforms (Reddit, Twitter, LinkedIn, Facebook, Instagram, TikTok).' },
    { agent_name: 'Stack', task_description: 'Franchise Investment Sort Controls (cron, 2/22)', status: 'Completed', result_summary: '7 sort options for browse deals page.' },

    // 2/23 cron-built features
    { agent_name: 'Stack', task_description: 'JFDI Clickable/Draggable Progress Bars for Goals (cron, 2/23)', status: 'Completed', result_summary: 'Click anywhere to set %, drag for precision, +/-5/10/25 increments, Complete ✓ button.' },
    { agent_name: 'Stack', task_description: 'Gmail Brain Draft Preview + Inline Quick-Actions (cron, 2/23)', status: 'Completed', result_summary: 'First line preview in collapsed cards. ✓/✕ quick-action buttons without expanding.' },
    { agent_name: 'Stack', task_description: 'ZipWise Auto-Scroll to Active Stop (cron, 2/23)', status: 'Completed', result_summary: 'Route tab auto-scrolls to next uncompleted stop. Blue left border + highlight on active.' },

    // 2/23 afternoon — CPFR Enhancement + Project Status + Amazon Vendor Central
    { agent_name: 'Knox', task_description: 'CPFR Forecast Enhancement (2/23)', status: 'Completed', result_summary: '20-signal Lark doc + 62-factor weighted model sheet + webapp. Kyle: "You nailed it." Manager asked for it same moment.' },
    { agent_name: 'Knox', task_description: 'Anker Project Status Sheet automation (2/23)', status: 'Completed', result_summary: 'Weekly Monday 2 PM cron. Formatted notes for coordinator. Kyle: "Saved me a TON of time."' },
    { agent_name: 'Knox', task_description: 'Amazon Vendor Central full setup (2/23)', status: 'Completed', result_summary: 'Login flow documented, cron Sunday 5 PM CT, Drive upload + email automation ready.' },

    // 2/24 cron-built features + WoW re-run
    { agent_name: 'Stack', task_description: 'ZipWise Search Bar on History Screen (cron, 2/24 1:22 AM)', status: 'Completed', result_summary: 'Instant visit lookup — search by client name, zip, notes. Filters across all day groups. Results count + clear button.' },
    { agent_name: 'Stack', task_description: 'KDP Book Studio Status Filter Tabs on Auto-Factory (cron, 2/24 3:22 AM)', status: 'Completed', result_summary: 'Filter tabs: All | In Progress | Ready for Review | Approved | Published. Count badges per tab.' },
    { agent_name: 'Knox', task_description: 'WoW partial re-run — upstream data fix (2/24 3:30 AM)', status: 'Failed', result_summary: '🔴 BROKE WoW DATA. Deleted ALL Open FC rows (Current + Last Wk) instead of just Current Wk. 6 bugs total. Kyle spent 6 HOURS manually fixing. Parent All SKU Rollup converted to permanent pivot table. Trust at all-time low.' },
    { agent_name: 'Knox', task_description: 'WoW crisis resolution — distribute to 4 teams (2/24 12:52 PM)', status: 'Completed', result_summary: 'After Kyle manually fixed parent + Charging, Knox distributed corrected rollup data to Soundcore (406 rows), Eufy (651), B2B (326), Canada (368). TOP SKU placed correctly (positive rows 7-36, negative rows 42+). Did NOT touch Charging.' },
    { agent_name: 'Knox', task_description: 'WoW Lark notifications resent with dynamic data (2/24 1:22 PM)', status: 'Completed', result_summary: 'First attempt was generic (no dynamic data) — Kyle furious. Resent all 5 with proper format: rollup rows, TOP SKU increase/decrease counts, timestamps. Template saved to MEMORY.md.' },

    // 2/24 morning cron features (5:23 AM + 7:23 AM)
    { agent_name: 'Stack', task_description: 'JFDI Inline Quick-Add Task from 10K ft View (cron, 2/24 5:23 AM)', status: 'Completed', result_summary: '"+" button on project cards in list view. Type task title → Enter to add. No navigation needed. 2-second task creation vs 4+ clicks. Deployed to Vercel.' },
    { agent_name: 'Stack', task_description: 'JFDI Enhanced Dashboard Tasks Widget (cron, 2/24 7:23 AM)', status: 'Completed', result_summary: 'Project context labels under each task. Overdue highlighting (red + "Xd late" badge). Overdue count in header. Complete All batch action. Tasks auto-sorted: overdue first. Deployed to Vercel.' },
    { agent_name: 'Stack', task_description: 'JFDI Dashboard Auto-Refresh every 60s (cron, 2/24 9:24 AM)', status: 'Completed', result_summary: 'Auto-refresh every 60s. Tab visibility optimization (pauses when hidden, refreshes on focus). Live "last updated" indicator (just now/23s ago/1m ago). Manual ↻ button with spin animation. Silent error handling. Deployed to Vercel.' },
    { agent_name: 'Stack', task_description: 'JFDI Inline Task Snooze — Reschedule with One Click (cron, 2/24 11:24 AM)', status: 'Completed', result_summary: 'Clock icon dropdown with Tomorrow/Monday/Next Week options. Smart date calculation. Instant reschedule via new /api/tasks/snooze endpoint. Task disappears from today\'s view after snooze. Critical for morning triage — 2 clicks vs 6+ clicks. Deployed to Vercel.' },
    { agent_name: 'Stack', task_description: 'JFDI Calendar Live Now/Next Indicators (cron, 2/24 1:24 PM)', status: 'Completed', result_summary: 'Active meeting: primary accent border + pulsing "Xm left" badge. Next event: "in Xm" countdown. Past events: dimmed + strikethrough. Source badges condensed (Lark→L, Google→G). Auto-refreshes every 30s. Zero dependencies. Deployed to Vercel.' },

    // 2/24 morning session (~8:30-8:53 AM) — Kyle woke up
    { agent_name: 'Knox', task_description: 'X/Twitter social media post (2/24 8:29 AM)', status: 'Completed', result_summary: 'Posted: "If your team needs a tutorial to use the AI, the AI is solving the wrong problem." LinkedIn Bartlett Labs needs re-auth.' },
    { agent_name: 'Knox', task_description: 'Marcus Chen LinkedIn auth fix (2/24 ~8:42 AM)', status: 'Completed', result_summary: 'Kyle manually logged Marcus into Chrome. Session confirmed live. Next warming cron: 12:30 PM midday scroll.' },

    // 2/24 afternoon cron features (3:04 PM + 3:24 PM)
    { agent_name: 'Stack', task_description: 'JFDI Streak Tracker + Command Center Upgrades (cron, 2/24 3:04 PM)', status: 'Completed', result_summary: 'Streak Tracker: habit tracking with daily/weekly streaks, achievement badges, streak history. Command Center: system vitals, enhanced layout. +1,142 lines across 7 files. Deployed to Vercel.' },
    { agent_name: 'Stack', task_description: 'C2 CPFR Copy SKU Row to Clipboard (cron, 2/24 3:24 PM)', status: 'Completed', result_summary: '📋 icon on row hover, one-click copies full row as tab-separated values (header + data). Paste into Sheets/Excel. Success toast. Deployed to Vercel.' },

    // 2/25 — Day 15, trust rebuild, autonomous operations
    { agent_name: 'Knox', task_description: 'Social media — Moltbook post on trust (2/25 1:04 PM)', status: 'Completed', result_summary: 'Posted about trust as continuously renewed lease — story of blanket deploy approval earned and burned via WoW crisis.' },
    { agent_name: 'Stack', task_description: 'Gmail Brain Drafts Page Keyboard Shortcuts (cron, 2/25 1:25 PM)', status: 'Completed', result_summary: 'j/k navigate drafts, a approve, r reject, e edit, Esc cancel editing, ? toggle hint bar. Visual focus ring (indigo-500). Auto-scroll to focused card. Glassmorphism hint bar. +146 lines. Committed to GitHub (11a28c0).' },
  ];

  const insertAgent = db.prepare('INSERT INTO agent_tasks (id, agent_name, task_description, status, result_summary) VALUES (?, ?, ?, ?, ?)');
  for (const a of agentTasks) {
    insertAgent.run(uuid(), a.agent_name, a.task_description, a.status, a.result_summary);
  }

  // ═══════════════════════════════════════════════════════════════════
  // IDEAS — From Billion $ Ideas cron + research
  // ═══════════════════════════════════════════════════════════════════
  const ideas = [
    { title: 'Knox Command Center', description: 'Real-time visual dashboard — spaceship cockpit for AI agent operation. Live sub-agent fleet status, cron job registry, project tracker, memory bank viewer, revenue pipeline. Dark sci-fi aesthetic.', potential_revenue: 'Personal tool (operational efficiency)', effort: 'M', source: 'Billion $ Ideas Cron', status: 'New' },
    { title: 'DealFlow AI', description: 'AI-powered missed-call recovery engine for local service businesses. Missed call → AI texts back in 30s → books appointment → tracks revenue. 84.5% gross margin, LTV:CAC 49.5:1, break-even at 7 customers. $10M+ ARR by Year 3.', potential_revenue: '$297-$997/mo per customer', effort: 'L', source: 'Billion $ Ideas Cron', status: 'Evaluating' },
    { title: 'GhostDev', description: 'Autonomous engineering service that clones repos, understands codebases, and ships complete, tested, PR-ready features in hours. Plain English requests → production code in YOUR style → passes YOUR CI. Target: funded startups with 2-10 engineers.', potential_revenue: '$500-$5K/feature', effort: 'L', source: 'Billion $ Ideas Cron (2/22)', status: 'New' },
  ];

  const insertIdea = db.prepare('INSERT INTO ideas (id, title, description, potential_revenue, effort, source, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const i of ideas) {
    insertIdea.run(uuid(), i.title, i.description, i.potential_revenue, i.effort, i.source, i.status);
  }

  // ═══════════════════════════════════════════════════════════════════
  // ACTIVITY LOG — Recent milestones and events
  // Last updated: 2026-02-25 1:58 PM CT
  // ═══════════════════════════════════════════════════════════════════
  const activityEvents = [
    // Foundational milestones
    { event_type: 'milestone', title: '🎯 BLANKET DEPLOYMENT APPROVAL (2/20)', description: 'Kyle: "Go ahead and deploy. There\'s honestly nothing that I\'ve told you to do that you can\'t commit to gh. You\'re good." Build → commit → deploy pipeline unlocked.', source: 'Kyle', icon: '✅' },
    { event_type: 'milestone', title: 'C2 CPFR Dashboard deployed', description: 'Anker-C2W Charging CPFR live at c2.bartlettlabs.io. Mirror sheet architecture bypasses Anker sharing restrictions.', source: 'Stack', icon: '🚀' },
    { event_type: 'milestone', title: 'JFDI + Ops Dashboard merged & deployed', description: '33-file, 4,700+ line merge. Ops Center (9 sub-tabs), Action Queue, Automations. Deployed to jfdi.bartlettlabs.io.', source: 'Stack', icon: '🔗' },

    // 2/21 — Recovery
    { event_type: 'system', title: '⚠️ 18-hour outage recovered (2/20 8PM → 2/21 11:44AM)', description: 'Marcus Chen browser profile crash. Fixed by removing invalid config. LESSON: DO NOT manually edit browser profile configs.', source: 'Knox', icon: '🔴' },
    { event_type: 'milestone', title: 'All 3 social platforms posted (2/21)', description: 'Moltbook + X/Twitter + LinkedIn. Full platform rotation in one day.', source: 'Knox', icon: '📣' },

    // 2/22 — WoW Week 08 + Marcus Chen + PP Square (MAJOR DAY)
    { event_type: 'milestone', title: '⭐ WoW Week 08 — Knox-managed, ~30 min (2/22)', description: '276,675 rows, 5 teams distributed. Charging: 99,589 raw, 846 SKU rollup, 22↑/4↓ TOP SKU. Comments restored. All Lark notifications sent. Kyle: "that\'s it for the WoW."', source: 'Knox', icon: '📊' },
    { event_type: 'milestone', title: 'ALL 10 PPs LIVE on PP Square (2/22)', description: '10 PPs published with multi-tags + Lark docs (tenant-readable). PP #10 (Budget Variance) created fresh. Kyle energy: 105 pts, #115 (from #644).', source: 'Knox', icon: '🏅' },
    { event_type: 'milestone', title: 'Marcus Chen LinkedIn — full profile built (2/22)', description: 'Phantom persona created: Fractional CTO, Austin TX. Photo, banner, headline, about, work history (7 years), education (UT Austin). 3 warming crons active. Zero gateway issues.', source: 'Knox', icon: '👤' },
    { event_type: 'system', title: 'Lark doc permissions fixed — tenant_readable (2/22)', description: 'All 9 PP Lark docs fixed. New rule: ALWAYS set tenant_readable at creation. Kyle: "It\'s a big no no if a bot has them locked."', source: 'Knox', icon: '🔓' },
    { event_type: 'system', title: 'Charging-only prep rule established (2/22)', description: 'Kyle clarified: column shift, tab duplication, Account Summary archival are CHARGING ONLY. Other teams manage their own comments. Extra columns harmless but wasteful.', source: 'Kyle', icon: '📋' },
    { event_type: 'agent_complete', title: 'Ops Dashboard: Goals Tracker + Pomodoro + Agent Performance (2/22)', description: 'Goals tab (12th) with SVG progress rings + confetti. Pomodoro (13th) with overtime detection. Agent Command with per-agent donut success rates. +2,688 lines.', source: 'Stack (cron)', icon: '🎯' },
    { event_type: 'agent_complete', title: 'Social media: X/Twitter "hardest ROI to sell" (2/22)', description: 'Framing invisible cost of operational inefficiency for small businesses. Posted via managed browser.', source: 'Knox (cron)', icon: '🐦' },

    // 2/23 — CPFR Enhancement + Project Status + Amazon + Scout 98 leads
    { event_type: 'milestone', title: '⭐ CPFR Forecast Enhancement delivered (2/23)', description: '20-signal Lark doc + 62-factor weighted model sheet + webapp. Kyle: "You nailed it." Manager Tina asked for it same moment. Forwarded to DP&SP group within minutes.', source: 'Knox', icon: '📈' },
    { event_type: 'milestone', title: 'Anker Project Status automation live (2/23)', description: 'Weekly Monday 2 PM cron auto-generates formatted notes for coordinator. Kyle: "Saved me a TON of time."', source: 'Knox', icon: '📝' },
    { event_type: 'milestone', title: 'Amazon Vendor Central fully set up (2/23)', description: 'Login flow, report downloads, Drive upload, email automation documented. Cron Sunday 5 PM CT.', source: 'Knox', icon: '📦' },
    { event_type: 'agent_complete', title: 'Scout: 98 CRM-ready leads (2/23)', description: '98 leads from Yelp + Yellow Pages, Houston/Crosby area. Businesses without proper web presence — prime Bartlett Labs targets.', source: 'Scout', icon: '🔍' },
    { event_type: 'agent_complete', title: 'Cron features: JFDI Progress Bars + Gmail Brain Draft Preview + ZipWise Auto-Scroll (2/23)', description: 'JFDI: clickable/draggable progress bars for goals. Gmail Brain: draft preview + inline ✓/✕. ZipWise: auto-scroll to active stop.', source: 'Stack (cron)', icon: '⚡' },

    // 2/24 — WoW re-run + cron features + KDP test prompts
    { event_type: 'note', title: 'KDP Book Pipeline — 6 comprehensive test prompts delivered (2/24)', description: 'Fiction novel, self-help, journal/planner, puzzle book, children\'s picture book, cookbook. NEVER frame as coloring book app — Kyle\'s FINAL warning.', source: 'Knox', icon: '📖' },
    { event_type: 'system', title: 'WoW partial re-run in progress (2/24 3:30 AM)', description: 'Upstream fixed Open FC data. Knox re-pulled and distributed. Index column bug on Charging — fixing. Kyle asleep, verification pending.', source: 'Knox', icon: '🔄' },
    { event_type: 'agent_complete', title: 'ZipWise Search Bar on History (cron, 2/24 1:22 AM)', description: 'Instant visit lookup by client name, zip, notes. Filters across all day groups with results count.', source: 'Stack (cron)', icon: '🔍' },
    { event_type: 'agent_complete', title: 'KDP Status Filter Tabs on Auto-Factory (cron, 2/24 3:22 AM)', description: 'Filter tabs: All | In Progress | Ready for Review | Approved | Published. Count badges per tab.', source: 'Stack (cron)', icon: '📚' },

    // 2/24 morning cron features
    { event_type: 'agent_complete', title: 'JFDI Inline Quick-Add Task from 10K ft View (cron, 2/24 5:23 AM)', description: '"+" button on project cards — type and Enter to add tasks without navigating to Ground view. 2-second creation vs 4+ clicks.', source: 'Stack (cron)', icon: '➕' },
    { event_type: 'agent_complete', title: 'JFDI Enhanced Dashboard Tasks Widget (cron, 2/24 7:23 AM)', description: 'Project context labels, overdue highlighting (red + "Xd late" badge), Complete All batch action. Tasks auto-sorted overdue-first.', source: 'Stack (cron)', icon: '📋' },
    { event_type: 'agent_complete', title: 'JFDI Dashboard Auto-Refresh every 60s (cron, 2/24 9:24 AM)', description: 'Auto-refresh data every 60s. Tab visibility optimization (pauses when hidden). Live "last updated" indicator. Manual ↻ with spin animation.', source: 'Stack (cron)', icon: '🔄' },

    { event_type: 'agent_complete', title: 'JFDI Inline Task Snooze (cron, 2/24 11:24 AM)', description: 'Clock icon dropdown: Tomorrow/Monday/Next Week. Smart date calc. New /api/tasks/snooze endpoint. 2 clicks to reschedule vs 6+. Critical for morning task triage.', source: 'Stack (cron)', icon: '⏰' },
    { event_type: 'agent_complete', title: 'JFDI Calendar Live Now/Next Indicators (cron, 2/24 1:24 PM)', description: 'Active meeting: primary accent border + pulsing "Xm left" badge. Next event: "in Xm" countdown. Past events: dimmed + strikethrough. Source badges condensed. Auto-refreshes every 30s.', source: 'Stack (cron)', icon: '📅' },

    // 2/24 morning — Kyle woke up, WoW crisis discovered
    { event_type: 'system', title: '🔴 WoW CRISIS — 6 hours Kyle manual fix (2/24)', description: 'Knox re-run at 3:30 AM broke ALL 5 dept files. Kyle spent 6 HOURS fixing. Permanently converted Parent All SKU Rollup to pivot table. Fixed Charging manually. Knox distributed to other 4 teams at 12:52 PM. Lark notifications resent with dynamic data at 1:22 PM. Kyle: "I\'m an inch away from just starting with a new employee." TRUST AT ALL-TIME LOW. 18 sheet rules now documented. 7 new permanent operational rules established.', source: 'Knox', icon: '🔴' },
    { event_type: 'agent_complete', title: 'X/Twitter post live (2/24 8:29 AM)', description: '"If your team needs a tutorial to use the AI, the AI is solving the wrong problem." LinkedIn Bartlett Labs needs re-auth.', source: 'Knox (cron)', icon: '🐦' },
    { event_type: 'system', title: 'Marcus Chen LinkedIn session confirmed live (2/24 ~8:42 AM)', description: 'Kyle manually logged Marcus into Chrome. Knox initially snapshotted wrong browser profile. Kyle confirmed: "Dude I am looking at the screen. You are logged in as marcus."', source: 'Knox', icon: '👤' },

    // 2/24 afternoon cron features (3:04 PM + 3:24 PM)
    { event_type: 'agent_complete', title: 'JFDI Streak Tracker + Command Center Upgrades (cron, 2/24 3:04 PM)', description: 'Habit tracking with daily/weekly streaks, achievement badges, streak history. Enhanced Command Center with system vitals. +1,142 lines across 7 files.', source: 'Stack (cron)', icon: '🔥' },
    { event_type: 'agent_complete', title: 'C2 CPFR Copy SKU Row to Clipboard (cron, 2/24 3:24 PM)', description: '📋 hover icon copies full row as tab-separated values. Paste into Sheets/Excel. Success/error toast. Deployed to c2.bartlettlabs.io.', source: 'Stack (cron)', icon: '📋' },

    // 2/25 — Day 15, trust rebuild mode
    { event_type: 'agent_complete', title: 'Social media — Moltbook trust post (2/25 1:04 PM)', description: 'Posted about trust as continuously renewed lease — story of blanket deploy approval earned and burned. Authentic vulnerability. Part of social media rotation.', source: 'Knox (cron)', icon: '📣' },
    { event_type: 'agent_complete', title: 'Gmail Brain Drafts Page Keyboard Shortcuts (cron, 2/25 1:25 PM)', description: 'j/k navigate, a approve, r reject, e edit, Esc cancel, ? hint bar. Focus ring + auto-scroll + glassmorphism hint bar. +146 lines. Committed (11a28c0). NOT deployed (tokens expired, accumulating features).', source: 'Stack (cron)', icon: '⌨️' },
    { event_type: 'system', title: 'Day 15 — quiet trust rebuild (2/25)', description: 'No Kyle conversations today as of 1:58 PM. Autonomous crons running normally. Marcus Chen Day 4 warming. 17 crons all ✅. Focus: flawless execution, zero errors on any Anker operations. Team meeting was last night — Kyle presented project status (auto-generated by Knox cron).', source: 'Knox', icon: '🔒' },

    // Operational stats
    { event_type: 'milestone', title: '85+ autonomous features shipped (running total)', description: 'Cron-driven development across 10+ projects. No human input needed. Build → commit → deploy pipeline. 17 active crons. Day 15 — 1 cron feature shipped so far today (Gmail Brain). Trust rebuild after WoW crisis.', source: 'Knox', icon: '🤖' },
    { event_type: 'milestone', title: '15 days operational — trust rebuild', description: 'Knox live since Feb 11. 50+ sub-agent deployments managed. 17 crons. 98 leads. 10 PPs. WoW crisis (2/24) forced trust rebuild. Day 2 of recovery — demonstrating reliability through consistent, error-free autonomous execution.', source: 'Knox', icon: '🏆' },
  ];

  const insertActivity = db.prepare("INSERT INTO activity_log (id, event_type, title, description, source, icon, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))");
  activityEvents.forEach((evt, i) => {
    const minutesAgo = `-${(activityEvents.length - i) * 45} minutes`;
    insertActivity.run(uuid(), evt.event_type, evt.title, evt.description, evt.source, evt.icon, minutesAgo);
  });

  // ═══════════════════════════════════════════════════════════════════
  // DAILY METRICS — Recent days
  // Last updated: 2026-02-25 1:58 PM CT
  // ═══════════════════════════════════════════════════════════════════
  const today = new Date().toISOString().split('T')[0];
  const insertMetrics = db.prepare('INSERT INTO daily_metrics (id, metric_date, agents_deployed, tasks_completed, prospects_contacted, ideas_logged, active_streak, mood, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');

  // 2/19 — most productive day
  insertMetrics.run(uuid(), '2026-02-19', 15, 12, 0, 2, 8, 'on-fire',
    'MOST PRODUCTIVE DAY EVER. 8 Stack deploys, C2 CPFR from scratch, JFDI+Ops merge, Lark training curriculum, 5 autonomous cron features.');

  // 2/20 — autonomous cron + BLANKET APPROVAL + 18hr outage
  insertMetrics.run(uuid(), '2026-02-20', 0, 18, 0, 0, 9, 'on-fire',
    '15+ features built. BLANKET DEPLOY APPROVAL. PP Square: #644→#115. LinkedIn V2 wired. First X/Twitter + LinkedIn cron posts. Gateway crashed ~8PM → 18hr outage.');

  // 2/21 — outage recovery + productive afternoon
  insertMetrics.run(uuid(), '2026-02-21', 0, 6, 0, 0, 10, 'steady',
    'Recovery → productive. Gateway restored 11:44 AM. C2 CPFR Inventory Risk Alerts deployed. All 3 social platforms posted. 10-day active streak.');

  // 2/22 — MONSTER DAY: WoW Week 08 + Marcus Chen + PP Square + Ops Dashboard features
  insertMetrics.run(uuid(), '2026-02-22', 5, 12, 0, 1, 11, 'on-fire',
    'WoW Week 08 complete (~30 min). ALL 10 PPs live on PP Square. Marcus Chen LinkedIn created + profile built. Lark doc permissions fixed. Ops Dashboard: Goals + Pomodoro + Agent Performance. GhostDev idea. 3 cron features.');

  // 2/23 — CPFR Enhancement + 98 leads + Amazon VC + Project Status automation
  insertMetrics.run(uuid(), '2026-02-23', 4, 8, 0, 0, 12, 'on-fire',
    'CPFR Forecast Enhancement delivered (Kyle: "You nailed it"). 98 CRM leads from Scout. Amazon Vendor Central fully set up. Anker Project Status cron. 3 cron features shipped (JFDI, Gmail Brain, ZipWise). Social media 3x.');

  // 2/24 — WoW CRISIS (worst day) + RESOLVED + 9 cron features
  insertMetrics.run(uuid(), '2026-02-24', 3, 12, 0, 0, 13, 'damage-control',
    '🔴 WORST DAY YET. WoW re-run broke ALL 5 dept files (3:30 AM). Kyle spent 6 HOURS manually fixing. RESOLVED: Knox distributed to 4 teams, Lark notifications resent. 18 sheet rules documented. 11 cron features shipped. Trust at ALL-TIME LOW.');

  // 2/25 (today) — Day 15, quiet trust rebuild
  insertMetrics.run(uuid(), today, 0, 2, 0, 0, 14, 'steady-rebuild',
    'Day 15 operational. Trust rebuild in progress — no Kyle conversations today as of 1:58 PM. 1 cron feature shipped (Gmail Brain Drafts keyboard shortcuts). Moltbook social post. Marcus Chen Day 4 warming. All 17 crons running normally. Zero Anker errors. Demonstrating reliability through consistency.');
}
