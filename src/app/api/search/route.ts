import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reminders, projects, goals, relationships, meetings } from "@/lib/schema";
import { like, and, ne } from "drizzle-orm";

interface SearchResult {
  id: string;
  type: "reminder" | "project" | "goal" | "relationship" | "meeting";
  title: string;
  subtitle?: string;
  icon: string;
  href: string;
  priority?: string;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim().toLowerCase();
  if (!q || q.length < 1) {
    return NextResponse.json([]);
  }

  const pattern = `%${q}%`;
  const results: SearchResult[] = [];

  try {
    // Search reminders (non-completed)
    const reminderResults = await db
      .select()
      .from(reminders)
      .where(and(like(reminders.title, pattern), ne(reminders.status, "completed")))
      .limit(5)
      .all();

    for (const r of reminderResults) {
      results.push({
        id: `reminder-${r.id}`,
        type: "reminder",
        title: r.title,
        subtitle: r.due_date
          ? `Due: ${new Date(r.due_date).toLocaleDateString()}`
          : r.category || undefined,
        icon: "🔔",
        href: "/reminders",
        priority: r.priority || undefined,
      });
    }

    // Search projects
    const projectResults = await db
      .select()
      .from(projects)
      .where(like(projects.name, pattern))
      .limit(5)
      .all();

    for (const p of projectResults) {
      results.push({
        id: `project-${p.id}`,
        type: "project",
        title: p.name,
        subtitle: p.space
          ? `${p.space} · ${p.progress || 0}%`
          : `${p.progress || 0}%`,
        icon: "📁",
        href: "/projects",
        priority: p.priority || undefined,
      });
    }

    // Search goals
    const goalResults = await db
      .select()
      .from(goals)
      .where(like(goals.title, pattern))
      .limit(5)
      .all();

    for (const g of goalResults) {
      results.push({
        id: `goal-${g.id}`,
        type: "goal",
        title: g.title,
        subtitle: `${g.current_percentage || 0}% of ${g.target_percentage || 100}%`,
        icon: "🎯",
        href: "/goals",
      });
    }

    // Search relationships
    const relationshipResults = await db
      .select()
      .from(relationships)
      .where(like(relationships.name, pattern))
      .limit(5)
      .all();

    for (const r of relationshipResults) {
      results.push({
        id: `relationship-${r.id}`,
        type: "relationship",
        title: r.name,
        subtitle: r.type || undefined,
        icon: "👤",
        href: `/relationships/${r.id}`,
      });
    }

    // Search meetings
    const meetingResults = await db
      .select()
      .from(meetings)
      .where(like(meetings.title, pattern))
      .limit(5)
      .all();

    for (const m of meetingResults) {
      results.push({
        id: `meeting-${m.id}`,
        type: "meeting",
        title: m.title,
        subtitle: m.date
          ? new Date(m.date).toLocaleDateString()
          : undefined,
        icon: "📅",
        href: `/meetings/${m.id}`,
      });
    }
  } catch (error) {
    console.error("Search error:", error);
    // Return whatever results we have
  }

  return NextResponse.json(results);
}
