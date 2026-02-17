import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const reminders = sqliteTable("reminders", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  due_date: text("due_date"),
  status: text("status", { enum: ["pending", "snoozed", "completed"] }).notNull().default("pending"),
  priority: text("priority", { enum: ["high", "medium", "low"] }).default("medium"),
  category: text("category", { enum: ["work", "personal", "follow-up", "errands", "learning"] }).default("personal"),
  snoozed_until: text("snoozed_until"),
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
  updated_at: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  space: text("space", { enum: ["anker", "personal", "bartlett-labs"] }).default("personal"),
  status: text("status", { enum: ["active-focus", "on-deck", "growing", "on-hold", "completed"] }).default("active-focus"),
  priority: text("priority", { enum: ["high", "medium", "low"] }).default("medium"),
  progress: integer("progress").default(0),
  tags: text("tags"), // JSON array
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
  updated_at: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  project_id: text("project_id").references(() => projects.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["todo", "in-progress", "done", "blocked"] }).default("todo"),
  due_date: text("due_date"),
  assignee: text("assignee"),
  priority: text("priority", { enum: ["high", "medium", "low"] }).default("medium"),
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
  updated_at: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const relationships = sqliteTable("relationships", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  type: text("type", { enum: ["close", "peripheral", "casual", "personal", "professional"] }).default("casual"),
  priority: text("priority", { enum: ["high", "medium", "low"] }).default("medium"),
  last_contact: text("last_contact"),
  contact_frequency_days: integer("contact_frequency_days").default(30),
  notes: text("notes"), // Markdown notes stored directly in DB
  notes_path: text("notes_path"), // Legacy — kept for migration
  tags: text("tags"), // JSON array
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
  updated_at: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const interactions = sqliteTable("interactions", {
  id: text("id").primaryKey(),
  relationship_id: text("relationship_id").references(() => relationships.id),
  type: text("type", { enum: ["contact", "meeting", "email", "call"] }).default("contact"),
  notes: text("notes"),
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const meetings = sqliteTable("meetings", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  location: text("location"),
  attendee_ids: text("attendee_ids"), // JSON array
  calendar_event_id: text("calendar_event_id"),
  agenda: text("agenda"), // Markdown
  prep_notes: text("prep_notes"), // Markdown — stored directly in DB
  debrief_notes: text("debrief_notes"), // Markdown — stored directly in DB
  action_items: text("action_items"), // JSON array
  prep_notes_path: text("prep_notes_path"), // Legacy
  debrief_notes_path: text("debrief_notes_path"), // Legacy
  status: text("status", { enum: ["upcoming", "completed"] }).default("upcoming"),
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
  updated_at: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const knowledgeEntries = sqliteTable("knowledge_entries", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  source_url: text("source_url"),
  content_path: text("content_path"),
  content: text("content"),
  tags: text("tags"), // JSON array
  related_people: text("related_people"), // JSON array
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const sparkEntries = sqliteTable("spark_entries", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  tags: text("tags"), // JSON array
  connections: text("connections"), // JSON array
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const goals = sqliteTable("goals", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category", { enum: ["work", "personal", "health", "learning"] }).default("personal"),
  target_percentage: real("target_percentage").default(100),
  current_percentage: real("current_percentage").default(0),
  period_start: text("period_start"),
  period_end: text("period_end"),
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
  updated_at: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const dashboardSnapshots = sqliteTable("dashboard_snapshots", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  data: text("data").notNull(), // JSON
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const googleTokens = sqliteTable("google_tokens", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  access_token: text("access_token").notNull(),
  refresh_token: text("refresh_token"),
  expiry: text("expiry"),
  scopes: text("scopes"),
  created_at: text("created_at").notNull().default(sql`(datetime('now'))`),
  updated_at: text("updated_at").notNull().default(sql`(datetime('now'))`),
});
