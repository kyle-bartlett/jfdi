"use client";

import { useState, useRef, useEffect } from "react";
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
  onQuickAdd?: (title: string) => Promise<void>;
}

export function PrioritiesWidget({
  items,
  overdue,
  today,
  pending,
  onComplete,
  onQuickAdd,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
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

  return (
    <div className="widget">
      <div className="flex items-center justify-between mb-3">
        <h2 className="widget-title mb-0">Priorities</h2>
        <div className="flex items-center gap-2">
          {onQuickAdd && !adding && (
            <button
              onClick={() => setAdding(true)}
              className="w-5 h-5 rounded flex items-center justify-center text-xs text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
              title="Quick add reminder"
            >
              +
            </button>
          )}
          <Link
            href="/reminders"
            className="text-xs text-primary hover:underline"
          >
            View all
          </Link>
        </div>
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
              <Link
                href="/reminders"
                className="truncate flex-1 hover:text-primary"
              >
                {r.title}
              </Link>
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
      {adding && (
        <div className="mt-2">
          <input
            ref={inputRef}
            type="text"
            className="w-full text-sm bg-muted/50 border border-border rounded-md px-2.5 py-1.5 placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
            placeholder="Type reminder and press Enter..."
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
      <div className="flex gap-4 mt-3 pt-3 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <span className="text-destructive font-medium">{overdue}</span>{" "}
          overdue
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
