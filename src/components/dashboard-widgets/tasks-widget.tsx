"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface TaskItem {
  id: string;
  title: string;
  project_id: string | null;
  project_name: string | null;
  status: string;
  priority: string;
  due_date: string | null;
}

interface Props {
  items: TaskItem[];
  todayCount: number;
  onComplete?: (id: string) => void;
  onCompleteAll?: (ids: string[]) => Promise<void>;
  onQuickAdd?: (title: string) => Promise<void>;
  onSnooze?: (id: string, newDate: string) => void;
  onStatusChange?: (id: string, status: string) => void;
  onSnoozeAllOverdue?: () => Promise<void>;
}

function getSnoozeDate(option: 'tomorrow' | 'next-monday' | 'next-week'): string {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (option) {
    case 'tomorrow':
      target.setDate(target.getDate() + 1);
      break;
    case 'next-monday': {
      const daysUntilMonday = (8 - target.getDay()) % 7 || 7;
      target.setDate(target.getDate() + daysUntilMonday);
      break;
    }
    case 'next-week':
      target.setDate(target.getDate() + 7);
      break;
  }
  return target.toISOString();
}

function SnoozeButton({ taskId, onSnooze }: { taskId: string; onSnooze: (id: string, newDate: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const pick = (option: 'tomorrow' | 'next-monday' | 'next-week') => {
    onSnooze(taskId, getSnoozeDate(option));
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-[11px] text-muted-foreground hover:text-primary hover:bg-muted transition-all flex-shrink-0"
        title="Snooze task"
      >
        🕐
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-50 bg-popover border border-border rounded-md shadow-md py-1 min-w-[120px]">
          <button onClick={() => pick('tomorrow')} className="w-full text-left px-3 py-1 text-xs hover:bg-muted transition-colors">Tomorrow</button>
          <button onClick={() => pick('next-monday')} className="w-full text-left px-3 py-1 text-xs hover:bg-muted transition-colors">Next Monday</button>
          <button onClick={() => pick('next-week')} className="w-full text-left px-3 py-1 text-xs hover:bg-muted transition-colors">Next Week</button>
        </div>
      )}
    </div>
  );
}

const STATUS_CYCLE: Record<string, string> = {
  "todo": "in-progress",
  "in-progress": "done",
  "done": "todo",
};

const STATUS_ICONS: Record<string, { icon: string; color: string; title: string }> = {
  "todo": { icon: "", color: "border-border hover:border-primary hover:bg-primary/10", title: "To Do — click to start" },
  "in-progress": { icon: "◐", color: "border-primary bg-primary/10 text-primary", title: "In Progress — click to complete" },
  "done": { icon: "✓", color: "border-accent bg-accent/10 text-accent", title: "Done — click to reopen" },
};

function StatusCycleButton({ status, onClick }: { status: string; onClick: () => void }) {
  const config = STATUS_ICONS[status] || STATUS_ICONS["todo"];
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[8px] transition-all mt-0.5 ${config.color}`}
      title={config.title}
    >
      {config.icon}
    </button>
  );
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  // Compare date portions only
  const taskDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return taskDate < today;
}

export function TasksWidget({ items, todayCount, onComplete, onCompleteAll, onQuickAdd, onSnooze, onStatusChange, onSnoozeAllOverdue }: Props) {
  const [adding, setAdding] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completingAll, setCompletingAll] = useState(false);
  const [snoozingAll, setSnoozingAll] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const handleSubmit = async () => {
    const title = quickTitle.trim();
    if (!title || !onQuickAdd) return;
    setSubmitting(true);
    try {
      await onQuickAdd(title);
      setQuickTitle("");
      setAdding(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteAll = async () => {
    if (!onCompleteAll || items.length === 0) return;
    setCompletingAll(true);
    try {
      await onCompleteAll(items.map((t) => t.id));
    } finally {
      setCompletingAll(false);
    }
  };

  const handleSnoozeAllOverdue = async () => {
    if (!onSnoozeAllOverdue) return;
    setSnoozingAll(true);
    try {
      await onSnoozeAllOverdue();
    } finally {
      setSnoozingAll(false);
    }
  };

  // Sort: overdue first, then high priority, then the rest
  const sorted = [...items].sort((a, b) => {
    const aOverdue = isOverdue(a.due_date) ? 0 : 1;
    const bOverdue = isOverdue(b.due_date) ? 0 : 1;
    if (aOverdue !== bOverdue) return aOverdue - bOverdue;
    const priOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return (priOrder[a.priority] ?? 1) - (priOrder[b.priority] ?? 1);
  });

  const overdueCount = items.filter((t) => isOverdue(t.due_date)).length;

  return (
    <div className="widget">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="widget-title mb-0">Today&apos;s Tasks</h2>
          {overdueCount > 0 && (
            <>
              <span className="text-[10px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">
                {overdueCount} overdue
              </span>
              {onSnoozeAllOverdue && (
                <button
                  onClick={handleSnoozeAllOverdue}
                  disabled={snoozingAll}
                  className="text-[10px] text-muted-foreground hover:text-primary font-medium transition-colors disabled:opacity-50"
                  title="Reschedule all overdue tasks to tomorrow"
                >
                  {snoozingAll ? "..." : "→ Tomorrow"}
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onCompleteAll && items.length > 1 && (
            <button
              onClick={handleCompleteAll}
              disabled={completingAll}
              className="text-[10px] text-accent hover:text-accent/80 font-medium transition-colors disabled:opacity-50"
              title="Complete all visible tasks"
            >
              {completingAll ? "..." : "✓ All"}
            </button>
          )}
          {onQuickAdd && !adding && (
            <button
              onClick={() => setAdding(true)}
              className="w-5 h-5 rounded flex items-center justify-center text-xs text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
              title="Quick add task"
            >
              +
            </button>
          )}
          <Link href="/projects" className="text-xs text-primary hover:underline">
            Projects
          </Link>
        </div>
      </div>
      {sorted.length > 0 ? (
        <div className="space-y-2">
          {sorted.map((t) => {
            const overdue = isOverdue(t.due_date);
            return (
              <div key={t.id} className="flex items-start gap-2 text-sm group">
                {onStatusChange ? (
                  <StatusCycleButton
                    status={t.status}
                    onClick={() => {
                      const next = STATUS_CYCLE[t.status] || "in-progress";
                      onStatusChange(t.id, next);
                    }}
                  />
                ) : onComplete && (
                  <button
                    onClick={() => onComplete(t.id)}
                    className="w-4 h-4 rounded border border-border hover:border-accent hover:bg-accent/10 flex-shrink-0 flex items-center justify-center text-[8px] text-transparent hover:text-accent mt-0.5"
                    title="Complete task"
                  >
                    &#10003;
                  </button>
                )}
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${
                    overdue
                      ? "bg-destructive"
                      : t.status === "in-progress"
                        ? "bg-primary"
                        : "bg-muted-foreground"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <span className={`truncate block ${
                    overdue ? "text-destructive" :
                    t.status === "done" ? "line-through text-muted-foreground" : ""
                  }`}>
                    {t.title}
                  </span>
                  {t.project_name && (
                    <span className="text-[10px] text-muted-foreground/60 truncate block">
                      {t.project_name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {onSnooze && (
                    <SnoozeButton taskId={t.id} onSnooze={onSnooze} />
                  )}
                  {overdue && t.due_date && (
                    <span className="text-[9px] text-destructive font-medium">
                      {formatDaysOverdue(t.due_date)}
                    </span>
                  )}
                  {t.priority === "high" && (
                    <span className="badge badge-danger text-[10px]">!</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No tasks for today</p>
      )}
      {adding && (
        <div className="mt-2">
          <input
            ref={inputRef}
            type="text"
            className="w-full text-sm bg-muted/50 border border-border rounded-md px-2.5 py-1.5 placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
            placeholder="Type task and press Enter..."
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
              if (e.key === "Escape") {
                setQuickTitle("");
                setAdding(false);
              }
            }}
            disabled={submitting}
          />
        </div>
      )}
      {todayCount > 0 && (
        <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
          {todayCount} task{todayCount !== 1 ? "s" : ""} to complete
        </div>
      )}
    </div>
  );
}

function formatDaysOverdue(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const taskDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((today.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return "1d late";
  return `${diffDays}d late`;
}
