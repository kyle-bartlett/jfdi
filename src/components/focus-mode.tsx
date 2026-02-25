"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface FocusTask {
  id: string;
  title: string;
  project_id: string | null;
  project_name: string | null;
  status: string;
  priority: string;
  due_date: string | null;
}

interface Props {
  tasks: FocusTask[];
  onComplete: (id: string) => Promise<void>;
  onSnooze: (id: string, newDate: string) => Promise<void>;
  onClose: () => void;
}

function getSnoozeDate(option: "tomorrow" | "next-monday" | "next-week"): string {
  const target = new Date();
  target.setHours(9, 0, 0, 0);
  switch (option) {
    case "tomorrow":
      target.setDate(target.getDate() + 1);
      break;
    case "next-monday": {
      const daysUntilMonday = (8 - target.getDay()) % 7 || 7;
      target.setDate(target.getDate() + daysUntilMonday);
      break;
    }
    case "next-week":
      target.setDate(target.getDate() + 7);
      break;
  }
  return target.toISOString();
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()) <
    new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function FocusMode({ tasks, onComplete, onSnooze, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [snoozedCount, setSnoozedCount] = useState(0);
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [animating, setAnimating] = useState(false);
  const [animDir, setAnimDir] = useState<"complete" | "skip" | "snooze" | null>(null);
  const [showSnooze, setShowSnooze] = useState(false);
  const [done, setDone] = useState(false);
  const snoozeRef = useRef<HTMLDivElement>(null);
  const totalTasks = tasks.length;

  // Track remaining tasks (not completed or snoozed — they get removed from the queue)
  const [remainingTasks, setRemainingTasks] = useState<FocusTask[]>(tasks);

  // Close snooze dropdown on outside click
  useEffect(() => {
    if (!showSnooze) return;
    const handler = (e: MouseEvent) => {
      if (snoozeRef.current && !snoozeRef.current.contains(e.target as Node)) {
        setShowSnooze(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSnooze]);

  const currentTask = remainingTasks[currentIndex] || null;

  const advanceToNext = useCallback(() => {
    if (currentIndex >= remainingTasks.length - 1) {
      // Check if there are any skipped tasks to cycle back to
      const unskipped = remainingTasks.filter((t) => !skippedIds.has(t.id));
      if (unskipped.length === 0) {
        setDone(true);
      } else {
        setCurrentIndex(0);
      }
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, remainingTasks, skippedIds]);

  const handleComplete = useCallback(async () => {
    if (!currentTask || animating) return;
    setAnimDir("complete");
    setAnimating(true);

    try {
      await onComplete(currentTask.id);
      setCompletedCount((c) => c + 1);

      // Remove from remaining tasks
      const updated = remainingTasks.filter((t) => t.id !== currentTask.id);
      setRemainingTasks(updated);

      // Adjust index
      if (updated.length === 0) {
        setDone(true);
      } else if (currentIndex >= updated.length) {
        setCurrentIndex(0);
      }
    } finally {
      setTimeout(() => {
        setAnimating(false);
        setAnimDir(null);
      }, 300);
    }
  }, [currentTask, animating, onComplete, remainingTasks, currentIndex]);

  const handleSkip = useCallback(() => {
    if (!currentTask || animating) return;
    setAnimDir("skip");
    setAnimating(true);
    setSkippedIds((prev) => new Set(prev).add(currentTask.id));

    setTimeout(() => {
      advanceToNext();
      setAnimating(false);
      setAnimDir(null);
    }, 200);
  }, [currentTask, animating, advanceToNext]);

  const handleSnooze = useCallback(async (option: "tomorrow" | "next-monday" | "next-week") => {
    if (!currentTask || animating) return;
    setShowSnooze(false);
    setAnimDir("snooze");
    setAnimating(true);

    try {
      await onSnooze(currentTask.id, getSnoozeDate(option));
      setSnoozedCount((c) => c + 1);

      const updated = remainingTasks.filter((t) => t.id !== currentTask.id);
      setRemainingTasks(updated);

      if (updated.length === 0) {
        setDone(true);
      } else if (currentIndex >= updated.length) {
        setCurrentIndex(0);
      }
    } finally {
      setTimeout(() => {
        setAnimating(false);
        setAnimDir(null);
      }, 300);
    }
  }, [currentTask, animating, onSnooze, remainingTasks, currentIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (done) {
        if (e.key === "Escape" || e.key === "Enter") {
          e.preventDefault();
          onClose();
        }
        return;
      }

      if (showSnooze) {
        switch (e.key) {
          case "1":
            e.preventDefault();
            handleSnooze("tomorrow");
            break;
          case "2":
            e.preventDefault();
            handleSnooze("next-monday");
            break;
          case "3":
            e.preventDefault();
            handleSnooze("next-week");
            break;
          case "Escape":
            e.preventDefault();
            setShowSnooze(false);
            break;
        }
        return;
      }

      switch (e.key) {
        case " ":
        case "Enter":
          e.preventDefault();
          handleComplete();
          break;
        case "ArrowRight":
        case "Tab":
          e.preventDefault();
          handleSkip();
          break;
        case "s":
        case "S":
          e.preventDefault();
          setShowSnooze(true);
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [done, showSnooze, handleComplete, handleSkip, handleSnooze, onClose]);

  // Completion screen
  if (done) {
    return (
      <div className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">
            {completedCount > 0 ? "🎯" : "👍"}
          </div>
          <h2 className="text-2xl font-bold mb-2">Focus Complete</h2>
          <div className="space-y-1 text-muted-foreground mb-6">
            {completedCount > 0 && (
              <p className="text-accent font-medium">
                ✓ {completedCount} task{completedCount !== 1 ? "s" : ""} completed
              </p>
            )}
            {snoozedCount > 0 && (
              <p>
                ⏰ {snoozedCount} snoozed
              </p>
            )}
            {skippedIds.size > 0 && (
              <p>
                → {skippedIds.size} skipped
              </p>
            )}
            {completedCount === 0 && snoozedCount === 0 && (
              <p>All tasks reviewed</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn btn-primary px-6"
          >
            Back to Dashboard
          </button>
          <p className="text-[10px] text-muted-foreground/40 mt-3">
            Press Enter or Esc to close
          </p>
        </div>
      </div>
    );
  }

  if (!currentTask) {
    setDone(true);
    return null;
  }

  const overdue = isOverdue(currentTask.due_date);
  const processedCount = completedCount + snoozedCount + skippedIds.size;

  return (
    <div className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-sm flex items-center justify-center">
      <div className="w-full max-w-lg px-6">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{remainingTasks.length} remaining</span>
            <span>{completedCount} done</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5">
            <div
              className="bg-accent h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Task card */}
        <div
          className={`transition-all duration-200 ${
            animating
              ? animDir === "complete"
                ? "opacity-0 scale-95 -translate-y-4"
                : animDir === "skip"
                  ? "opacity-0 translate-x-8"
                  : "opacity-0 scale-95 translate-y-4"
              : "opacity-100 scale-100 translate-x-0 translate-y-0"
          }`}
        >
          <div className="card p-8 text-center">
            {/* Priority + project context */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {overdue && (
                <span className="badge badge-danger text-xs">Overdue</span>
              )}
              <span
                className={`badge text-xs ${
                  currentTask.priority === "high"
                    ? "badge-danger"
                    : currentTask.priority === "medium"
                      ? "badge-warning"
                      : "badge-muted"
                }`}
              >
                {currentTask.priority}
              </span>
              {currentTask.project_name && (
                <span className="text-xs text-muted-foreground">
                  {currentTask.project_name}
                </span>
              )}
            </div>

            {/* Task title */}
            <h2 className="text-xl font-semibold mb-2">{currentTask.title}</h2>

            {/* Due date */}
            {currentTask.due_date && (
              <p className={`text-sm ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                {overdue ? "Was due " : "Due "}
                {formatRelativeDate(currentTask.due_date)}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={handleSkip}
            disabled={animating}
            className="btn btn-secondary px-5 py-2.5 text-sm"
            title="Skip (→ or Tab)"
          >
            Skip →
          </button>

          <div className="relative" ref={snoozeRef}>
            <button
              onClick={() => setShowSnooze(!showSnooze)}
              disabled={animating}
              className="btn btn-secondary px-5 py-2.5 text-sm"
              title="Snooze (S)"
            >
              ⏰ Snooze
            </button>
            {showSnooze && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[160px] z-10">
                <button
                  onClick={() => handleSnooze("tomorrow")}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <span className="text-muted-foreground mr-2">1</span> Tomorrow
                </button>
                <button
                  onClick={() => handleSnooze("next-monday")}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <span className="text-muted-foreground mr-2">2</span> Next Monday
                </button>
                <button
                  onClick={() => handleSnooze("next-week")}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <span className="text-muted-foreground mr-2">3</span> Next Week
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleComplete}
            disabled={animating}
            className="btn btn-primary px-6 py-2.5 text-sm font-medium"
            title="Complete (Space or Enter)"
          >
            ✓ Done
          </button>
        </div>

        {/* Keyboard hints */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-muted-foreground/40">
          <span>Space/Enter: Complete</span>
          <span>→/Tab: Skip</span>
          <span>S: Snooze</span>
          <span>Esc: Exit</span>
        </div>
      </div>
    </div>
  );
}

function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const taskDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays === -1) return "yesterday";
  if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
  if (diffDays <= 7) return `in ${diffDays} days`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
