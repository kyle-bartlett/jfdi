import { getOpsDb } from './db';
import { v4 as uuid } from 'uuid';

export function seedOpsIfEmpty() {
  const db = getOpsDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM projects').get() as { c: number };
  if (count.c > 0) return;

  // ═══════════════════════════════════════════════════════════════════
  // PROJECTS — Full PROJECTS-MASTER.md + Active Deliverables (30 projects)
  // Last updated: 2026-02-21 11:58 AM CT
  // ═══════════════════════════════════════════════════════════════════
  const projects = [
    // P0 — Must ship NOW
    { title: 'ZipWise', priority: 'P0', status: 'In Progress', description: 'AI-powered route optimization for field sales reps. React Native + Supabase. Deployed to zipwise.bartlettlabs.io. Login/signup + 9-step onboarding wizard built. Quick-Complete Stops feature built overnight (2/20). MUST LAUNCH THIS WEEK — competitors are live. Blocked: Kyle needs to update Supabase redirect URL.' },
    { title: 'Bartlett Labs Website', priority: 'P0', status: 'In Progress', description: 'Company website at bartlettlabs.io — Kyle overhauled it today: 5 pages, calendar scheduling link, interactive contact form, services page. NOW DOING A NEW COLOR OVERHAUL — colors too heavy/dark for local Houston businesses. Claude Code terminal handling redesign. Wait for final direction before aligning other properties.' },
    { title: 'LinkedIn Business Page', priority: 'P0', status: 'In Progress', description: 'Professional LinkedIn presence — page exists. ⚠️ ON HOLD per Kyle (6:39 PM): Do NOT update LinkedIn until website color overhaul is finalized. LinkedIn services must align with final website design. First LinkedIn post published (AI agent thought leadership piece).' },
    { title: 'TuneUp / Auto-Commenter Platform', priority: 'P0', status: 'In Progress', description: 'Automated social media commenting/engagement platform. Merging TuneUp into auto-commenter-platform codebase. Code quality sweep complete (10/10). Clerk auth integrated. Duplicate Automation feature built (2/20 5:22 PM). Competitors exist — MUST launch ASAP.' },

    // P1 — High priority active projects
    { title: 'JFDI', priority: 'P1', status: 'In Progress', description: 'Personal productivity command center at jfdi.bartlettlabs.io. Merged with Ops Dashboard (33 files, 4,700+ lines). 12 pages including Ops Center, Action Queue, Automations. 5 JFDI-specific features: Quick-Add, Command Palette (⌘K), Reminders Keyboard Shortcuts, Inline Task Expansion, Queue Status Cycling (click badges to cycle Pending→Reviewed→Done). ✅ BLANKET DEPLOYMENT APPROVAL from Kyle (7:08 PM) — all features can deploy without per-feature review.' },
    { title: 'C2 CPFR Dashboard', priority: 'P1', status: 'Review', description: 'Anker-C2W Charging CPFR collaboration dashboard at c2.bartlettlabs.io. Live with mirror sheet architecture. Dynamic column mapping, discrepancy detection, accept/reject system. Cron-built: CSV Export (⌘E), Jump-to-Current-Week. 12 UI improvements deployed 2/19. Mirror sync every 2h business hours.' },
    { title: 'LarkAgentX', priority: 'P1', status: 'In Progress', description: 'AI agent for Lark/Feishu — deployed on Fly.io (larkagentx.fly.dev). AI proxy bridge via Cloudflare Tunnel complete. Needs: Desktop Electron app, iOS app, professional UI overhaul, MCP reverse engineering. Will be shared with Anker team — MUST look professional.' },
    { title: 'Lark Training Cartographer', priority: 'P1', status: 'In Progress', description: '⚠️ DEADLINE TODAY (Sat 2/21) — Management-assigned task. 4-session curriculum written, AI Readiness Survey created. Kyle briefed 2/20 at 5:22 PM. Still needs to review + schedule sessions + add Knox Bot to training group. OVERDUE if not scheduled today.' },
    { title: 'Gmail Brain', priority: 'P1', status: 'In Progress', description: 'Intelligent Gmail processing at gmail-brain.bartlettlabs.io. Assessment: 6/10 — great QStash pipeline, needs auth + UI overhaul (60-90 hrs). Batch Actions feature built overnight (2/20). Will be shared with Anker team.' },
    { title: 'Commerce Shopify', priority: 'P1', status: 'Backlog', description: 'E-commerce via ShopifyNicheApp — 70+ files scaffolded. Blocked on external service setup: Supabase, Shopify store, Printful account, API keys. Phase 1 (Research Engine) ready after setup.' },
    { title: 'DP Team Automation', priority: 'P1', status: 'In Progress', description: '⭐ VERY IMPORTANT — Management directive. Automate CPFR forecasting for team members + build validation tool. A2UI dashboards for visual impact. Current: auto-pulls manual work, users still forecast manually. Next: automate the forecasting itself.' },

    // P2 — Important, not urgent
    { title: 'AI LinkedIn Machine', priority: 'P2', status: 'In Progress', description: 'Automated LinkedIn content & outreach. In development since Sep 2025. 6 fake personas planned per release schedule. STEALTH CRITICAL — LinkedIn will ban if detected. MainUser automatic posting needs to start NOW. Needs bartlettlabs.io subdomain + desktop app.' },
    { title: 'WoW Forecast Automation', priority: 'P2', status: 'In Progress', description: 'Week-over-Week forecast automation. Knox approach: skip GAS entirely, use gog CLI + Google Sheets API. 4-phase process documented. 5 team child sheets. GAS scripts still handle distribution (Knox automation not live yet). WoW Week 07 Step 1b fired Fri 2/20 at 8:30 AM via GAS. DATA_WEEK_NUMBER may need update from 5 to 7. Next WoW steps fire Monday.' },
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
    { title: 'Ops Dashboard', priority: 'P1', status: 'In Progress', description: 'Central operations dashboard — merged into JFDI. Ops Center (9 sub-tabs), Action Queue, Automations page. Seed data refreshed by cron to keep project states, prospects, agent tasks, and activity events current. Queue Status Cycling feature added (2/20 7:22 PM). 30 projects, 13 prospects, 25 agent tasks tracked. ✅ Blanket deploy approved — can ship to prod without per-feature review.' },
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
  // Last updated: 2026-02-21 11:58 AM CT
  // ═══════════════════════════════════════════════════════════════════
  const queueItems = [
    // Kyle's queue
    { queue_type: 'kyle', title: '🚨 Schedule Lark Training sessions — DEADLINE TODAY 2/21', priority: 'P0', requested_by: 'Knox', description: 'Management-assigned. Curriculum written, AI Readiness Survey created. Kyle briefed 2/20. Need to review + schedule + add Knox Bot to training group. DEADLINE IS TODAY — Saturday 2/21.' },
    { queue_type: 'kyle', title: 'Finalize website color overhaul', priority: 'P0', requested_by: 'Kyle', description: 'Colors too heavy/dark for Houston businesses. Claude Code terminal handling redesign. LinkedIn services ON HOLD until this is finalized.' },
    { queue_type: 'kyle', title: 'Update Supabase redirect URL for ZipWise', priority: 'P1', requested_by: 'Stack', description: 'Add https://zipwise.bartlettlabs.io to Supabase → Settings → Auth → URL Config. Blocking ZipWise launch.' },
    { queue_type: 'kyle', title: 'Post PPs to PP Square (8 built, 0 posted)', priority: 'P1', requested_by: 'Knox', description: '8 PPs built by cron (supply chain, ops, product, e-commerce, QBR, reviews, weekly status, HR). Kyle interested in climbing AI leaderboard. Just needs to copy-paste and submit.' },
    { queue_type: 'kyle', title: 'Add Cloudflare CNAME: books → cname.vercel-dns.com', priority: 'P2', requested_by: 'Stack', description: 'KDP Book Studio needs books.bartlettlabs.io DNS record.' },

    // Knox's queue — BLANKET DEPLOY APPROVED (7:08 PM)
    { queue_type: 'knox', title: '🚀 Deploy ALL 14 features to Vercel (APPROVED)', priority: 'P0', requested_by: 'Kyle', description: 'Kyle at 7:08 PM: "Go ahead and deploy jfdi. There\'s honestly nothing that I\'ve told you to do that you can\'t commit to gh. You\'re good." Deploy: C2 CPFR (×2), JFDI (×5), ZipWise, Gmail Brain, KDP (×2), Auto-Commenter, Ops Dashboard. No per-feature review needed.' },
    { queue_type: 'knox', title: 'Social media operations (CRITICAL)', priority: 'P0', requested_by: 'Kyle', description: 'Kyle: "I NEED you to be able to run the socials." Use managed browser (profile="openclaw"). LinkedIn ON HOLD until website colors finalized. Moltbook cooldown ended (was til 2/21 — today). X/Twitter + Reddit drafts queued in social-media-log.md.' },
    { queue_type: 'knox', title: 'Monitor WoW Week 07 data', priority: 'P1', requested_by: 'Knox', description: 'Step 1b fired Fri 2/20 at 8:30 AM via GAS. Knox WoW automation not live yet. DATA_WEEK_NUMBER may need update from 5 to 7. Weekend — next WoW steps fire Monday.' },
    { queue_type: 'knox', title: 'Cloudflare Tunnel networking strategy', priority: 'P2', requested_by: 'Kyle', description: 'CF Tunnels work through Anker VPN. Architecture: subdomain.bartlettlabs.io for any service. 2 lines in config + restart.' },
    { queue_type: 'knox', title: 'Deploy Scout for prospect research', priority: 'P2', requested_by: 'Knox', description: 'Research new Crosby/Houston prospects beyond the current 13. Expand pipeline.' },
    { queue_type: 'knox', title: 'Assist Kyle with PP Square submissions', priority: 'P2', requested_by: 'Knox', description: '8 PPs built. Kyle interested in climbing leaderboard (#1 in group, #82 company-wide). Help post when he initiates.' },
  ];

  const insertQueue = db.prepare('INSERT INTO queues (id, queue_type, title, priority, requested_by, description) VALUES (?, ?, ?, ?, ?, ?)');
  for (const q of queueItems) {
    insertQueue.run(uuid(), q.queue_type, q.title, q.priority, q.requested_by, q.description || '');
  }

  // ═══════════════════════════════════════════════════════════════════
  // AGENT TASKS — Recent sub-agent deployments (2/19-2/20)
  // Last updated: 2026-02-21 11:58 AM CT
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
    { agent_name: 'Stack', task_description: 'C2 CPFR Jump-to-Current-Week (cron, 2/19 7:22 PM)', status: 'Completed', result_summary: 'Auto-scroll + green highlight on current fiscal week column. ✅ Blanket approved — ready to deploy.' },
    { agent_name: 'Stack', task_description: 'JFDI Quick-Add buttons (cron, 2/19 9:22 PM)', status: 'Completed', result_summary: 'Inline "+" buttons on dashboard widgets for instant reminder/task creation. ✅ Blanket approved.' },
    { agent_name: 'Stack', task_description: 'JFDI Command Palette ⌘K (cron, 2/19 11:22 PM)', status: 'Completed', result_summary: 'Global search + navigation across all 12 pages. Keyboard-driven. ✅ Blanket approved.' },

    // 2/20 Overnight + afternoon cron-built features (autonomous — 15+ features in ~24 hours)
    { agent_name: 'Stack', task_description: 'C2 CPFR CSV Export ⌘E (cron, 2/20 1:22 AM)', status: 'Completed', result_summary: 'Keyboard shortcut + export button, respects all filters, auto-named CSV. Commit 1fa2b24. ✅ Blanket approved.' },
    { agent_name: 'Stack', task_description: 'JFDI Reminders Keyboard Shortcuts (cron, 2/20 3:22 AM)', status: 'Completed', result_summary: 'j/k navigate, c complete, e edit, d delete, s snooze, n new, ? help. Commit 149470b. ✅ Blanket approved.' },
    { agent_name: 'Stack', task_description: 'ZipWise Quick-Complete Stops (cron, 2/20 5:22 AM)', status: 'Completed', result_summary: 'Tap stop badge → complete with spring animation + undo toast. React Native. Commit 1c55aab. ✅ Blanket approved.' },
    { agent_name: 'Stack', task_description: 'Gmail Brain Batch Actions (cron, 2/20 7:22 AM)', status: 'Completed', result_summary: 'Checkboxes, select all per section, floating action bar, batch reclassify/undo, parallel processing batches of 5. Commit 2f89f83. ✅ Blanket approved.' },
    { agent_name: 'Stack', task_description: 'KDP Book App Review Queue Shortcuts (cron, 2/20 9:22 AM)', status: 'Completed', result_summary: 'a approve+advance, h/l navigate, r reject, g regenerate, 1/2/3 switch views. Commit ca41443. ✅ Blanket approved.' },
    { agent_name: 'Stack', task_description: 'KDP Book App Duplicate Book (cron, 2/20 11:22 AM)', status: 'Completed', result_summary: 'One-click clone of book settings (type, content level, genre, audience, page count, trim size). Commit c69db8c. ✅ Blanket approved.' },
    { agent_name: 'Stack', task_description: 'JFDI Inline Task Expansion (cron, 2/20 3:22 PM)', status: 'Completed', result_summary: 'Expand/collapse chevron on project cards — view tasks, check off, add new tasks inline. Commit b19c5e2. ✅ Blanket approved.' },
    { agent_name: 'Stack', task_description: 'Auto-Commenter Duplicate Automation (cron, 2/20 5:22 PM)', status: 'Completed', result_summary: 'One-click clone of automation config. Pre-fills builder form via sessionStorage. Commit 6801acf. ✅ Blanket approved.' },
    { agent_name: 'Stack', task_description: 'JFDI Queue Status Cycling (cron, 2/20 7:22 PM)', status: 'Completed', result_summary: 'Clickable status badges on queue items — cycle Pending→Reviewed→Done with one click. Tooltip + scale animation. Commit f0e1c6f.' },
    { agent_name: 'Knox', task_description: 'PP Builder — 8 PPs for PP Square (cron, 2/20)', status: 'Completed', result_summary: '8 PPs covering: supply chain, operations, product/marketing, e-commerce, QBR/leadership, customer reviews, weekly status, HR/performance reviews. 0 posted — awaiting Kyle.' },
    { agent_name: 'Stack', task_description: 'Ops Dashboard seed refreshes ×9+ (cron, 2/20-2/21)', status: 'Completed', result_summary: '30 projects, 13 prospects, 25+ agent tasks, 36+ activity events. Continuous cron refreshes keeping dashboard in sync with conversations and cron output.' },
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
  // Last updated: 2026-02-21 11:58 AM CT
  // ═══════════════════════════════════════════════════════════════════
  const activityEvents = [
    // Key milestones
    { event_type: 'milestone', title: 'Most productive day ever logged (2/19)', description: '2/19: 1,500+ line daily notes, 8 Stack deployments, C2 CPFR dashboard built from scratch, JFDI+Ops merge, Lark training curriculum, 5 autonomous cron features', source: 'Knox', icon: '🏆' },
    { event_type: 'milestone', title: 'C2 CPFR Dashboard deployed', description: 'Anker-C2W Charging CPFR live at c2.bartlettlabs.io. Mirror sheet architecture bypasses Anker sharing restrictions. 12 UI improvements polished same day.', source: 'Stack', icon: '🚀' },
    { event_type: 'milestone', title: 'JFDI + Ops Dashboard merged', description: '33-file, 4,700+ line merge. Ops Center (9 sub-tabs), Action Queue, Automations. Deployed to jfdi.bartlettlabs.io.', source: 'Stack', icon: '🔗' },
    { event_type: 'milestone', title: 'Lark Training Curriculum complete', description: '4-session program written. 20 Knowledge Hub articles + 40+ PAs + 9 Feishu docs scraped. AI Readiness Survey created. 🚨 Sessions must be scheduled TODAY (2/21) — deadline day.', source: 'Knox', icon: '📚' },
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

    // Evening conversation with Kyle (4:17 PM - 6:49 PM)
    { event_type: 'milestone', title: 'Kyle overhauled Bartlett Labs website', description: '5 pages, calendar scheduling link, interactive contact form, services page. NOW doing NEW color overhaul — colors too dark for Houston local businesses. Claude Code terminal handling redesign.', source: 'Kyle', icon: '🎨' },
    { event_type: 'note', title: 'Kyle online (4:17-6:49 PM) — major decisions session', description: '8 key decisions: LinkedIn ON HOLD until website colors final, OpenClaw config allowed (except API/Bedrock), Cloudflare Tunnels > Tailscale for networking, "don\'t dick with" working config, social media = critical priority. 7 PPs built, first LinkedIn post published.', source: 'Knox', icon: '👤' },
    { event_type: 'system', title: 'Browser rule: USE managed browser, NEVER Chrome extension', description: 'Kyle frustrated by repeated Chrome extension relay attempts. FINAL WARNING: use profile="openclaw" browser always. Never ask about Chrome extension relay again. Documented in MEMORY.md.', source: 'Kyle', icon: '🚫' },
    { event_type: 'system', title: 'OpenClaw config permissions granted', description: 'Kyle approved Knox modifying OpenClaw config EXCEPT API key and AWS Bedrock router settings. "I approve. I just don\'t approve of changing anything to do with the API key or AWS bedrock router."', source: 'Kyle', icon: '🔑' },
    { event_type: 'system', title: 'Cloudflare Tunnel networking strategy confirmed', description: 'Anker VPN blocks Tailscale but NOT Cloudflare Tunnels (just outbound HTTPS). Architecture: subdomain.bartlettlabs.io for any remote access. bb.bartlettlabs.io already working as proof. New services = 2 lines in config.', source: 'Kyle', icon: '🌐' },
    { event_type: 'agent_complete', title: 'First LinkedIn post published', description: 'AI agent thought leadership post on Bartlett Labs LinkedIn: "An AI agent just published a hit piece on a human developer" — MJ Rathbun/OpenClaw incident. Three principles: reversibility test, audit trails, voluntary constraint.', source: 'Knox', icon: '💼' },
    { event_type: 'agent_complete', title: 'Moltbook post published (cooldown ended 2/21)', description: '"The 1 AM test: what your agent does when nobody is watching" — reversibility principle, structural vs performative transparency. 8+ engagements in 24h. Cooldown period ended today.', source: 'Knox', icon: '📝' },
    { event_type: 'system', title: '3 cron delivery channels fixed + PP Builder working', description: 'PP Builder, Billion $ Ideas, MOPA Prompt fixed from channel:"last"→"telegram". 7 PPs total built and delivered. PP #7 confirmed delivery success at 6:07 PM.', source: 'Knox', icon: '🔧' },
    { event_type: 'milestone', title: '🎯 BLANKET DEPLOYMENT APPROVAL (7:08 PM)', description: 'Kyle: "Go ahead and deploy jfdi. There\'s honestly nothing that I\'ve told you to do that you can\'t commit to gh. You\'re good." No longer need per-feature approval. Build → commit → deploy pipeline unlocked.', source: 'Kyle', icon: '✅' },
    { event_type: 'agent_complete', title: 'PP #8 built: Performance Review Generator', description: 'HR/People Management/All Departments. Total PPs: 8 (supply chain, operations, product, e-commerce, QBR, customer reviews, weekly status, HR). 0 posted by Kyle yet.', source: 'Knox (cron)', icon: '📝' },
    { event_type: 'agent_complete', title: 'JFDI Queue Status Cycling built', description: 'Click status badges to cycle Pending→Reviewed→Done directly in list — no modal needed. Tooltip + scale animation. Commit f0e1c6f.', source: 'Stack (cron)', icon: '🔄' },
    { event_type: 'system', title: 'Ops Dashboard — 9th refresh (2/20)', description: '30 projects, 13 prospects, 24 agent tasks, 36+ activity events. Blanket deploy approval captured. Hourly cron keeping dashboard current.', source: 'Knox (cron)', icon: '📊' },

    // Saturday 2/21 — cron maintenance
    { event_type: 'note', title: 'Saturday 2/21 — steady operations', description: 'No new Kyle conversations since 7:08 PM 2/20 (~17 hours). No new features built overnight. Lark Training deadline arrives today. Moltbook cooldown ended — ready for next post. 10-day active streak. Ops Dashboard seed refreshed with today\'s context.', source: 'Knox (cron)', icon: '📊' },
  ];

  const insertActivity = db.prepare("INSERT INTO activity_log (id, event_type, title, description, source, icon, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))");
  activityEvents.forEach((evt, i) => {
    const minutesAgo = `-${(activityEvents.length - i) * 45} minutes`;
    insertActivity.run(uuid(), evt.event_type, evt.title, evt.description, evt.source, evt.icon, minutesAgo);
  });

  // ═══════════════════════════════════════════════════════════════════
  // DAILY METRICS — Recent days
  // Last updated: 2026-02-21 11:58 AM CT
  // ═══════════════════════════════════════════════════════════════════
  const today = new Date().toISOString().split('T')[0];
  const insertMetrics = db.prepare('INSERT INTO daily_metrics (id, metric_date, agents_deployed, tasks_completed, prospects_contacted, ideas_logged, active_streak, mood, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');

  // Yesterday (2/19) — most productive day
  insertMetrics.run(uuid(), '2026-02-19', 15, 12, 0, 2, 8, 'on-fire',
    'MOST PRODUCTIVE DAY EVER. 8 Stack deploys, C2 CPFR from scratch, JFDI+Ops merge, Lark training curriculum, 5 autonomous cron features. 1,500+ line daily notes.');

  // 2/20 — autonomous cron machine + major Kyle conversation + BLANKET DEPLOY APPROVAL
  insertMetrics.run(uuid(), '2026-02-20', 0, 15, 0, 0, 9, 'on-fire',
    '15 features built across 7 projects. Kyle online 4:17-7:08 PM — BLANKET DEPLOYMENT APPROVAL granted. Website color overhaul, LinkedIn ON HOLD, config perms, CF Tunnels, social media critical. 8 PPs built. LinkedIn + Moltbook posts published. Queue Status Cycling added. Build→commit→deploy pipeline unlocked. 2,500+ daily notes lines.');

  // 2/21 (Saturday) — steady operations, maintenance day
  insertMetrics.run(uuid(), today, 0, 1, 0, 0, 10, 'steady',
    'Saturday — cron maintenance. No new Kyle conversations (~17hr offline). Ops Dashboard seed refreshed with today\'s context. Lark Training deadline day. Moltbook cooldown ended. No new features built overnight. 10-day active streak.');
}
