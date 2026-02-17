"use client";

import Link from "next/link";

interface ProjectItem {
  id: string;
  name: string;
  space: string;
  progress: number;
  status: string;
}

interface Props {
  items: ProjectItem[];
  active: number;
  total: number;
}

export function ProjectsWidget({ items, active, total }: Props) {
  return (
    <div className="widget">
      <div className="flex items-center justify-between mb-3">
        <h2 className="widget-title mb-0">Active Projects</h2>
        <Link href="/projects" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </div>
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((p) => (
            <Link key={p.id} href="/projects" className="block group">
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="truncate group-hover:text-primary">{p.name}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {p.progress}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${p.progress}%` }}
                />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No active projects</p>
      )}
      <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
        {active} active of {total} total
      </div>
    </div>
  );
}
