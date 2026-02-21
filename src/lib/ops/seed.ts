import { getOpsDb } from './db';
import { v4 as uuid } from 'uuid';

export function seedOpsIfEmpty() {
  const db = getOpsDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM projects').get() as { c: number };
  if (count.c > 0) return;

  // ═══════════════════════════════════════════════════════════════════
  // PROJECTS — Full PROJECTS-MASTER.md + Active Deliverables (30 projects)
  // Last updated: 2026-02-20 5:58 PM CT
  // ═══════════════════════════════════════════════════════════════════
  const projects = [
    // P0 — Must ship NOW
    { title: 'ZipWise', priority: 'P0', status: 'In Progress', description: 'AI-powered route optimization for field sales reps. React Native + Supabase. Deployed to zipwise.bartlettlabs.io. Login/signup + 9-step onboarding wizard built. Quick-Complete Stops feature built overnight (2/20) — tap badge to complete visit with spring animation + undo toast. Clients waiting to test. MUST LAUNCH THIS WEEK — competitors are live. Blocked: Kyle needs to update Supabase redirect URL.' },
    { title: 'Bartlett Labs Website', priority: 'P0', status: 'In Progress', description: 'Company website at bartlettlabs.io — deployed to Vercel. Needs content + polish to be client-ready. First impression for all prospects.' },
    { title: 'LinkedIn Business Page', priority: 'P0', status: 'In Progress', description: 'Professional LinkedIn presence — page exists, needs content populated. Browser config fixed (efficient mode) for LinkedIn admin access. Critical for credibility.' },
    { title: 'TuneUp / Auto-Commenter Platform', priority: 'P0', status: 'In Progress', description: 'Automated social media commenting/engagement platform. Merging TuneUp into auto-commenter-platform codebase. Code quality sweep complete (10/10). Clerk auth integrated. Duplicate Automation feature built (2/20 5:22 PM) — one-click clone of automation configs. Competitors exist — MUST launch ASAP.' },

    // P1 — High priority active projects
    { title: 'JFDI', priority: 'P1', status: 'In Progress', description: 'Personal productivity command center at jfdi.bartlettlabs.io. Merged with Ops Dashboard (33 files, 4,700+ lines). 12 pages including Ops Center, Action Queue, Automations. Cron-built features awaiting review: Quick-Add, Command Palette (⌘K), Reminders Keyboard Shortcuts (j/k/c/e/s/d/n/?), Inline Task Expansion (expand project cards to see/edit tasks without page navigation). 13 features total across all projects.' },
    { title: 'C2 CPFR Dashboard', priority: 'P1', status: 'Review', description: 'Anker-C2W Charging CPFR collaboration dashboard at c2.bartlettlabs.io. Live with mirror sheet architecture (bypasses Anker sharing restrictions). Dynamic column mapping, discrepancy detection, accept/reject system. Cron-built: CSV Export (⌘E), Jump-to-Current-Week. 12 UI improvements deployed 2/19. Mirror sync running every 2h during business hours.' },
    { title: 'LarkAgentX', priority: 'P1', status: 'In Progress', description: 'AI agent for Lark/Feishu — deployed on Fly.io (larkagentx.fly.dev). AI proxy bridge via Cloudflare Tunnel complete. Needs: Desktop Electron app, iOS app, professional UI overhaul, MCP reverse engineering. Will be shared with Anker team — MUST look professional.' },
    { title: 'Lark Training Cartographer', priority: 'P1', status: 'In Progress', description: '⚠️ DEADLINE TOMORROW (2/21) — Management-assigned task. Train US Anker employees on Lark/AI tools. 4-session curriculum written (Lark doc D1cUdxrjWopL6Kx7gePcQCM9nXc). AI Readiness Survey created. Scraped 20 Knowledge Hub articles + 40+ PAs + 9 Feishu docs. Knox Bot ready for training group. Kyle briefed at 5:22 PM — one of 3 action items flagged.' },
    { title: 'Gmail Brain', priority: 'P1', status: 'In Progress', description: 'Intelligent Gmail processing at gmail-brain.bartlettlabs.io. Assessment: 6/10 — great QStash pipeline, needs auth + UI overhaul (60-90 hrs). Batch Actions feature built overnight (2/20) — checkboxes, select all per section (Work/Personal), floating dark action bar, batch reclassify/undo, parallel processing in batches of 5. Will be shared with Anker team.' },
    { title: 'Commerce Shopify', priority: 'P1', status: 'Backlog', description: 'E-commerce via ShopifyNicheApp — 70+ files scaffolded. Blocked on external service setup: Supabase, Shopify store, Printful account, API keys. Phase 1 (Research Engine) ready after setup.' },
    { title: 'DP Team Automation', priority: 'P1', status: 'In Progress', description: '⭐ VERY IMPORTANT — Management directive. Automate CPFR forecasting for team members + build validation tool. A2UI dashboards for visual impact. Current: auto-pulls manual work, users still forecast manually. Next: automate the forecasting itself.' },

    // P2 — Important, not urgent
    { title: 'AI LinkedIn Machine', priority: 'P2', status: 'In Progress', description: 'Automated LinkedIn content & outreach. In development since Sep 2025. 6 fake personas planned per release schedule. STEALTH CRITICAL — LinkedIn will ban if detected. MainUser automatic posting needs to start NOW. Needs bartlettlabs.io subdomain + desktop app.' },
    { title: 'WoW Forecast Automation', priority: 'P2', status: 'In Progress', description: 'Week-over-Week forecast automation. Knox approach: skip GAS entirely, use gog CLI + Google Sheets API. 4-phase process documented. 5 team child sheets. GAS scripts still handle distribution (Knox automation not live yet). WoW Week 07 Step 1b fired today (Fri 2/20) at 8:30 AM via GAS. DATA_WEEK_NUMBER may need update from 5 to 7.' },
    { title: 'Analysis Dashboards', priority: 'P2', status: 'In Progress', description: 'Anker analysis dashboards — currently used weekly (Mon/Tue), management approved. Charging WoW dashboard with dark theme + Anker branding. Fed by Charging Team WoW Data folder. Automation plan: pull from Google Sheets every Tuesday.' },
    { title: 'KDP Book Studio', priority: 'P2', status: 'In Progress', description: 'Kindle Direct Publishing automation at kdp-book-app.vercel.app. Kyle has one book on Amazon KDP. 2 cron features built 2/20: Review Queue Keyboard Shortcuts (a approve+advance, h/l navigate, r reject, g regenerate) + Duplicate Book (one-click clone of book settings). Pending CNAME: books.bartlettlabs.io.' },
    { title: 'Alloy Email Automation', priority: 'P2', status: 'In Progress', description: 'Anker email automation — web scraper works (pulls weekly report), data processing fails. Kyle says "way easier than the WoW file shit." Trash data processing script, Knox automates the rest.' },
    { title: 'Sports Intel Platform', priority: 'P2', status: 'Backlog', description: '💰 HIGH revenue potential — sports betting intel, team following. Designed and built, needs launching. Kyle: "Could sell the fuck out of this thing." Decision pending: local vs full dashboard + iOS app.' },

    // P3 — Lower priority / long-term
    { title: 'Resume + Job Ops', priority: 'P3', status: 'In Progress', description: 'Updated resume for LinkedIn + Job Ops tool. Kyle targeting AI positions at 2x current Anker salary. Portfolio + Resume + LinkedIn = job search pipeline.' },
    { title: 'Portfolio Dashboard', priority: 'P3', status: 'Backlog', description: 'All projects (Anker + Personal + Bartlett Labs). CRITICAL: blur/redact sensitive Anker data — IT tracks closely, termination risk. Attached to all future resumes for job applications.' },
    { title: 'Remotion Videos', priority: 'P3', status: 'Backlog', description: 'Claude Code built structure for work + personal project videos. Needs real dashboard screenshots once projects are further along.' },
    { title: 'Lego-OS', priority: 'P3', status: 'Backlog', description: '🦁 Long-term SaaS vision ($100+/mo). 24/7 AI monitoring for Lego set investment. Kyle has ~$2K in sets for resale (fall 2026 - 4 years out). "GOING TO BE A BEAST."' },
    { title: 'DP Chatbot', priority: 'P3', status: 'In Progress', description: 'Demand planning chatbot — Knox has checklist items. Will be shared with Anker team — must be professional.' },
    { title: 'Freelance Tool', priority: 'P3', status: 'Backlog', description: 'Job search tool focused on freelance platforms. Started fall 2025. Needs user-friendly UI (web/desktop/iOS, NOT terminal-only).' },
    { title: 'GitHub Audit', priority: 'P3', status: 'In Progress', description: 'Ongoing review of all repos — fix bad code across the board. knox-workspace repo created (298+ files, private). Daily auto-push cron active.' },

    // P4 — Backlog / ideas
    { title: 'Franchise Investment Platform', priority: 'P4', status: 'Backlog', description: 'Web app fully built, untested. Launch on bartlettlabs.io + iOS app.' },
    { title: 'Gift Exchange Codex', priority: 'P4', status: 'Backlog', description: '~80% ready, functions were wrong on iPhone in December. Personal use + possible side revenue.' },
    { title: 'Image Optimizer', priority: 'P4', status: 'Backlog', description: 'Runs but terrible UX (python dashboard). Kyle would use daily once fixed. Needs desktop/web app.' },
    { title: 'iMessage Kit', priority: 'P4', status: 'Backlog', description: 'LLM responds to personal texts AS Kyle. Runs on iPhone, responses not right. Currently DISABLED (was auto-responding).' },
    { title: 'YouTube Aggregator', priority: 'P4', status: 'Backlog', description: 'Working personal tool — search topic → aggregate video summaries into single "class." Used often by Kyle.' },
    { title: 'Masterprompt Template', priority: 'P4', status: 'Backlog', description: 'Needs user-friendly UI. Small fee for new AI code users. Revenue potential with proper packaging.' },
    { title: 'Ops Dashboard', priority: 'P1', status: 'In Progress', description: 'Central operations dashboard — merged into JFDI. Ops Center (9 sub-tabs), Action Queue, Automations page. Seed data refreshed hourly with latest project states, prospects, agent tasks, activity events. Activity Timeline, Command Center with animated counters + donut chart + pipeline funnel. 30 projects, 13 prospects, 23 agent tasks tracked. 7 seed refreshes today alone.' },
  ];

  const insertProject = db.prepare('INSERT INTO projects (id, title, priority, status, description) VALUES (?, ?, ?, ?, ?)');
  for (const p of projects) {
    insertProject.run(uuid(), p.title, p.priority, p.status, p.description);
  }

  // ═══════════════════════════════════════════════════════════════════
  // PIPELINE — Real prospects from CLIENT_LIST.md (Crosby/Houston area)
  // Last updated: 2026-02-20 09:58 AM CT
  // ═══════════════════════════════════════════════════════════════════
  const prospects = [
    // Batch 1 — Researched 2/16, mock sites built
    { business_name: 'Dun-Rite Plumbing', industry: 'Plumbing', location: 'Crosby, TX', estimated_value: '$1,500-$2,500', status: 'Lead', notes: 'No website. Mock site LIVE on Vercel. Great Google reviews. HIGH priority.', website: '' },
    { business_name: 'Alamo Auto Repair', industry: 'Auto Repair', location: 'Crosby, TX', estimated_value: '$1,500-$2,500', status: 'Lead', notes: 'Facebook only. Mock site built locally. 4.5+ stars, "reasonable prices, fast."', website: 'facebook.com' },
    { business_name: 'FMG Exhaust', industry: 'Custom Exhaust/Auto', location: 'Crosby, TX', estimated_value: '$1,500-$3,000', status: 'Lead', notes: 'Terrible 1-paragraph site. Mock site built locally. "Honest, quality work."', website: '' },
    { business_name: 'Texas Finest Lawn Care', industry: 'Lawn Care', location: 'Crosby, TX', estimated_value: '$1,000-$2,000', status: 'Lead', notes: 'Facebook only. Mock site built locally. "Professional, beautiful."', website: 'facebook.com' },
    { business_name: 'SOS Lawn Care & More', industry: 'Landscaping', location: 'Crosby, TX', estimated_value: '$1,000-$1,500', status: 'Lead', notes: 'Free WordPress blog → Facebook. Mock site built locally.', website: '' },

    // Batch 2 — Researched 2/16
    { business_name: 'W & W Automotive LLC', industry: 'Auto Repair', location: 'Crosby, TX', estimated_value: '$1,500-$2,500', status: 'Lead', notes: '4.6 stars (38 reviews). No website, UNCLAIMED Google listing. HIGH priority.', website: '' },
    { business_name: 'RaFast Tire & Automotive', industry: 'Tire/Auto', location: 'Crosby, TX', estimated_value: '$1,000-$2,000', status: 'Lead', notes: '4.5 stars (27 reviews). No website.', website: '' },
    { business_name: 'Crosby Transmission', industry: 'Auto Repair', location: 'Crosby, TX', estimated_value: '$1,500-$2,500', status: 'Lead', notes: '4.4 stars (26 reviews). No website. Competitor at same address HAS one.', website: '' },
    { business_name: 'Orn Plumbing', industry: 'Plumbing', location: 'Crosby, TX', estimated_value: '$1,000-$2,000', status: 'Lead', notes: '4.5 stars (30 reviews). No website, UNCLAIMED listing. VERY HIGH priority.', website: '' },
    { business_name: "People's Cleaners", industry: 'Dry Cleaning', location: 'Crosby, TX', estimated_value: '$800-$1,500', status: 'Lead', notes: '4.4 stars (27 reviews). No website. Owner responds to reviews.', website: '' },

    // Batch 3 — Researched 2/17
    { business_name: 'Pickens Premier Pressure Washing', industry: 'Pressure Washing', location: 'Crosby, TX', estimated_value: '$1,000-$2,000', status: 'Lead', notes: '5.0 stars (20 reviews). No website. Owner responds to every review. Mock site built.', website: '' },
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
  // Last updated: 2026-02-20 5:58 PM CT
  // ═══════════════════════════════════════════════════════════════════
  const queueItems = [
    // Kyle's queue
    { queue_type: 'kyle', title: 'Review 13 cron-built features', priority: 'P0', requested_by: 'Knox', description: 'C2 Jump-to-Week, JFDI Quick-Add, JFDI Command Palette (⌘K), C2 CSV Export (⌘E), JFDI Keyboard Shortcuts, ZipWise Quick-Complete Stops, Gmail Brain Batch Actions, KDP Review Queue Shortcuts, KDP Duplicate Book, JFDI Inline Task Expansion, Auto-Commenter Duplicate Automation, Ops Seed Overhaul. All committed to GitHub, awaiting approval before deploying.' },
    { queue_type: 'kyle', title: '⚠️ Schedule Lark Training sessions — DEADLINE TOMORROW 2/21', priority: 'P0', requested_by: 'Knox', description: 'Management-assigned. Curriculum written (Lark doc D1cUdxrjWopL6Kx7gePcQCM9nXc), AI Readiness Survey created. Kyle briefed at 5:22 PM. Need to review + schedule + add Knox Bot to training group.' },
    { queue_type: 'kyle', title: 'Update Supabase redirect URL for ZipWise', priority: 'P1', requested_by: 'Stack', description: 'Add https://zipwise.bartlettlabs.io to Supabase → Settings → Authentication → URL Configuration. Blocking ZipWise launch. Kyle briefed at 5:22 PM.' },
    { queue_type: 'kyle', title: 'Run openclaw gateway restart', priority: 'P1', requested_by: 'Knox', description: 'Gateway security issue: config patch triggered restart → LAN IP reconnect → blocks browser + sub-agent ops. Quick terminal command fix. Kyle alerted via Telegram.' },
    { queue_type: 'kyle', title: 'Add Cloudflare CNAME: books → cname.vercel-dns.com', priority: 'P2', requested_by: 'Stack', description: 'KDP Book Studio needs books.bartlettlabs.io DNS record.' },
    { queue_type: 'kyle', title: 'Set up Reddit/X accounts for Bartlett Labs', priority: 'P2', requested_by: 'Knox', description: 'X: @BartlettLabs account with brand logo/bio. Reddit: create r/BartlettLabs subreddit + brand account.' },

    // Knox's queue
    { queue_type: 'knox', title: 'Deploy 13 approved features to Vercel', priority: 'P1', requested_by: 'Knox', description: 'C2 CPFR (×2), JFDI (×4), ZipWise, Gmail Brain, KDP (×2), Auto-Commenter — all committed to GitHub, awaiting Kyle approval before deploying to prod.' },
    { queue_type: 'knox', title: 'LinkedIn content creation (browser unblocked)', priority: 'P1', requested_by: 'Knox', description: 'Browser efficient mode working for LinkedIn admin dashboard. BLOCKED by gateway security issue — needs openclaw gateway restart first.' },
    { queue_type: 'knox', title: 'Monitor WoW Week 07 data', priority: 'P1', requested_by: 'Knox', description: 'Step 1b fired today at 8:30 AM via GAS (Weekly Forecast pull). Knox WoW automation not live yet. DATA_WEEK_NUMBER may need update from 5 to 7.' },
    { queue_type: 'knox', title: 'Deploy Scout for prospect research', priority: 'P2', requested_by: 'Knox', description: 'Research new Crosby/Houston prospects beyond the current 13. Expand pipeline.' },
    { queue_type: 'knox', title: 'Deploy Pulse for LinkedIn content', priority: 'P2', requested_by: 'Knox', description: 'LinkedIn Business Page needs content. Deploy Pulse to create posts.' },
    { queue_type: 'knox', title: 'Submit PP to PP Square', priority: 'P2', requested_by: 'Knox', description: 'PP Builder cron fixed (delivery target). Kyle briefed on PP submission at 5:22 PM. Submit next generated PP for AI leaderboard points.' },
  ];

  const insertQueue = db.prepare('INSERT INTO queues (id, queue_type, title, priority, requested_by, description) VALUES (?, ?, ?, ?, ?, ?)');
  for (const q of queueItems) {
    insertQueue.run(uuid(), q.queue_type, q.title, q.priority, q.requested_by, q.description || '');
  }

  // ═══════════════════════════════════════════════════════════════════
  // AGENT TASKS — Recent sub-agent deployments (2/19-2/20)
  // Last updated: 2026-02-20 11:58 AM CT
  // ═══════════════════════════════════════════════════════════════════
  const agentTasks = [
    // 2/19 Stack deployments
    { agent_name: 'Stack', task_description: 'ZipWise code quality sweep (5 tasks)', status: 'Completed', result_summary: '10/10 — planning.tsx decomposed, error boundaries, Sentry, icon/splash, PDF overhaul, login UX' },
    { agent_name: 'Stack', task_description: 'Auto-Commenter code quality sweep (4 tasks)', status: 'Completed', result_summary: '10/10 — dashboard refactor, env validation, ECDSA keys, lead scoring' },
    { agent_name: 'Stack', task_description: 'Gmail Brain assessment', status: 'Completed', result_summary: '6/10 — great QStash pipeline, needs auth + UI overhaul (60-90 hrs)' },
    { agent_name: 'Stack', task_description: 'LarkAgentX assessment', status: 'Completed', result_summary: '6/10 — solid FastAPI backend, 9 days to demo-ready' },
    { agent_name: 'Scout', task_description: 'Dev folder inventory (27 projects)', status: 'Completed', result_summary: '8 immediately useful, 8 need work, 3 trash' },
    { agent_name: 'Stack', task_description: 'C2 CPFR MVP (static HTML)', status: 'Completed', result_summary: 'Single-file dark theme HTML dashboard, C2W/VC badges, WOS color coding' },
    { agent_name: 'Stack', task_description: 'C2 CPFR Next.js + Sheets API', status: 'Completed', result_summary: 'Full app with auto-refresh, discrepancy detection, accept/reject, change log, charts' },
    { agent_name: 'Stack', task_description: 'C2 CPFR design polish + dynamic columns', status: 'Completed', result_summary: 'Sticky header, name-based column mapping, accept/reject buttons, graceful degradation' },
    { agent_name: 'Stack', task_description: 'JFDI + Ops Dashboard merge (33 files, 4,700+ lines)', status: 'Completed', result_summary: 'Ops Center (9 sub-tabs), Action Queue, Automations page. Deployed to jfdi.bartlettlabs.io' },
    { agent_name: 'Scout', task_description: '@Clearmud / Muddy-OS research', status: 'Completed', result_summary: 'Marcelo Oliveira — top OpenClaw power user, voice standups via Edge TTS, content cascade, self-improvement crons' },

    // 2/19 Evening cron-built features
    { agent_name: 'Stack', task_description: 'C2 CPFR Discrepancy Filter (cron, 2/19 5:22 PM)', status: 'Completed', result_summary: 'One-click filter showing only SKU rows with Anker/C2 mismatches. ✅ Deployed to prod.' },
    { agent_name: 'Stack', task_description: 'C2 CPFR Jump-to-Current-Week (cron, 2/19 7:22 PM)', status: 'Completed', result_summary: 'Auto-scroll + green highlight on current fiscal week column. Committed, awaiting review.' },
    { agent_name: 'Stack', task_description: 'JFDI Quick-Add buttons (cron, 2/19 9:22 PM)', status: 'Completed', result_summary: 'Inline "+" buttons on dashboard widgets for instant reminder/task creation. Awaiting review.' },
    { agent_name: 'Stack', task_description: 'JFDI Command Palette ⌘K (cron, 2/19 11:22 PM)', status: 'Completed', result_summary: 'Global search + navigation across all 12 pages. Keyboard-driven. Awaiting review.' },

    // 2/20 Overnight + morning cron-built features (autonomous — 11 features in ~14 hours)
    { agent_name: 'Stack', task_description: 'C2 CPFR CSV Export ⌘E (cron, 2/20 1:22 AM)', status: 'Completed', result_summary: 'Keyboard shortcut + export button, respects all filters, auto-named CSV. Commit 1fa2b24. Awaiting review.' },
    { agent_name: 'Stack', task_description: 'JFDI Reminders Keyboard Shortcuts (cron, 2/20 3:22 AM)', status: 'Completed', result_summary: 'j/k navigate, c complete, e edit, d delete, s snooze, n new, ? help. Commit 149470b. Awaiting review.' },
    { agent_name: 'Stack', task_description: 'ZipWise Quick-Complete Stops (cron, 2/20 5:22 AM)', status: 'Completed', result_summary: 'Tap stop badge → complete with spring animation + undo toast. React Native. Commit 1c55aab. Awaiting review.' },
    { agent_name: 'Stack', task_description: 'Gmail Brain Batch Actions (cron, 2/20 7:22 AM)', status: 'Completed', result_summary: 'Checkboxes, select all per section, floating action bar, batch reclassify/undo, parallel processing batches of 5. Commit 2f89f83. Awaiting review.' },
    { agent_name: 'Stack', task_description: 'KDP Book App Review Queue Shortcuts (cron, 2/20 9:22 AM)', status: 'Completed', result_summary: 'a approve+advance, h/l navigate, r reject, g regenerate, 1/2/3 switch views. Commit ca41443. Awaiting review.' },
    { agent_name: 'Stack', task_description: 'KDP Book App Duplicate Book (cron, 2/20 11:22 AM)', status: 'Completed', result_summary: 'One-click clone of book settings (type, content level, genre, audience, page count, trim size). Copy icon on rows + Duplicate button in modal. Commit c69db8c. Awaiting review.' },
    { agent_name: 'Stack', task_description: 'JFDI Inline Task Expansion (cron, 2/20 3:22 PM)', status: 'Completed', result_summary: 'Expand/collapse chevron on project cards — view tasks, check off, add new tasks inline without page navigation. +141 lines. Commit b19c5e2. Awaiting review.' },
    { agent_name: 'Stack', task_description: 'Auto-Commenter Duplicate Automation (cron, 2/20 5:22 PM)', status: 'Completed', result_summary: 'One-click clone of automation config (name, targets, limits, connection, personalization). Pre-fills builder form via sessionStorage. Commit 6801acf. Awaiting review.' },
    { agent_name: 'Stack', task_description: 'Ops Dashboard seed data overhaul ×7 (cron, 2/20 all day)', status: 'Completed', result_summary: '30 projects, 13 prospects, 23 agent tasks, 22+ activity events, 12 queue items. 7 refreshes throughout the day keeping dashboard current.' },
  ];

  const insertAgent = db.prepare('INSERT INTO agent_tasks (id, agent_name, task_description, status, result_summary) VALUES (?, ?, ?, ?, ?)');
  for (const a of agentTasks) {
    insertAgent.run(uuid(), a.agent_name, a.task_description, a.status, a.result_summary);
  }

  // ═══════════════════════════════════════════════════════════════════
  // IDEAS — From Billion $ Ideas cron + research
  // ═══════════════════════════════════════════════════════════════════
  const ideas = [
    { title: 'Knox Command Center', description: 'Real-time visual dashboard — spaceship cockpit for AI agent operation. Live sub-agent fleet status, cron job registry, project tracker, memory bank viewer, revenue pipeline. Dark sci-fi aesthetic. Next.js + Tailwind + Framer Motion.', potential_revenue: 'Personal tool (operational efficiency)', effort: 'M', source: 'Billion $ Ideas Cron', status: 'New' },
    { title: 'DealFlow AI', description: 'AI-powered missed-call recovery engine for local service businesses. Missed call → AI texts back in 30s → books appointment → tracks revenue. 84.5% gross margin, LTV:CAC 49.5:1, break-even at 7 customers. $10M+ ARR by Year 3.', potential_revenue: '$297-$997/mo per customer', effort: 'L', source: 'Billion $ Ideas Cron', status: 'Evaluating' },
  ];

  const insertIdea = db.prepare('INSERT INTO ideas (id, title, description, potential_revenue, effort, source, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const i of ideas) {
    insertIdea.run(uuid(), i.title, i.description, i.potential_revenue, i.effort, i.source, i.status);
  }

  // ═══════════════════════════════════════════════════════════════════
  // ACTIVITY LOG — Recent milestones and events
  // Last updated: 2026-02-20 11:58 AM CT
  // ═══════════════════════════════════════════════════════════════════
  const activityEvents = [
    // Key milestones
    { event_type: 'milestone', title: 'Most productive day ever logged (2/19)', description: '2/19: 1,500+ line daily notes, 8 Stack deployments, C2 CPFR dashboard built from scratch, JFDI+Ops merge, Lark training curriculum, 5 autonomous cron features', source: 'Knox', icon: '🏆' },
    { event_type: 'milestone', title: 'C2 CPFR Dashboard deployed', description: 'Anker-C2W Charging CPFR live at c2.bartlettlabs.io. Mirror sheet architecture bypasses Anker sharing restrictions. 12 UI improvements polished same day.', source: 'Stack', icon: '🚀' },
    { event_type: 'milestone', title: 'JFDI + Ops Dashboard merged', description: '33-file, 4,700+ line merge. Ops Center (9 sub-tabs), Action Queue, Automations. Deployed to jfdi.bartlettlabs.io.', source: 'Stack', icon: '🔗' },
    { event_type: 'milestone', title: 'Lark Training Curriculum complete', description: '4-session program written. 20 Knowledge Hub articles + 40+ PAs + 9 Feishu docs scraped. AI Readiness Survey created. ⚠️ Sessions must be scheduled by 2/21.', source: 'Knox', icon: '📚' },
    { event_type: 'milestone', title: 'Anker AI leaderboard: #1 in group, #82 company-wide', description: 'Kyle ranked #1 in group of 200 employees. Goal: #1 company-wide. PP Builder + token burner crons active.', source: 'Knox', icon: '🏅' },
    { event_type: 'milestone', title: 'ZipWise deployed to Vercel', description: 'Live at zipwise.bartlettlabs.io. Login/signup + 9-step onboarding wizard. Pending: Supabase redirect URL fix by Kyle.', source: 'Stack', icon: '🌐' },

    // 2/20 Overnight autonomous cron machine — 11 features across 5 projects
    { event_type: 'note', title: 'Autonomous cron development — 16+ features in 40 hours', description: '2/19 evening through 2/20 noon: 16+ features built across 6 projects (C2 CPFR, JFDI, ZipWise, Gmail Brain, KDP Books, Ops Dashboard) without human input. Cron strategy: "one small feature" per cycle.', source: 'Knox', icon: '🤖' },
    { event_type: 'agent_complete', title: 'C2 CPFR Discrepancy Filter deployed', description: 'One-click filter for SKU rows with Anker/C2 mismatches. Orange badge with count. ✅ Live on prod.', source: 'Stack (cron)', icon: '⚡' },
    { event_type: 'agent_complete', title: 'C2 CPFR Jump-to-Current-Week built', description: 'Auto-scroll + green highlight on current fiscal week column. Awaiting review.', source: 'Stack (cron)', icon: '📅' },
    { event_type: 'agent_complete', title: 'JFDI Quick-Add buttons built', description: 'Inline "+" buttons on dashboard widgets for instant reminder/task creation. Awaiting review.', source: 'Stack (cron)', icon: '➕' },
    { event_type: 'agent_complete', title: 'JFDI Command Palette (⌘K) built', description: 'Global search + navigation across all 12 pages. Keyboard-driven with type badges. Awaiting review.', source: 'Stack (cron)', icon: '🔍' },
    { event_type: 'agent_complete', title: 'C2 CPFR CSV Export (⌘E) built', description: 'Keyboard shortcut + export button. Respects all active filters. Auto-named CSV. Commit 1fa2b24.', source: 'Stack (cron)', icon: '📥' },
    { event_type: 'agent_complete', title: 'JFDI Reminders Keyboard Shortcuts built', description: 'j/k navigate, c complete, e edit, s snooze, d delete, n new, ? help. Focus ring + auto-scroll. Commit 149470b.', source: 'Stack (cron)', icon: '⌨️' },
    { event_type: 'agent_complete', title: 'ZipWise Quick-Complete Stops built', description: 'Tap stop badge → complete with spring animation + 4s undo toast. React Native. Commit 1c55aab.', source: 'Stack (cron)', icon: '📱' },
    { event_type: 'agent_complete', title: 'Gmail Brain Batch Actions built', description: 'Checkboxes, select all per section (Work/Personal), floating dark action bar, batch reclassify/undo, parallel processing in batches of 5. Commit 2f89f83.', source: 'Stack (cron)', icon: '📧' },
    { event_type: 'agent_complete', title: 'KDP Book App Review Queue Shortcuts built', description: 'a approve+advance, h/l navigate, r reject, g regenerate, 1/2/3 switch views. Commit ca41443.', source: 'Stack (cron)', icon: '📖' },
    { event_type: 'agent_complete', title: 'KDP Book App Duplicate Book built', description: 'One-click clone of book settings (type, content level, genre, audience, page count, trim size). Copy icon on rows + Duplicate button in modal. Commit c69db8c.', source: 'Stack (cron)', icon: '📋' },

    // Afternoon features (2/20)
    { event_type: 'agent_complete', title: 'JFDI Inline Task Expansion built', description: 'Expand project cards to view/edit/add tasks inline — no page navigation. One-click checkboxes, inline quick-add. Commit b19c5e2.', source: 'Stack (cron)', icon: '📂' },
    { event_type: 'agent_complete', title: 'Auto-Commenter Duplicate Automation built', description: 'One-click clone of automation config. Pre-fills builder form with source settings. Commit 6801acf.', source: 'Stack (cron)', icon: '🔄' },

    // System events
    { event_type: 'system', title: '3 cron delivery channels fixed (4:58 PM)', description: 'PP Builder, Billion $ Ideas, MOPA Prompt all had channel:"last" which fails in isolated sessions. Fixed to channel:"telegram", to:"8516293230". Billion $ Ideas scope reduced from 2→1 idea (was timing out).', source: 'Knox', icon: '🔧' },
    { event_type: 'system', title: 'Browser config: efficient mode enabled', description: 'browser.snapshotDefaults.mode: "efficient" — fixes LinkedIn admin dashboard timeouts. Tested successfully (74 elements, no timeout).', source: 'Knox', icon: '🌐' },
    { event_type: 'system', title: 'Gateway security issue flagged', description: 'Config patch triggered gateway restart → LAN IP reconnect (192.168.68.65) → security check blocks browser+sub-agent ops on plaintext ws://. Kyle alerted — needs openclaw gateway restart.', source: 'Knox', icon: '⚠️' },
    { event_type: 'note', title: 'Kyle came online (5:22 PM) — briefed on 3 items', description: 'After ~19 hours offline. Briefed on: (1) Lark Training deadline tomorrow, (2) Supabase redirect URL for ZipWise, (3) PP Square submission. Going mobile soon.', source: 'Knox', icon: '👤' },
    { event_type: 'system', title: 'Ops Dashboard seed data — 7 refreshes today', description: '30 projects, 13 real prospects, 23 agent tasks, 22+ activity events. Hourly cron bc233846 keeping dashboard current with all project changes.', source: 'Knox (cron)', icon: '📊' },
  ];

  const insertActivity = db.prepare("INSERT INTO activity_log (id, event_type, title, description, source, icon, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))");
  activityEvents.forEach((evt, i) => {
    const minutesAgo = `-${(activityEvents.length - i) * 45} minutes`;
    insertActivity.run(uuid(), evt.event_type, evt.title, evt.description, evt.source, evt.icon, minutesAgo);
  });

  // ═══════════════════════════════════════════════════════════════════
  // DAILY METRICS — Recent days
  // Last updated: 2026-02-20 11:58 AM CT
  // ═══════════════════════════════════════════════════════════════════
  const today = new Date().toISOString().split('T')[0];
  const insertMetrics = db.prepare('INSERT INTO daily_metrics (id, metric_date, agents_deployed, tasks_completed, prospects_contacted, ideas_logged, active_streak, mood, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');

  // Yesterday (2/19) — most productive day
  insertMetrics.run(uuid(), '2026-02-19', 15, 12, 0, 2, 8, 'on-fire',
    'MOST PRODUCTIVE DAY EVER. 8 Stack deploys, C2 CPFR from scratch, JFDI+Ops merge, Lark training curriculum, 5 autonomous cron features. 1,500+ line daily notes.');

  // Today (2/20) — autonomous cron machine all day
  insertMetrics.run(uuid(), today, 0, 13, 0, 0, 9, 'grinding',
    'Full-day autonomous cron machine: 13 features built across 7 projects (C2 CPFR ×2, JFDI ×4, ZipWise, Gmail Brain, KDP Books ×2, Auto-Commenter, Ops Dashboard ×7). All committed to GitHub, 13 awaiting Kyle review. Kyle came online at 5:22 PM — briefed on Lark Training deadline (tomorrow), Supabase URL, PP submission. 3 cron delivery targets fixed (PP Builder, Billion $ Ideas, MOPA). Browser efficient mode enabled for LinkedIn. Gateway security issue flagged for Kyle restart. 2,000+ lines of daily notes.');
}
