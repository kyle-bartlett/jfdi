/**
 * Seed script - Run with: npx tsx scripts/seed.ts
 * Seeds the database with initial data across all modules.
 */

import { createClient } from "@libsql/client";
import { v4 as uuidv4 } from "uuid";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:./data/jfdi.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function seed() {
  // Initialize tables first
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT,
      space TEXT DEFAULT 'personal', status TEXT DEFAULT 'active-focus',
      priority TEXT DEFAULT 'medium', progress INTEGER DEFAULT 0, tags TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY, project_id TEXT REFERENCES projects(id),
      title TEXT NOT NULL, description TEXT, status TEXT DEFAULT 'todo',
      due_date TEXT, assignee TEXT, priority TEXT DEFAULT 'medium',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT,
      category TEXT DEFAULT 'personal', target_percentage REAL DEFAULT 100,
      current_percentage REAL DEFAULT 0, period_start TEXT, period_end TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT,
      due_date TEXT, status TEXT NOT NULL DEFAULT 'pending',
      priority TEXT DEFAULT 'medium', category TEXT DEFAULT 'personal',
      snoozed_until TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS relationships (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT, phone TEXT,
      type TEXT DEFAULT 'casual', priority TEXT DEFAULT 'medium',
      last_contact TEXT, contact_frequency_days INTEGER DEFAULT 30,
      notes TEXT, notes_path TEXT, tags TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS interactions (
      id TEXT PRIMARY KEY, relationship_id TEXT REFERENCES relationships(id),
      type TEXT DEFAULT 'contact', notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, date TEXT NOT NULL,
      location TEXT, attendee_ids TEXT, calendar_event_id TEXT,
      agenda TEXT, prep_notes TEXT, debrief_notes TEXT, action_items TEXT,
      prep_notes_path TEXT, debrief_notes_path TEXT,
      status TEXT DEFAULT 'upcoming',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS knowledge_entries (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, source_url TEXT,
      content_path TEXT, content TEXT, tags TEXT, related_people TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS spark_entries (
      id TEXT PRIMARY KEY, content TEXT NOT NULL, tags TEXT, connections TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ──────────────────────── PROJECTS ────────────────────────

  console.log("Seeding projects...");

  const seedProjects = [
    {
      name: "TuneUp Automation",
      description: "Automated listing optimization platform for e-commerce",
      space: "bartlett-labs",
      status: "active-focus",
      priority: "high",
      progress: 30,
      tags: JSON.stringify(["ai", "e-commerce", "automation"]),
    },
    {
      name: "Sports Intel Platform",
      description: "AI-powered sports analytics and intelligence platform",
      space: "bartlett-labs",
      status: "active-focus",
      priority: "high",
      progress: 15,
      tags: JSON.stringify(["ai", "sports", "analytics"]),
    },
    {
      name: "Plannotator",
      description: "Floor plan annotation and visualization tool",
      space: "bartlett-labs",
      status: "on-deck",
      priority: "medium",
      progress: 60,
      tags: JSON.stringify(["cad", "real-estate", "visualization"]),
    },
    {
      name: "HaraDaily",
      description: "Daily health and wellness tracking app",
      space: "bartlett-labs",
      status: "growing",
      priority: "medium",
      progress: 40,
      tags: JSON.stringify(["health", "mobile", "tracking"]),
    },
    {
      name: "gmail-brain",
      description: "AI-powered email management and insights",
      space: "bartlett-labs",
      status: "on-hold",
      priority: "low",
      progress: 80,
      tags: JSON.stringify(["ai", "email", "productivity"]),
    },
    {
      name: "JFDI",
      description: "Personal command center and life management system",
      space: "bartlett-labs",
      status: "active-focus",
      priority: "high",
      progress: 65,
      tags: JSON.stringify(["productivity", "dashboard", "ai"]),
    },
  ];

  for (const p of seedProjects) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO projects (id, name, description, space, status, priority, progress, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [uuidv4(), p.name, p.description, p.space, p.status, p.priority, p.progress, p.tags],
    });
  }

  console.log(`  ${seedProjects.length} projects`);

  // ──────────────────────── GOALS ────────────────────────

  console.log("Seeding goals...");

  const seedGoals = [
    {
      title: "Ship TuneUp MVP",
      description: "Get TuneUp to a usable MVP state with core automation features",
      category: "work",
      target: 100,
      current: 30,
      start: "2026-01-01",
      end: "2026-03-31",
    },
    {
      title: "Build JFDI System",
      description: "Complete personal command center to manage all workflows",
      category: "personal",
      target: 100,
      current: 65,
      start: "2026-01-15",
      end: "2026-02-28",
    },
    {
      title: "Exercise 4x/week",
      description: "Maintain consistent workout routine — gym, running, or swimming",
      category: "health",
      target: 100,
      current: 50,
      start: "2026-01-01",
      end: "2026-12-31",
    },
    {
      title: "Read 2 books/month",
      description: "Continuous learning through reading — mix of technical and non-fiction",
      category: "learning",
      target: 100,
      current: 25,
      start: "2026-01-01",
      end: "2026-12-31",
    },
    {
      title: "Complete Mandarin HSK4",
      description: "Reach HSK4 level Mandarin proficiency for work communication",
      category: "learning",
      target: 100,
      current: 40,
      start: "2025-09-01",
      end: "2026-06-30",
    },
    {
      title: "Bartlett Labs Revenue Target",
      description: "Reach first revenue milestone from side projects",
      category: "work",
      target: 100,
      current: 10,
      start: "2026-01-01",
      end: "2026-06-30",
    },
  ];

  for (const g of seedGoals) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO goals (id, title, description, category, target_percentage, current_percentage, period_start, period_end) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [uuidv4(), g.title, g.description, g.category, g.target, g.current, g.start, g.end],
    });
  }

  console.log(`  ${seedGoals.length} goals`);

  // ──────────────────────── REMINDERS ────────────────────────

  console.log("Seeding reminders...");

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const seedReminders = [
    { title: "Review JFDI PRD and test endpoints", category: "work", priority: "high", due_date: now.toISOString() },
    { title: "Set up Google OAuth redirect URI", category: "work", priority: "high", due_date: tomorrow.toISOString() },
    { title: "Connect personal and work Google accounts", category: "personal", priority: "medium", due_date: nextWeek.toISOString() },
    { title: "Follow up with design contractor", category: "work", priority: "medium", due_date: yesterday.toISOString() },
    { title: "Book dentist appointment", category: "personal", priority: "low", due_date: nextWeek.toISOString() },
    { title: "Review Anker Q1 product roadmap", category: "work", priority: "high", due_date: tomorrow.toISOString() },
    { title: "Order replacement keyboard", category: "errands", priority: "low", due_date: null },
  ];

  for (const r of seedReminders) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO reminders (id, title, category, priority, due_date) VALUES (?, ?, ?, ?, ?)`,
      args: [uuidv4(), r.title, r.category, r.priority, r.due_date],
    });
  }

  console.log(`  ${seedReminders.length} reminders`);

  // ──────────────────────── RELATIONSHIPS ────────────────────────

  console.log("Seeding relationships...");

  const threeWeeksAgo = new Date(now);
  threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
  const twoWeeksAgo = new Date(now);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const fiveDaysAgo = new Date(now);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const twoMonthsAgo = new Date(now);
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const relationshipIds: string[] = [];
  const seedRelationships = [
    {
      name: "Sarah Chen",
      email: "sarah.chen@example.com",
      phone: "+1-555-0101",
      type: "professional",
      priority: "high",
      last_contact: fiveDaysAgo.toISOString(),
      contact_frequency_days: 14,
      notes: "Product manager at Anker Innovation. Key stakeholder for IoT product line.\n\n## Context\n- Works closely with engineering team in Shenzhen\n- Prefers Lark for communication\n- Timezone: CST (UTC+8)",
      tags: JSON.stringify(["anker", "product", "stakeholder"]),
    },
    {
      name: "Marcus Johnson",
      email: "marcus.j@example.com",
      phone: "+1-555-0202",
      type: "close",
      priority: "high",
      last_contact: twoWeeksAgo.toISOString(),
      contact_frequency_days: 7,
      notes: "Co-founder of Bartlett Labs projects. Full-stack developer.\n\n## Ongoing\n- Collaborating on TuneUp Automation\n- Interested in Sports Intel Platform",
      tags: JSON.stringify(["bartlett-labs", "engineering", "co-founder"]),
    },
    {
      name: "Dr. Emily Zhao",
      email: "ezhao@example.com",
      type: "professional",
      priority: "medium",
      last_contact: threeWeeksAgo.toISOString(),
      contact_frequency_days: 30,
      notes: "AI researcher. Met at NeurIPS 2025. Expertise in NLP and recommendation systems.",
      tags: JSON.stringify(["ai", "research", "networking"]),
    },
    {
      name: "James Park",
      email: "jpark@example.com",
      phone: "+1-555-0303",
      type: "personal",
      priority: "medium",
      last_contact: twoMonthsAgo.toISOString(),
      contact_frequency_days: 21,
      notes: "College roommate. Lives in Seattle now. Works at Amazon on Alexa team.",
      tags: JSON.stringify(["personal", "amazon", "seattle"]),
    },
    {
      name: "Lisa Wang",
      email: "lisa.wang@example.com",
      type: "peripheral",
      priority: "low",
      last_contact: twoMonthsAgo.toISOString(),
      contact_frequency_days: 60,
      notes: "Met at Shenzhen startup meetup. Runs a logistics startup.",
      tags: JSON.stringify(["startup", "shenzhen", "logistics"]),
    },
    {
      name: "David Kim",
      email: "dkim@example.com",
      phone: "+1-555-0404",
      type: "professional",
      priority: "high",
      last_contact: fiveDaysAgo.toISOString(),
      contact_frequency_days: 7,
      notes: "Engineering manager at Anker. Direct report relationship.\n\n## 1-on-1 Notes\n- Discussed Q1 planning\n- Team expansion on track",
      tags: JSON.stringify(["anker", "manager", "engineering"]),
    },
  ];

  for (const rel of seedRelationships) {
    const id = uuidv4();
    relationshipIds.push(id);
    await client.execute({
      sql: `INSERT OR IGNORE INTO relationships (id, name, email, phone, type, priority, last_contact, contact_frequency_days, notes, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, rel.name, rel.email, rel.phone || null, rel.type, rel.priority,
        rel.last_contact, rel.contact_frequency_days, rel.notes, rel.tags,
      ],
    });
  }

  console.log(`  ${seedRelationships.length} relationships`);

  // ──────────────────────── INTERACTIONS ────────────────────────

  console.log("Seeding interactions...");

  const seedInteractions = [
    { relationship_id: relationshipIds[0], type: "meeting", notes: "Discussed Q1 product roadmap priorities" },
    { relationship_id: relationshipIds[0], type: "email", notes: "Sent follow-up on IoT feature specs" },
    { relationship_id: relationshipIds[1], type: "call", notes: "Brainstormed TuneUp architecture" },
    { relationship_id: relationshipIds[1], type: "contact", notes: "Quick sync on sprint progress" },
    { relationship_id: relationshipIds[3], type: "contact", notes: "Caught up over video call" },
    { relationship_id: relationshipIds[5], type: "meeting", notes: "Weekly 1-on-1 sync" },
  ];

  for (const int of seedInteractions) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO interactions (id, relationship_id, type, notes) VALUES (?, ?, ?, ?)`,
      args: [uuidv4(), int.relationship_id, int.type, int.notes],
    });
  }

  console.log(`  ${seedInteractions.length} interactions`);

  // ──────────────────────── MEETINGS ────────────────────────

  console.log("Seeding meetings...");

  const todayAt = (h: number, m: number) => {
    const d = new Date(now);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  const tomorrowAt = (h: number, m: number) => {
    const d = new Date(tomorrow);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  const seedMeetings = [
    {
      title: "JFDI Architecture Review",
      date: todayAt(10, 0),
      location: "Zoom",
      attendee_ids: JSON.stringify([relationshipIds[1]]),
      agenda: "## Agenda\n1. Review completed stages 1-8\n2. Discuss deployment strategy\n3. Plan testing approach\n4. Timeline for remaining work",
      status: "upcoming",
    },
    {
      title: "Weekly 1-on-1 with David",
      date: todayAt(14, 0),
      location: "Office - Room 3B",
      attendee_ids: JSON.stringify([relationshipIds[5]]),
      agenda: "## Agenda\n1. Sprint progress review\n2. Team concerns\n3. Q1 planning updates\n4. Career development check-in",
      status: "upcoming",
    },
    {
      title: "Product Roadmap Sync",
      date: tomorrowAt(9, 30),
      location: "Lark Meeting",
      attendee_ids: JSON.stringify([relationshipIds[0], relationshipIds[5]]),
      agenda: "## Agenda\n1. Q1 feature priorities\n2. Resource allocation\n3. Cross-team dependencies\n4. Customer feedback review",
      status: "upcoming",
    },
    {
      title: "TuneUp Sprint Planning",
      date: tomorrowAt(15, 0),
      location: "Zoom",
      attendee_ids: JSON.stringify([relationshipIds[1]]),
      agenda: "## Agenda\n1. Review backlog\n2. Estimate stories\n3. Set sprint goals\n4. Assign tasks",
      status: "upcoming",
    },
  ];

  for (const mtg of seedMeetings) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO meetings (id, title, date, location, attendee_ids, agenda, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [uuidv4(), mtg.title, mtg.date, mtg.location, mtg.attendee_ids, mtg.agenda, mtg.status],
    });
  }

  console.log(`  ${seedMeetings.length} meetings`);

  // ──────────────────────── KNOWLEDGE ────────────────────────

  console.log("Seeding knowledge entries...");

  const seedKnowledge = [
    {
      title: "Anker Proxy Setup Guide",
      source_url: null,
      content: "## Anker Corporate AI Proxy\n\n**Endpoint**: `https://ai-router.anker-in.com/v1/chat/completions`\n\n### Authentication\n- Use `Authorization: Bearer` header (NOT `x-api-key`)\n- Model names use `vertex_ai/` prefix\n\n### Compatibility Flags\n```json\n{\n  \"supportsStore\": false,\n  \"supportsDeveloperRole\": false,\n  \"supportsReasoningEffort\": false,\n  \"maxTokensField\": \"max_tokens\"\n}\n```\n\n### Available Models\n- `vertex_ai/claude-opus-4-6`\n- `vertex_ai/claude-sonnet-4-5-20250929`\n\n**Note**: VPN required — proxy only reachable on corporate VPN.",
      tags: JSON.stringify(["anker", "ai", "infrastructure", "proxy"]),
      related_people: JSON.stringify([relationshipIds[5]]),
    },
    {
      title: "Next.js App Router Best Practices",
      source_url: "https://nextjs.org/docs/app",
      content: "## Key Patterns\n\n1. **Server Components by default** — only add `\"use client\"` when needed\n2. **Route handlers** in `app/api/` for API endpoints\n3. **Loading states** via `loading.tsx` convention\n4. **Error boundaries** via `error.tsx` convention\n5. **Metadata** via `generateMetadata` or static `metadata` export\n\n## Data Fetching\n- Server components can fetch directly\n- Client components use `useEffect` or SWR/React Query\n- Route handlers for mutations (POST/PATCH/DELETE)",
      tags: JSON.stringify(["nextjs", "react", "web-dev", "reference"]),
      related_people: JSON.stringify([relationshipIds[1]]),
    },
    {
      title: "SQLite Performance Tips for Turso",
      source_url: "https://turso.tech/blog",
      content: "## Key Optimizations\n\n1. **Use `INSERT OR IGNORE`** to prevent duplicate key errors\n2. **Batch operations** with `executeMultiple()` for DDL\n3. **Parameterized queries** — always use `?` placeholders\n4. **Index frequently queried columns** (status, due_date, created_at)\n5. **WAL mode** is default in Turso — good for concurrent reads\n\n## Schema Tips\n- Store dates as ISO 8601 TEXT — consistent and sortable\n- Use TEXT for JSON arrays/objects (tags, connections)\n- Keep `created_at` and `updated_at` on every table",
      tags: JSON.stringify(["database", "turso", "sqlite", "performance"]),
      related_people: null,
    },
    {
      title: "Lark API Integration Notes",
      source_url: null,
      content: "## Lark MCP Setup\n\n- **App ID**: `cli_a8b661a5c9b85013`\n- **Domain**: `anker-in.sg.feishu.cn`\n- **Must use `useUAT: true`** for doc import\n\n## Working Scopes\n`docs:document:import docx:document bitable:app im:message im:chat drive:file:upload`\n\n## Gotchas\n- `file_name` limit: 27 characters max for `docx_builtin_import`\n- Token storage: `~/Library/Application Support/lark-mcp-nodejs/storage.json`",
      tags: JSON.stringify(["lark", "api", "integration", "anker"]),
      related_people: JSON.stringify([relationshipIds[0]]),
    },
    {
      title: "E-commerce Listing Optimization Research",
      source_url: "https://example.com/ecommerce-seo",
      content: "## Key Findings\n\n### Title Optimization\n- Front-load primary keywords\n- Include brand name, key specs, and use case\n- Optimal length: 80-150 characters\n\n### Image Requirements\n- Minimum 5 images per listing\n- Main image: white background, product fills 85%+\n- Lifestyle images perform 30% better than studio\n\n### Description Structure\n- Lead with benefits, not features\n- Use bullet points for scanability\n- Include comparison tables for technical products",
      tags: JSON.stringify(["e-commerce", "seo", "tuneup", "research"]),
      related_people: null,
    },
  ];

  for (const k of seedKnowledge) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO knowledge_entries (id, title, source_url, content, tags, related_people) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [uuidv4(), k.title, k.source_url, k.content, k.tags, k.related_people],
    });
  }

  console.log(`  ${seedKnowledge.length} knowledge entries`);

  // ──────────────────────── SPARK ────────────────────────

  console.log("Seeding spark entries...");

  const seedSparks = [
    {
      content: "What if JFDI could auto-generate meeting prep by pulling context from relationships, recent interactions, and linked projects? The AI already knows who you're meeting — it should surface relevant history.",
      tags: JSON.stringify(["jfdi", "ai", "meetings", "feature-idea"]),
      connections: JSON.stringify(["JFDI", "meetings"]),
    },
    {
      content: "TuneUp could offer a 'competitor analysis' mode — scrape competing listings and highlight what they do better. Combine with AI suggestions for improvement.",
      tags: JSON.stringify(["tuneup", "ai", "competitive-analysis"]),
      connections: JSON.stringify(["TuneUp Automation"]),
    },
    {
      content: "Build a 'relationship graph' visualization — show connections between people, projects, and knowledge entries. Could reveal blind spots in network.",
      tags: JSON.stringify(["jfdi", "visualization", "relationships", "graph"]),
      connections: JSON.stringify(["JFDI", "relationships"]),
    },
    {
      content: "Morning briefing email/notification: summarize today's meetings, overdue reminders, goals that need attention, and contacts that are overdue for a check-in. Could be a daily cron + email or push notification.",
      tags: JSON.stringify(["jfdi", "automation", "notifications"]),
      connections: JSON.stringify(["JFDI", "reminders", "meetings"]),
    },
    {
      content: "Idea: 'Spark connections' feature — when you add a spark, AI suggests which existing sparks, projects, or knowledge entries might be related. Creates a web of ideas over time.",
      tags: JSON.stringify(["jfdi", "ai", "spark", "meta"]),
      connections: JSON.stringify(["JFDI", "knowledge"]),
    },
    {
      content: "Sports Intel could use real-time odds movement as a signal for model calibration. If the market moves against our prediction, that's valuable feedback data.",
      tags: JSON.stringify(["sports-intel", "data", "odds", "calibration"]),
      connections: JSON.stringify(["Sports Intel Platform"]),
    },
    {
      content: "HaraDaily integration with Apple Health — sync workout data automatically instead of manual entry. Could also pull sleep data for correlation analysis.",
      tags: JSON.stringify(["haradaily", "apple-health", "integration"]),
      connections: JSON.stringify(["HaraDaily"]),
    },
  ];

  for (const s of seedSparks) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO spark_entries (id, content, tags, connections) VALUES (?, ?, ?, ?)`,
      args: [uuidv4(), s.content, s.tags, s.connections],
    });
  }

  console.log(`  ${seedSparks.length} spark entries`);

  // ──────────────────────── SUMMARY ────────────────────────

  console.log("\nDone! Database seeded successfully.");
  console.log("  Summary:");
  console.log(`    Projects:      ${seedProjects.length}`);
  console.log(`    Goals:         ${seedGoals.length}`);
  console.log(`    Reminders:     ${seedReminders.length}`);
  console.log(`    Relationships: ${seedRelationships.length}`);
  console.log(`    Interactions:  ${seedInteractions.length}`);
  console.log(`    Meetings:      ${seedMeetings.length}`);
  console.log(`    Knowledge:     ${seedKnowledge.length}`);
  console.log(`    Sparks:        ${seedSparks.length}`);
}

seed().catch(console.error);
