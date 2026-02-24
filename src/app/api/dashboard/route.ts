import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  reminders,
  projects,
  tasks,
  relationships,
  meetings,
  goals,
} from "@/lib/schema";
import { getTodayEvents } from "@/lib/google/calendar";
import { getEmailStats } from "@/lib/google/gmail";
import { getConnectedAccounts } from "@/lib/google/oauth";
import { getLarkTodayEvents, isLarkConfigured } from "@/lib/lark/client";
import { getCurrentWeather } from "@/lib/weather";
import {
  isAgentXConfigured,
  getMessageStats,
  getRecentMessages,
} from "@/lib/lark/agentx";

export async function GET() {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Reminders
  const allReminders = await db.select().from(reminders).all();
  const pendingReminders = allReminders.filter((r) => r.status === "pending");
  const overdueReminders = pendingReminders.filter(
    (r) => r.due_date && new Date(r.due_date) < now,
  );
  const todayReminders = pendingReminders.filter((r) => {
    if (!r.due_date) return false;
    const d = r.due_date.split("T")[0];
    return d === todayStr;
  });

  // Projects
  const allProjects = await db.select().from(projects).all();
  const activeProjects = allProjects.filter((r) => r.status === "active-focus");

  // Tasks - today's tasks across all projects
  const allTasks = await db.select().from(tasks).all();
  const todayTasks = allTasks.filter((t) => {
    if (t.status === "done") return false;
    if (!t.due_date) return t.status === "in-progress"; // include in-progress tasks without dates
    const d = t.due_date.split("T")[0];
    return d <= todayStr; // due today or overdue
  });

  // Build project name lookup for task context
  const projectNameMap = new Map(allProjects.map((p) => [p.id, p.name]));

  // Relationships
  const allRelationships = await db.select().from(relationships).all();
  const needsAttention = allRelationships
    .filter((r) => {
      if (!r.last_contact) return true;
      const daysSince = Math.floor(
        (Date.now() - new Date(r.last_contact).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      return daysSince > (r.contact_frequency_days || 30);
    })
    .map((r) => {
      const daysSince = r.last_contact
        ? Math.floor(
            (Date.now() - new Date(r.last_contact).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null;
      return { ...r, days_since_contact: daysSince };
    });

  // Meetings
  const allMeetings = await db.select().from(meetings).all();
  const todayMeetings = allMeetings.filter((m) => {
    const d = m.date.split("T")[0];
    return d === todayStr && m.status === "upcoming";
  });
  const upcomingMeetings = allMeetings.filter((m) => m.status === "upcoming");

  // Goals
  const allGoals = await db.select().from(goals).all();
  const onTrackGoals = allGoals.filter(
    (g) => (g.current_percentage || 0) >= (g.target_percentage || 100) * 0.5,
  );

  // Calendar events — merge Google + Lark (both gracefully fail)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let calendarEvents: any[] = [];

  // Google Calendar
  try {
    const googleEvents = await getTodayEvents();
    calendarEvents.push(
      ...googleEvents.map((e) => ({ ...e, source: "google" })),
    );
  } catch {
    // Not connected to Google - that's fine
  }

  // Lark Calendar
  if (isLarkConfigured()) {
    try {
      const larkEvents = await getLarkTodayEvents();
      calendarEvents.push(...larkEvents);
    } catch {
      // Lark not available - that's fine
    }
  }

  // Sort all events by start time
  calendarEvents.sort((a, b) => {
    const aTime = a.start ? new Date(a.start).getTime() : 0;
    const bTime = b.start ? new Date(b.start).getTime() : 0;
    return aTime - bTime;
  });

  // Email stats per connected account (graceful failure)
  const emailAccounts: Array<{
    email: string;
    unread: number;
    actionNeeded: number;
  }> = [];
  try {
    const accounts = await getConnectedAccounts();
    for (const acct of accounts) {
      try {
        const stats = await getEmailStats(acct.email);
        if (stats) {
          emailAccounts.push({
            email: acct.email,
            unread: stats.unreadCount,
            actionNeeded: stats.unreadCount,
          });
        }
      } catch {
        // This account's Gmail not accessible
      }
    }
  } catch {
    // Not connected
  }
  const emailStats = {
    unread: emailAccounts.reduce((sum, a) => sum + a.unread, 0),
    actionNeeded: emailAccounts.reduce((sum, a) => sum + a.actionNeeded, 0),
    accounts: emailAccounts,
  };

  // Weather (graceful failure)
  let weather = null;
  try {
    weather = await getCurrentWeather();
  } catch {
    // Weather not available
  }

  // LarkAgentX messages (optional)
  let larkMessages = null;
  if (isAgentXConfigured()) {
    try {
      const [stats, recent] = await Promise.all([
        getMessageStats(),
        getRecentMessages(3),
      ]);
      if (stats) {
        larkMessages = { total: stats.total, today: stats.today, recent };
      }
    } catch {
      // LarkAgentX not reachable
    }
  }

  return NextResponse.json({
    reminders: {
      pending: pendingReminders.length,
      overdue: overdueReminders.length,
      today: todayReminders.length,
      items: [
        ...overdueReminders
          .slice(0, 5)
          .map((r) => ({ ...r, _urgency: "overdue" })),
        ...todayReminders.slice(0, 5).map((r) => ({ ...r, _urgency: "today" })),
      ].slice(0, 5),
    },
    projects: {
      active: activeProjects.length,
      total: allProjects.length,
      items: activeProjects.slice(0, 5).map((p) => ({
        id: p.id,
        name: p.name,
        space: p.space,
        progress: p.progress || 0,
        status: p.status,
      })),
    },
    tasks: {
      today: todayTasks.length,
      items: todayTasks.slice(0, 8).map((t) => ({
        id: t.id,
        title: t.title,
        project_id: t.project_id,
        project_name: t.project_id ? projectNameMap.get(t.project_id) || null : null,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
      })),
    },
    relationships: {
      needsAttention: needsAttention.length,
      total: allRelationships.length,
      items: needsAttention.slice(0, 5).map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        days_since_contact: r.days_since_contact,
      })),
    },
    meetings: {
      today: todayMeetings.length,
      upcoming: upcomingMeetings.length,
      items: upcomingMeetings.slice(0, 5).map((m) => ({
        id: m.id,
        title: m.title,
        date: m.date,
        location: m.location,
        status: m.status,
      })),
    },
    goals: {
      onTrack: onTrackGoals.length,
      total: allGoals.length,
      items: allGoals.slice(0, 5).map((g) => ({
        id: g.id,
        title: g.title,
        category: g.category,
        current_percentage: g.current_percentage || 0,
        target_percentage: g.target_percentage || 100,
      })),
    },
    calendar: calendarEvents,
    emails: emailStats,
    weather,
    larkMessages,
  });
}
