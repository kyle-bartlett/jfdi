"use client";

import Link from "next/link";

interface TaskItem {
  id: string;
  title: string;
  project_id: string | null;
  status: string;
  priority: string;
  due_date: string | null;
}

interface Props {
  items: TaskItem[];
  todayCount: number;
  onComplete?: (id: string) => void;
}

export function TasksWidget({ items, todayCount, onComplete }: Props) {
  return (
    <div className="widget">
      <div className="flex items-center justify-between mb-3">
        <h2 className="widget-title mb-0">Today&apos;s Tasks</h2>
        <Link href="/projects" className="text-xs text-primary hover:underline">
          Projects
        </Link>
      </div>
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((t) => (
            <div key={t.id} className="flex items-center gap-2 text-sm group">
              {onComplete && (
                <button
                  onClick={() => onComplete(t.id)}
                  className="w-4 h-4 rounded border border-border hover:border-accent hover:bg-accent/10 flex-shrink-0 flex items-center justify-center text-[8px] text-transparent hover:text-accent"
                  title="Complete task"
                >
                  &#10003;
                </button>
              )}
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  t.status === "in-progress" ? "bg-primary" : "bg-muted-foreground"
                }`}
              />
              <span className="truncate flex-1">{t.title}</span>
              {t.priority === "high" && (
                <span className="badge badge-danger text-[10px]">!</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No tasks for today</p>
      )}
      {todayCount > 0 && (
        <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
          {todayCount} task{todayCount !== 1 ? "s" : ""} to complete
        </div>
      )}
    </div>
  );
}
