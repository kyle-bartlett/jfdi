"use client";

import Link from "next/link";

interface MeetingItem {
  id: string;
  title: string;
  date: string;
  location?: string | null;
  status: string;
}

interface Props {
  today: number;
  upcoming: number;
  items?: MeetingItem[];
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    }
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export function MeetingsWidget({ today, upcoming, items }: Props) {
  return (
    <div className="widget">
      <div className="flex items-center justify-between mb-3">
        <h2 className="widget-title mb-0">Meetings</h2>
        <Link href="/meetings" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </div>
      {items && items.length > 0 ? (
        <div className="space-y-2">
          {items.map((m) => (
            <Link
              key={m.id}
              href={`/meetings/${m.id}`}
              className="flex items-center gap-3 text-sm group"
            >
              <span className="text-muted-foreground whitespace-nowrap text-xs">
                {formatDate(m.date)}
              </span>
              <span className="truncate flex-1 group-hover:text-primary">
                {m.title}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Today</span>
            <span className="badge badge-primary">{today}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Upcoming</span>
            <span className="badge badge-muted">{upcoming}</span>
          </div>
        </div>
      )}
      <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
        {today} today, {upcoming} upcoming
      </div>
    </div>
  );
}
