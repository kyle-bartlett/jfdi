"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Global "Go To" Navigation — Gmail/GitHub-style two-key shortcuts.
 * Press `g` to enter go-to mode, then a letter key to jump to a section.
 * Shows a brief floating indicator when go-to mode is active.
 * 
 * Shortcuts:
 *   g → d  Dashboard        g → o  Ops Center
 *   g → r  Reminders        g → a  Action Queue
 *   g → p  Projects         g → u  Automations
 *   g → l  Relationships    g → s  Spark
 *   g → m  Meetings         g → c  Chat
 *   g → k  Knowledge        g → w  Weekly Review
 *   g → g  Goals
 */

const GO_TO_MAP: Record<string, { href: string; label: string }> = {
  d: { href: "/", label: "Dashboard" },
  r: { href: "/reminders", label: "Reminders" },
  p: { href: "/projects", label: "Projects" },
  l: { href: "/relationships", label: "Relationships" },
  m: { href: "/meetings", label: "Meetings" },
  k: { href: "/knowledge", label: "Knowledge" },
  s: { href: "/spark", label: "Spark" },
  g: { href: "/goals", label: "Goals" },
  w: { href: "/weekly-review", label: "Weekly Review" },
  c: { href: "/chat", label: "Chat" },
  o: { href: "/ops", label: "Ops Center" },
  a: { href: "/action-queue", label: "Action Queue" },
  u: { href: "/automations", label: "Automations" },
};

export function GoToNavigation() {
  const [goMode, setGoMode] = useState(false);
  const [navigatedTo, setNavigatedTo] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const cancelGoMode = useCallback(() => {
    setGoMode(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs, textareas, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) return;

      // Don't capture with modifiers (except shift for uppercase)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (!goMode) {
        // Enter go-to mode on 'g' press
        if (e.key === "g" && !e.shiftKey) {
          // Don't preventDefault — let other handlers still work if needed
          // But activate go-to mode
          setGoMode(true);
          // Auto-cancel after 1.5s if no second key pressed
          timerRef.current = setTimeout(() => {
            setGoMode(false);
          }, 1500);
        }
      } else {
        // In go-to mode — look for the second key
        e.preventDefault();
        const destination = GO_TO_MAP[e.key.toLowerCase()];
        if (destination) {
          router.push(destination.href);
          setNavigatedTo(destination.label);
          // Clear the feedback after a short delay
          if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
          feedbackTimerRef.current = setTimeout(() => {
            setNavigatedTo(null);
          }, 1200);
        }
        cancelGoMode();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [goMode, cancelGoMode, router]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // Go-to mode indicator
  if (goMode) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-bottom-2 duration-150">
        <div className="bg-card/95 backdrop-blur-sm border border-primary/30 rounded-xl shadow-2xl px-5 py-3">
          <div className="flex items-center gap-3 mb-2">
            <kbd className="text-sm font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">g</kbd>
            <span className="text-sm text-foreground font-medium">Go to…</span>
          </div>
          <div className="grid grid-cols-3 gap-x-6 gap-y-1">
            {Object.entries(GO_TO_MAP).map(([key, { label }]) => (
              <div key={key} className="flex items-center gap-1.5">
                <kbd className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded min-w-[20px] text-center">
                  {key}
                </kbd>
                <span className="text-[11px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Navigation feedback
  if (navigatedTo) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-bottom-2 duration-150">
        <div className="bg-primary/90 text-primary-foreground rounded-lg shadow-lg px-4 py-2 text-sm font-medium">
          → {navigatedTo}
        </div>
      </div>
    );
  }

  return null;
}
