"use client";

import Link from "next/link";

interface Props {
  today: number;
  upcoming: number;
}

export function MeetingsWidget({ today, upcoming }: Props) {
  return (
    <div className="widget">
      <div className="flex items-center justify-between mb-3">
        <h2 className="widget-title mb-0">Meetings</h2>
        <Link href="/meetings" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </div>
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
    </div>
  );
}
