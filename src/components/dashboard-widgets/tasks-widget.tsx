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

export function TasksWidget({ items, todayCount, onComplete, onCompleteAll, onQuickAdd }: Props) {
  const [adding, setAdding] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completingAll, setCompletingAll] = useState(false);
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
            <span className="text-[10px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">
              {overdueCount} overdue
            </span>
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
                {onComplete && (
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
                  <span className={`truncate block ${overdue ? "text-destructive" : ""}`}>
                    {t.title}
                  </span>
                  {t.project_name && (
                    <span className="text-[10px] text-muted-foreground/60 truncate block">
                      {t.project_name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
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
