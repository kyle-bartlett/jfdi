"use client";

import { useEffect, useState, useCallback } from "react";
import { PrioritiesWidget } from "@/components/dashboard-widgets/priorities-widget";
import { TasksWidget } from "@/components/dashboard-widgets/tasks-widget";
import { CalendarWidget } from "@/components/dashboard-widgets/calendar-widget";
import { ProjectsWidget } from "@/components/dashboard-widgets/projects-widget";
import { GoalsWidget } from "@/components/dashboard-widgets/goals-widget";
import { RelationshipsWidget } from "@/components/dashboard-widgets/relationships-widget";
import { MeetingsWidget } from "@/components/dashboard-widgets/meetings-widget";
import { EmailWidget } from "@/components/dashboard-widgets/email-widget";
import { WeatherWidget } from "@/components/dashboard-widgets/weather-widget";
import { LarkWidget } from "@/components/dashboard-widgets/lark-widget";
import { useToast } from "@/components/ui/toast";

interface ReminderItem {
  id: string;
  title: string;
  priority: string;
  due_date: string | null;
  _urgency: "overdue" | "today";
}

interface ProjectItem {
  id: string;
  name: string;
  space: string;
  progress: number;
  status: string;
}

interface TaskItem {
  id: string;
  title: string;
  project_id: string | null;
  project_name: string | null;
  status: string;
  priority: string;
  due_date: string | null;
}

interface RelationshipItem {
  id: string;
  name: string;
  type: string;
  days_since_contact: number | null;
}

interface GoalItem {
  id: string;
  title: string;
  category: string;
  current_percentage: number;
  target_percentage: number;
}

interface WeatherData {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  description: string;
  icon: string;
  wind_speed: number;
  city?: string;
}

interface LarkMessages {
  total: number;
  today: number;
  recent: Array<{ sender: string; text: string; timestamp: string }>;
}

interface DashboardData {
  reminders: {
    pending: number;
    overdue: number;
    today: number;
    items: ReminderItem[];
  };
  projects: { active: number; total: number; items: ProjectItem[] };
  tasks: { today: number; items: TaskItem[] };
  relationships: {
    needsAttention: number;
    total: number;
    items: RelationshipItem[];
  };
  meetings: {
    today: number;
    upcoming: number;
    items?: Array<{
      id: string;
      title: string;
      date: string;
      location?: string | null;
      status: string;
    }>;
  };
  goals: { onTrack: number; total: number; items: GoalItem[] };
  calendar: Array<{
    id: string;
    title: string;
    start: string;
    end: string;
    source?: "google" | "lark";
    account?: string;
    htmlLink?: string | null;
    hangoutLink?: string | null;
    location?: string | null;
  }>;
  emails: {
    unread: number;
    actionNeeded: number;
    accounts?: Array<{ email: string; unread: number; actionNeeded: number }>;
  };
  weather: WeatherData | null;
  larkMessages?: LarkMessages | null;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json);
    } catch {
      toast("Failed to load dashboard", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Quick add actions
  const quickAddReminder = async (title: string) => {
    try {
      await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, priority: "medium", category: "personal" }),
      });
      toast("Reminder added");
      await loadData();
    } catch {
      toast("Failed to add reminder", "error");
    }
  };

  const quickAddTask = async (title: string) => {
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, priority: "medium", status: "todo" }),
      });
      toast("Task added");
      await loadData();
    } catch {
      toast("Failed to add task", "error");
    }
  };

  // Quick actions
  const completeReminder = async (id: string) => {
    try {
      await fetch(`/api/reminders?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      toast("Reminder completed");
      await loadData();
    } catch {
      toast("Failed to complete reminder", "error");
    }
  };

  const completeTask = async (id: string) => {
    try {
      await fetch(`/api/tasks?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });
      toast("Task completed");
      await loadData();
    } catch {
      toast("Failed to complete task", "error");
    }
  };

  const completeAllTasks = async (ids: string[]) => {
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/tasks?id=${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "done" }),
          })
        )
      );
      toast(`${ids.length} tasks completed`);
      await loadData();
    } catch {
      toast("Failed to complete tasks", "error");
    }
  };

  const markContacted = async (id: string) => {
    try {
      await fetch(`/api/relationships?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          last_contact: new Date().toISOString(),
        }),
      });
      toast("Contact updated");
      await loadData();
    } catch {
      toast("Failed to update contact", "error");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Good {getTimeOfDay()}, Kyle</h1>
          <p className="text-muted-foreground mt-1">{today}</p>
        </div>
        {data?.weather && <WeatherWidget weather={data.weather} />}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="widget animate-pulse h-48" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <PrioritiesWidget
            items={data?.reminders.items || []}
            overdue={data?.reminders.overdue ?? 0}
            today={data?.reminders.today ?? 0}
            pending={data?.reminders.pending ?? 0}
            onComplete={completeReminder}
            onQuickAdd={quickAddReminder}
          />

          <TasksWidget
            items={data?.tasks.items || []}
            todayCount={data?.tasks.today ?? 0}
            onComplete={completeTask}
            onCompleteAll={completeAllTasks}
            onQuickAdd={quickAddTask}
          />

          <CalendarWidget events={data?.calendar || []} />

          <ProjectsWidget
            items={data?.projects.items || []}
            active={data?.projects.active ?? 0}
            total={data?.projects.total ?? 0}
          />

          <GoalsWidget
            items={data?.goals.items || []}
            onTrack={data?.goals.onTrack ?? 0}
            total={data?.goals.total ?? 0}
          />

          <RelationshipsWidget
            items={data?.relationships.items || []}
            needsAttention={data?.relationships.needsAttention ?? 0}
            total={data?.relationships.total ?? 0}
            onContacted={markContacted}
          />

          <EmailWidget
            unread={data?.emails?.unread ?? 0}
            actionNeeded={data?.emails?.actionNeeded ?? 0}
            accounts={data?.emails?.accounts}
          />

          <MeetingsWidget
            today={data?.meetings.today ?? 0}
            upcoming={data?.meetings.upcoming ?? 0}
            items={data?.meetings.items}
          />

          {data?.larkMessages && <LarkWidget messages={data.larkMessages} />}
        </div>
      )}
    </div>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
