"use client";

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
}

export function GoalsWidget({ items, onTrack, total }: Props) {
  return (
    <div className="widget">
      <div className="flex items-center justify-between mb-3">
        <h2 className="widget-title mb-0">Goals</h2>
        <Link href="/goals" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </div>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((g) => {
            const pct = Math.round(
              (g.current_percentage / g.target_percentage) * 100
            );
            return (
              <Link key={g.id} href="/goals" className="block group">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="truncate group-hover:text-primary">
                    {g.title}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {pct}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct >= 75
                        ? "bg-accent"
                        : pct >= 40
                          ? "bg-warning"
                          : "bg-destructive"
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No goals set</p>
      )}
      <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
        {onTrack} of {total} on track
      </div>
    </div>
  );
}
