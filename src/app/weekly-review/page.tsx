"use client";

import { useEffect, useState, useCallback } from "react";

interface WeeklyData {
  weekLabel: string;
  offset: number;
  productivityScore: number;
  stats: {
    tasksCompleted: number;
    tasksCreated: number;
    remindersCompleted: number;
    meetingsHeld: number;
    activeProjects: number;
    goalsOnTrack: number;
    totalGoals: number;
  };
  comparison: {
    lastWeekTasks: number;
    change: number;
    changePercent: number;
  };
  dailyBreakdown: {
    labels: string[];
    completed: number[];
    created: number[];
  };
  priorityBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
  topProjects: Array<{
    name: string;
    completed: number;
    total: number;
  }>;
  goals: Array<{
    id: string;
    title: string;
    category: string;
    current: number;
    target: number;
  }>;
  recentCompletions: Array<{
    id: string;
    title: string;
    priority: string;
    completedAt: string;
    project: string | null;
  }>;
}

// ─── Circular Progress Ring ─────────────────────────────────────────
function ProgressRing({
  score,
  size = 160,
  strokeWidth = 12,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const [animated, setAnimated] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animated / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const getColor = (s: number) => {
    if (s >= 80) return "hsl(var(--accent))";
    if (s >= 50) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  const getGrade = (s: number) => {
    if (s >= 90) return "S";
    if (s >= 80) return "A";
    if (s >= 70) return "B";
    if (s >= 50) return "C";
    if (s >= 30) return "D";
    return "F";
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(animated)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-foreground">{animated}</span>
        <span className="text-xs text-muted-foreground font-medium">
          Grade: {getGrade(animated)}
        </span>
      </div>
    </div>
  );
}

// ─── Bar Chart ──────────────────────────────────────────────────────
function BarChart({
  labels,
  datasets,
}: {
  labels: string[];
  datasets: Array<{ data: number[]; color: string; label: string }>;
}) {
  const allValues = datasets.flatMap((d) => d.data);
  const max = Math.max(...allValues, 1);

  return (
    <div>
      <div className="flex items-end gap-2 h-40 mb-2">
        {labels.map((label, i) => {
          const isToday = i === new Date().getDay();
          return (
            <div key={label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div className="flex gap-[2px] items-end h-full w-full justify-center">
                {datasets.map((ds, di) => {
                  const val = ds.data[i] || 0;
                  const height = max > 0 ? Math.max((val / max) * 100, val > 0 ? 8 : 0) : 0;
                  return (
                    <div
                      key={di}
                      className="relative group flex-1 max-w-5 rounded-t transition-all duration-500"
                      style={{
                        height: `${height}%`,
                        backgroundColor: ds.color,
                        animationDelay: `${i * 80}ms`,
                      }}
                    >
                      {val > 0 && (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {val}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <span
                className={`text-[10px] ${
                  isToday ? "text-primary font-bold" : "text-muted-foreground"
                }`}
              >
                {label.split(",")[0]}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-4 mt-2">
        {datasets.map((ds) => (
          <div key={ds.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: ds.color }} />
            <span>{ds.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Priority Donut ─────────────────────────────────────────────────
function PriorityDonut({
  data,
}: {
  data: { high: number; medium: number; low: number };
}) {
  const total = data.high + data.medium + data.low;
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        No tasks completed yet
      </div>
    );
  }

  const segments = [
    { label: "High", value: data.high, color: "hsl(var(--destructive))" },
    { label: "Medium", value: data.medium, color: "hsl(var(--warning))" },
    { label: "Low", value: data.low, color: "hsl(var(--accent))" },
  ].filter((s) => s.value > 0);

  const size = 120;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  let cumulativeOffset = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          {segments.map((seg) => {
            const segLength = (seg.value / total) * circumference;
            const offset = circumference - segLength;
            const rotation = (cumulativeOffset / total) * 360;
            cumulativeOffset += seg.value;
            return (
              <circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segLength} ${circumference - segLength}`}
                strokeDashoffset={0}
                transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
                className="transition-all duration-700"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-foreground">{total}</span>
        </div>
      </div>
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-sm text-foreground">{seg.label}</span>
            <span className="text-sm text-muted-foreground">
              ({seg.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  subtext,
  accent = false,
}: {
  icon: string;
  label: string;
  value: string | number;
  subtext?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${
        accent ? "bg-primary/10 border-primary/30" : "bg-card border-border"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{icon}</span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div
        className={`text-2xl font-bold ${
          accent ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </div>
      {subtext && (
        <div className="text-[11px] text-muted-foreground mt-0.5">
          {subtext}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function WeeklyReviewPage() {
  const [data, setData] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/weekly-review?offset=${weekOffset}`);
      const json = await res.json();
      setData(json);
    } catch {
      console.error("Failed to load weekly review");
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "ArrowLeft" || e.key === "h") {
        e.preventDefault();
        setWeekOffset((prev) => prev + 1);
      }
      if ((e.key === "ArrowRight" || e.key === "l") && weekOffset > 0) {
        e.preventDefault();
        setWeekOffset((prev) => Math.max(0, prev - 1));
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [weekOffset]);

  if (loading || !data) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Weekly Review</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="widget animate-pulse h-48" />
          ))}
        </div>
      </div>
    );
  }

  const changeIcon =
    data.comparison.change > 0 ? "📈" : data.comparison.change < 0 ? "📉" : "➡️";
  const changeColor =
    data.comparison.change > 0
      ? "text-accent"
      : data.comparison.change < 0
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Weekly Review</h1>
          <p className="text-muted-foreground mt-1">{data.weekLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((p) => p + 1)}
            className="btn btn-secondary text-sm px-3 py-1.5"
            title="Previous week (← or H)"
          >
            ← Prev
          </button>
          {weekOffset > 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="btn btn-secondary text-sm px-3 py-1.5"
            >
              This Week
            </button>
          )}
          <button
            onClick={() => setWeekOffset((p) => Math.max(0, p - 1))}
            disabled={weekOffset === 0}
            className="btn btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
            title="Next week (→ or L)"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Hero: Productivity Score */}
      <div className="widget mb-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <ProgressRing score={data.productivityScore} />
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">Productivity Score</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Based on tasks completed, reminders cleared, meetings held, and
              goal progress this week.
            </p>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${changeColor}`}>
                {changeIcon}{" "}
                {data.comparison.change > 0 ? "+" : ""}
                {data.comparison.change} tasks vs last week
                {data.comparison.changePercent !== 0 && (
                  <span className="text-xs ml-1">
                    ({data.comparison.changePercent > 0 ? "+" : ""}
                    {data.comparison.changePercent}%)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard
          icon="✅"
          label="Tasks Done"
          value={data.stats.tasksCompleted}
          subtext={`${data.stats.tasksCreated} created`}
          accent={data.stats.tasksCompleted >= 10}
        />
        <StatCard
          icon="🔔"
          label="Reminders"
          value={data.stats.remindersCompleted}
          subtext="cleared"
        />
        <StatCard
          icon="📅"
          label="Meetings"
          value={data.stats.meetingsHeld}
          subtext="this week"
        />
        <StatCard
          icon="📁"
          label="Projects"
          value={data.stats.activeProjects}
          subtext="active"
        />
        <StatCard
          icon="🎯"
          label="Goals"
          value={`${data.stats.goalsOnTrack}/${data.stats.totalGoals}`}
          subtext="on track"
        />
        <StatCard
          icon="⚡"
          label="Net Tasks"
          value={
            data.stats.tasksCompleted - data.stats.tasksCreated >= 0
              ? `+${data.stats.tasksCompleted - data.stats.tasksCreated}`
              : `${data.stats.tasksCompleted - data.stats.tasksCreated}`
          }
          subtext="completed − created"
          accent={data.stats.tasksCompleted > data.stats.tasksCreated}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Daily Activity */}
        <div className="widget">
          <h3 className="widget-title">📊 Daily Activity</h3>
          <BarChart
            labels={data.dailyBreakdown.labels}
            datasets={[
              {
                data: data.dailyBreakdown.completed,
                color: "hsl(var(--accent))",
                label: "Completed",
              },
              {
                data: data.dailyBreakdown.created,
                color: "hsl(var(--primary))",
                label: "Created",
              },
            ]}
          />
        </div>

        {/* Priority Breakdown */}
        <div className="widget">
          <h3 className="widget-title">🎯 Priority Breakdown</h3>
          <div className="flex items-center justify-center pt-2">
            <PriorityDonut data={data.priorityBreakdown} />
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Project Progress */}
        <div className="widget">
          <h3 className="widget-title">📋 Project Breakdown</h3>
          {data.topProjects.length > 0 ? (
            <div className="space-y-3">
              {data.topProjects.map((proj) => {
                const pct =
                  proj.total > 0
                    ? Math.round((proj.completed / proj.total) * 100)
                    : 0;
                return (
                  <div key={proj.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="truncate text-foreground font-medium">
                        {proj.name}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {proj.completed}/{proj.total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          pct >= 75
                            ? "bg-accent"
                            : pct >= 40
                              ? "bg-warning"
                              : "bg-primary"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No project data for this week
            </p>
          )}
        </div>

        {/* Recent Completions */}
        <div className="widget">
          <h3 className="widget-title">🏆 Recent Wins</h3>
          {data.recentCompletions.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {data.recentCompletions.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <span className="text-accent text-sm">✓</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-foreground truncate block">
                      {task.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(task.completedAt).toLocaleDateString("en-US", {
                        weekday: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <span
                    className={`badge text-[10px] ${
                      task.priority === "high"
                        ? "badge-danger"
                        : task.priority === "medium"
                          ? "badge-warning"
                          : "badge-muted"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="text-3xl mb-2 block">🎯</span>
              <p className="text-sm text-muted-foreground">
                No tasks completed yet this week
              </p>
              <p className="text-[10px] text-muted-foreground/50 mt-1">
                Time to JFDI!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard hints */}
      <div className="flex items-center justify-center gap-4 mt-6 text-[10px] text-muted-foreground/40">
        <span>← / H: Previous week</span>
        <span>→ / L: Next week</span>
      </div>
    </div>
  );
}
