"use client";

import Link from "next/link";

interface ReminderItem {
  id: string;
  title: string;
  priority: string;
  due_date: string | null;
  _urgency: "overdue" | "today";
}

interface Props {
  items: ReminderItem[];
  overdue: number;
  today: number;
  pending: number;
  onComplete?: (id: string) => void;
}

export function PrioritiesWidget({ items, overdue, today, pending, onComplete }: Props) {
  return (
    <div className="widget">
      <div className="flex items-center justify-between mb-3">
        <h2 className="widget-title mb-0">Priorities</h2>
        <Link href="/reminders" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </div>
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.id} className="flex items-center gap-2 text-sm group">
              {onComplete && (
                <button
                  onClick={() => onComplete(r.id)}
                  className="w-4 h-4 rounded border border-border hover:border-primary hover:bg-primary/10 flex-shrink-0 flex items-center justify-center text-[8px] text-transparent hover:text-primary"
                  title="Complete"
                >
                  &#10003;
                </button>
              )}
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  r._urgency === "overdue" ? "bg-destructive" : "bg-warning"
                }`}
              />
              <span className="truncate flex-1">{r.title}</span>
              <span
                className={`badge text-[10px] ${
                  r.priority === "high"
                    ? "badge-danger"
                    : r.priority === "medium"
                      ? "badge-warning"
                      : "badge-muted"
                }`}
              >
                {r.priority}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No urgent reminders</p>
      )}
      <div className="flex gap-4 mt-3 pt-3 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <span className="text-destructive font-medium">{overdue}</span> overdue
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="text-warning font-medium">{today}</span> due today
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">{pending}</span> pending
        </div>
      </div>
    </div>
  );
}
