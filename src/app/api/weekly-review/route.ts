import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, reminders, goals, meetings, projects } from "@/lib/schema";
import { sql, eq, and, gte, lte, count } from "drizzle-orm";

function getWeekRange(offset = 0) {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek - offset * 7);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return {
    start: startOfWeek.toISOString(),
    end: endOfWeek.toISOString(),
    startDate: startOfWeek,
    endDate: endOfWeek,
  };
}

function getDayLabels(startDate: Date): string[] {
  const labels: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    labels.push(
      d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    );
  }
  return labels;
}

function dayIndex(dateStr: string, weekStart: Date): number {
  const d = new Date(dateStr);
  const diff = Math.floor(
    (d.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, Math.min(6, diff));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const weekOffset = parseInt(searchParams.get("offset") || "0");

  const thisWeek = getWeekRange(weekOffset);
  const lastWeek = getWeekRange(weekOffset + 1);

  // Tasks completed this week
  const completedTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.status, "done"),
        gte(tasks.updated_at, thisWeek.start),
        lte(tasks.updated_at, thisWeek.end)
      )
    );

  // Tasks completed last week (for comparison)
  const lastWeekCompleted = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.status, "done"),
        gte(tasks.updated_at, lastWeek.start),
        lte(tasks.updated_at, lastWeek.end)
      )
    );

  // Reminders completed this week
  const completedReminders = await db
    .select()
    .from(reminders)
    .where(
      and(
        eq(reminders.status, "completed"),
        gte(reminders.updated_at, thisWeek.start),
        lte(reminders.updated_at, thisWeek.end)
      )
    );

  // Tasks created this week
  const createdTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        gte(tasks.created_at, thisWeek.start),
        lte(tasks.created_at, thisWeek.end)
      )
    );

  // Meetings this week
  const weekMeetings = await db
    .select()
    .from(meetings)
    .where(
      and(
        gte(meetings.date, thisWeek.start),
        lte(meetings.date, thisWeek.end)
      )
    );

  // All goals for progress snapshot
  const allGoals = await db.select().from(goals);

  // Active projects
  const activeProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.status, "active-focus"));

  // Build daily breakdown for task completions
  const dailyCompleted = Array(7).fill(0);
  const dailyCreated = Array(7).fill(0);

  for (const t of completedTasks) {
    const idx = dayIndex(t.updated_at, thisWeek.startDate);
    dailyCompleted[idx]++;
  }

  for (const t of createdTasks) {
    const idx = dayIndex(t.created_at, thisWeek.startDate);
    dailyCreated[idx]++;
  }

  // Priority breakdown of completed tasks
  const priorityBreakdown = { high: 0, medium: 0, low: 0 };
  for (const t of completedTasks) {
    const p = (t.priority || "medium") as keyof typeof priorityBreakdown;
    if (p in priorityBreakdown) priorityBreakdown[p]++;
  }

  // Project progress (tasks per project)
  const projectStats: Record<string, { name: string; completed: number; total: number }> = {};
  const allProjectTasks = await db.select().from(tasks);
  for (const t of allProjectTasks) {
    const projId = t.project_id || "__unassigned";
    if (!projectStats[projId]) {
      const proj = activeProjects.find((p) => p.id === projId);
      projectStats[projId] = {
        name: proj?.name || (projId === "__unassigned" ? "Unassigned" : projId),
        completed: 0,
        total: 0,
      };
    }
    projectStats[projId].total++;
    if (t.status === "done") projectStats[projId].completed++;
  }

  // Compute week-over-week change
  const tasksChange = completedTasks.length - lastWeekCompleted.length;
  const tasksChangePercent =
    lastWeekCompleted.length > 0
      ? Math.round(((completedTasks.length - lastWeekCompleted.length) / lastWeekCompleted.length) * 100)
      : completedTasks.length > 0
        ? 100
        : 0;

  // Productivity score (0-100)
  const taskScore = Math.min(completedTasks.length * 5, 40);
  const reminderScore = Math.min(completedReminders.length * 3, 20);
  const meetingScore = Math.min(weekMeetings.length * 5, 20);
  const goalScore = allGoals.length > 0
    ? Math.round((allGoals.reduce((sum, g) => sum + (g.current_percentage || 0), 0) / allGoals.length / 100) * 20)
    : 0;
  const productivityScore = Math.min(taskScore + reminderScore + meetingScore + goalScore, 100);

  const dayLabels = getDayLabels(thisWeek.startDate);

  return NextResponse.json({
    weekLabel: `${thisWeek.startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} — ${thisWeek.endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`,
    offset: weekOffset,
    productivityScore,
    stats: {
      tasksCompleted: completedTasks.length,
      tasksCreated: createdTasks.length,
      remindersCompleted: completedReminders.length,
      meetingsHeld: weekMeetings.length,
      activeProjects: activeProjects.length,
      goalsOnTrack: allGoals.filter((g) => (g.current_percentage || 0) >= 50).length,
      totalGoals: allGoals.length,
    },
    comparison: {
      lastWeekTasks: lastWeekCompleted.length,
      change: tasksChange,
      changePercent: tasksChangePercent,
    },
    dailyBreakdown: {
      labels: dayLabels,
      completed: dailyCompleted,
      created: dailyCreated,
    },
    priorityBreakdown,
    topProjects: Object.values(projectStats)
      .filter((p) => p.total > 0)
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 6),
    goals: allGoals.map((g) => ({
      id: g.id,
      title: g.title,
      category: g.category,
      current: g.current_percentage || 0,
      target: g.target_percentage || 100,
    })),
    recentCompletions: completedTasks
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10)
      .map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        completedAt: t.updated_at,
        project: t.project_id,
      })),
  });
}
