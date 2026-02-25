import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.OPS_DB_PATH || path.join(process.cwd(), 'data', 'ops.db');

let db: Database.Database | null = null;

export function getOpsDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeOpsDb(db);
  }
  return db;
}

function initializeOpsDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      priority TEXT DEFAULT 'P2' CHECK(priority IN ('P0','P1','P2','P3','P4')),
      status TEXT DEFAULT 'Backlog' CHECK(status IN ('Backlog','In Progress','Review','Done')),
      owner TEXT DEFAULT '',
      due_date TEXT DEFAULT '',
      linked_files TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ideas (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      potential_revenue TEXT DEFAULT '',
      effort TEXT DEFAULT 'M' CHECK(effort IN ('S','M','L','XL')),
      source TEXT DEFAULT '',
      status TEXT DEFAULT 'New' CHECK(status IN ('New','Evaluating','Approved','Rejected')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pipeline (
      id TEXT PRIMARY KEY,
      business_name TEXT NOT NULL,
      contact TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      website TEXT DEFAULT '',
      industry TEXT DEFAULT '',
      location TEXT DEFAULT '',
      estimated_value TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      last_contact_date TEXT DEFAULT '',
      status TEXT DEFAULT 'Lead' CHECK(status IN ('Lead','Contacted','Responded','Proposal','Negotiating','Won','Lost')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      prompt_text TEXT DEFAULT '',
      category TEXT DEFAULT 'Development' CHECK(category IN ('Outreach','Content','Development','Research','Client Work')),
      tags TEXT DEFAULT '',
      usage_count INTEGER DEFAULT 0,
      last_used TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS queues (
      id TEXT PRIMARY KEY,
      queue_type TEXT NOT NULL CHECK(queue_type IN ('kyle','knox')),
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      priority TEXT DEFAULT 'P2' CHECK(priority IN ('P0','P1','P2','P3','P4')),
      requested_by TEXT DEFAULT '',
      status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending','Reviewed','Done')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS agent_tasks (
      id TEXT PRIMARY KEY,
      agent_name TEXT NOT NULL CHECK(agent_name IN ('Stack','Pulse','Scout','Reach','Bridge','Forge','Wire','Knox')),
      task_description TEXT DEFAULT '',
      status TEXT DEFAULT 'Queued' CHECK(status IN ('Queued','Running','Completed','Failed')),
      deployed_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT DEFAULT '',
      result_summary TEXT DEFAULT '',
      performance_notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL CHECK(event_type IN ('agent_deploy','agent_complete','agent_fail','project_update','prospect_update','idea_added','queue_action','milestone','note','system')),
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      source TEXT DEFAULT '',
      icon TEXT DEFAULT '📌',
      starred INTEGER DEFAULT 0,
      pinned INTEGER DEFAULT 0,
      metadata TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS daily_metrics (
      id TEXT PRIMARY KEY,
      metric_date TEXT NOT NULL,
      agents_deployed INTEGER DEFAULT 0,
      tasks_completed INTEGER DEFAULT 0,
      prospects_contacted INTEGER DEFAULT 0,
      ideas_logged INTEGER DEFAULT 0,
      revenue_closed REAL DEFAULT 0,
      active_streak INTEGER DEFAULT 0,
      mood TEXT DEFAULT 'grinding',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
    CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
    CREATE INDEX IF NOT EXISTS idx_pipeline_status ON pipeline(status);
    CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts(category);
    CREATE INDEX IF NOT EXISTS idx_queues_type ON queues(queue_type);
    CREATE INDEX IF NOT EXISTS idx_queues_status ON queues(status);
    CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
    CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent ON agent_tasks(agent_name);
    CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(event_type);
    CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_activity_log_starred ON activity_log(starred);
    CREATE INDEX IF NOT EXISTS idx_activity_log_pinned ON activity_log(pinned);
    CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(metric_date);

    CREATE TABLE IF NOT EXISTS daily_habits (
      id TEXT PRIMARY KEY,
      habit_date TEXT NOT NULL,
      habit_key TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      streak_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      badge_key TEXT NOT NULL UNIQUE,
      badge_name TEXT NOT NULL,
      badge_icon TEXT DEFAULT '🏅',
      unlocked_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS revenue_entries (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      source TEXT NOT NULL CHECK(source IN ('consulting','contract','website','social_media','template','pod','kdp','custom_ai','agent','other')),
      client_name TEXT DEFAULT '',
      description TEXT DEFAULT '',
      revenue_type TEXT DEFAULT 'one-time' CHECK(revenue_type IN ('recurring','one-time','project')),
      revenue_date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue_entries(revenue_date);
    CREATE INDEX IF NOT EXISTS idx_revenue_source ON revenue_entries(source);

    CREATE INDEX IF NOT EXISTS idx_daily_habits_date ON daily_habits(habit_date);
    CREATE INDEX IF NOT EXISTS idx_daily_habits_key ON daily_habits(habit_key);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_habits_unique ON daily_habits(habit_date, habit_key);
    CREATE INDEX IF NOT EXISTS idx_achievements_key ON achievements(badge_key);
  `);

  // Migration: add daily_focus column to daily_metrics if it doesn't exist
  const columns = db.prepare("PRAGMA table_info(daily_metrics)").all() as { name: string }[];
  if (!columns.some(c => c.name === 'daily_focus')) {
    db.exec("ALTER TABLE daily_metrics ADD COLUMN daily_focus TEXT DEFAULT '[]'");
  }
}
