"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

interface GoalItem {
  id: string;
  title: string;
  category: string;
  current_percentage: number;
  target_percentage: number;
}

interface Props {
  items: GoalItem[];
  onTrack: number;
  total: number;
  onUpdateProgress?: (id: string, value: number) => Promise<void>;
}

const categoryColors: Record<string, { ring: string; badge: string; icon: string }> = {
  work: { ring: "hsl(var(--primary))", badge: "badge-primary", icon: "💼" },
  personal: { ring: "hsl(var(--accent))", badge: "badge-accent", icon: "👤" },
  health: { ring: "hsl(var(--warning))", badge: "badge-warning", icon: "💪" },
  learning: { ring: "hsl(var(--destructive))", badge: "badge-danger", icon: "📚" },
};

// ─── Mini Progress Ring ─────────────────────────────────────────────
function MiniRing({
  pct,
  color,
  size = 36,
  strokeWidth = 4,
}: {
  pct: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="hsl(var(--secondary))"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500 ease-out"
      />
    </svg>
  );
}

// ─── Quick Progress Slider ──────────────────────────────────────────
function QuickSlider({
  goalId,
  current,
  target,
  color,
  onUpdate,
  onClose,
}: {
  goalId: string;
  current: number;
  target: number;
  color: string;
  onUpdate: (id: string, value: number) => Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.buttons !== 1) return;
      const bar = barRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setValue(Math.round(ratio * target));
    },
    [target]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const bar = barRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setValue(Math.round(ratio * target));
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [target]
  );

  const save = async () => {
    if (value === current) {
      onClose();
      return;
    }
    setSaving(true);
    await onUpdate(goalId, value);
    setSaving(false);
    onClose();
  };

  const pct = target > 0 ? Math.round((value / target) * 100) : 0;

  return (
    <div className="mt-2 p-2 rounded-lg bg-secondary/50 border border-border animate-in">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
        <span>{value}%</span>
        <span>{pct}% complete</span>
      </div>
      <div
        ref={barRef}
        className="w-full h-3 bg-muted rounded-full overflow-hidden cursor-pointer relative"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        style={{ touchAction: "none" }}
      >
        <div
          className="h-full rounded-full transition-all duration-100"
          style={{
            width: `${Math.min(pct, 100)}%`,
            backgroundColor: color,
          }}
        />
        {/* Milestone markers */}
        {[25, 50, 75].map((m) => (
          <div
            key={m}
            className="absolute top-0 bottom-0 w-px bg-foreground/10"
            style={{ left: `${m}%` }}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        {[10, 25, 50].map((inc) => (
          <button
            key={inc}
            onClick={() => setValue(Math.min(target, value + inc))}
            disabled={value >= target}
            className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            +{inc}
          </button>
        ))}
        <span className="flex-1" />
        <button
          onClick={onClose}
          className="text-[10px] px-2 py-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50"
        >
          {saving ? "..." : "Save"}
        </button>
      </div>
    </div>
  );
}

// ─── Overall Progress Ring ──────────────────────────────────────────
function OverallProgress({ items }: { items: GoalItem[] }) {
  if (items.length === 0) return null;

  const avgPct = Math.round(
    items.reduce((sum, g) => {
      const pct = g.target_percentage > 0
        ? (g.current_percentage / g.target_percentage) * 100
        : 0;
      return sum + pct;
    }, 0) / items.length
  );

  const completed = items.filter(
    (g) => g.current_percentage >= g.target_percentage
  ).length;

  return (
    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
      <div className="relative">
        <MiniRing pct={avgPct} color="hsl(var(--primary))" size={44} strokeWidth={5} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold text-foreground">{avgPct}%</span>
        </div>
      </div>
      <div className="flex-1">
        <div className="text-xs font-medium text-foreground">Overall Progress</div>
        <div className="text-[10px] text-muted-foreground">
          {completed} of {items.length} completed
        </div>
      </div>
    </div>
  );
}

// ─── Main Widget ────────────────────────────────────────────────────
export function GoalsWidget({ items, onTrack, total, onUpdateProgress }: Props) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);

  const filtered = activeFilter === "all"
    ? items
    : items.filter((g) => g.category === activeFilter);

  // Unique categories present
  const presentCategories = ["all", ...new Set(items.map((g) => g.category))];

  return (
    <div className="widget">
      <div className="flex items-center justify-between mb-3">
        <h2 className="widget-title mb-0">Goals</h2>
        <Link href="/goals" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </div>

      {items.length > 0 ? (
        <>
          {/* Overall Progress Ring */}
          <OverallProgress items={items} />

          {/* Category Filters */}
          {presentCategories.length > 2 && (
            <div className="flex gap-1 mb-3 flex-wrap">
              {presentCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`text-[10px] px-2 py-1 rounded-full transition-colors ${
                    activeFilter === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat === "all" ? "All" : `${categoryColors[cat]?.icon || "📌"} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
                </button>
              ))}
            </div>
          )}

          {/* Goals List */}
          <div className="space-y-2">
            {filtered.slice(0, 5).map((g) => {
              const pct = g.target_percentage > 0
                ? Math.round((g.current_percentage / g.target_percentage) * 100)
                : 0;
              const isCompleted = g.current_percentage >= g.target_percentage;
              const cat = categoryColors[g.category] || { ring: "hsl(var(--muted-foreground))", badge: "badge-muted", icon: "📌" };

              return (
                <div key={g.id}>
                  <button
                    onClick={() => {
                      if (onUpdateProgress) {
                        setExpandedGoal(expandedGoal === g.id ? null : g.id);
                      }
                    }}
                    className="w-full flex items-center gap-3 group text-left hover:bg-secondary/30 rounded-lg p-1.5 -m-1.5 transition-colors"
                  >
                    {/* Mini ring */}
                    <div className="relative shrink-0">
                      <MiniRing pct={pct} color={cat.ring} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        {isCompleted ? (
                          <span className="text-[10px]">✓</span>
                        ) : (
                          <span className="text-[8px] font-bold text-foreground">{pct}</span>
                        )}
                      </div>
                    </div>

                    {/* Title + category */}
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-sm truncate block ${
                          isCompleted
                            ? "text-muted-foreground line-through"
                            : "group-hover:text-primary"
                        }`}
                      >
                        {g.title}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`badge text-[9px] py-0 ${cat.badge}`}>
                          {g.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {g.current_percentage}% / {g.target_percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Quick update hint */}
                    {onUpdateProgress && !isCompleted && (
                      <span className="text-[10px] text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        {expandedGoal === g.id ? "▾" : "◂ update"}
                      </span>
                    )}
                  </button>

                  {/* Inline slider */}
                  {expandedGoal === g.id && onUpdateProgress && (
                    <QuickSlider
                      goalId={g.id}
                      current={g.current_percentage}
                      target={g.target_percentage}
                      color={cat.ring}
                      onUpdate={onUpdateProgress}
                      onClose={() => setExpandedGoal(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {filtered.length > 5 && (
            <Link
              href="/goals"
              className="block text-center text-xs text-primary hover:underline mt-3"
            >
              +{filtered.length - 5} more goals →
            </Link>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <span className="text-2xl mb-2 block">🎯</span>
          <p className="text-sm text-muted-foreground">No goals set</p>
          <Link href="/goals" className="text-xs text-primary hover:underline mt-1 block">
            Create your first goal →
          </Link>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
        {onTrack} of {total} on track
      </div>
    </div>
  );
}
