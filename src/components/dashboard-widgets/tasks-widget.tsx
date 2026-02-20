"use client";

import { useState, useRef, useEffect } from "react";
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
  onQuickAdd?: (title: string) => Promise<void>;
}

export function TasksWidget({ items, todayCount, onComplete, onQuickAdd }: Props) {
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
        <h2 className="widget-title mb-0">Today&apos;s Tasks</h2>
        <div className="flex items-center gap-2">
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
