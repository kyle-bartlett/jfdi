"use client";

import { useState, useEffect } from "react";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  source?: "google" | "lark";
  account?: string;
  htmlLink?: string | null;
  hangoutLink?: string | null;
  location?: string | null;
}

interface Props {
  events: CalendarEvent[];
}

function formatTime(dateStr: string) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "ending";
  const mins = Math.ceil(ms / 60000);
  if (mins < 60) return `${mins}m left`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}m left` : `${hrs}h left`;
}

function formatTimeUntil(ms: number): string {
  if (ms <= 0) return "now";
  const mins = Math.ceil(ms / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `in ${hrs}h ${remMins}m` : `in ${hrs}h`;
}

type EventStatus = "past" | "now" | "next" | "upcoming";

function classifyEvents(events: CalendarEvent[], now: Date): Map<string, EventStatus> {
  const statusMap = new Map<string, EventStatus>();
  let foundNext = false;

  for (const event of events) {
    const start = new Date(event.start);
    const end = new Date(event.end);

    if (now >= start && now < end) {
      statusMap.set(event.id, "now");
    } else if (now >= end) {
      statusMap.set(event.id, "past");
    } else if (!foundNext && now < start) {
      statusMap.set(event.id, "next");
      foundNext = true;
    } else {
      statusMap.set(event.id, "upcoming");
    }
  }

  return statusMap;
}

export function CalendarWidget({ events }: Props) {
  const [now, setNow] = useState(() => new Date());

  // Tick every 30s to keep Now/Next indicators live
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const statusMap = classifyEvents(events, now);

  return (
    <div className="widget">
      <h2 className="widget-title">Calendar</h2>
      {events.length > 0 ? (
        <div className="space-y-1">
          {events.slice(0, 8).map((event) => {
            const link = event.htmlLink || event.hangoutLink;
            const status = statusMap.get(event.id) || "upcoming";
            const start = new Date(event.start);
            const end = new Date(event.end);

            const isNow = status === "now";
            const isNext = status === "next";
            const isPast = status === "past";

            const content = (
              <div
                className={`flex gap-3 text-sm items-center rounded-md px-2 py-1.5 transition-colors ${
                  isNow
                    ? "bg-primary/10 border border-primary/20"
                    : isNext
                      ? "bg-accent/5 border border-accent/15"
                      : isPast
                        ? "opacity-50"
                        : ""
                }`}
              >
                {/* Time column */}
                <span className={`whitespace-nowrap text-xs w-[4rem] flex-shrink-0 ${
                  isNow ? "text-primary font-medium" : "text-muted-foreground"
                }`}>
                  {formatTime(event.start)}
                </span>

                {/* Title */}
                <span className={`truncate flex-1 ${
                  isNow ? "font-medium" : ""
                } ${isPast ? "line-through" : ""} ${link ? "group-hover:text-primary" : ""}`}>
                  {event.title}
                </span>

                {/* Status badges */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isNow && (
                    <span className="badge badge-primary text-[10px] whitespace-nowrap animate-pulse">
                      {formatTimeRemaining(end.getTime() - now.getTime())}
                    </span>
                  )}
                  {isNext && (
                    <span className="badge badge-accent text-[10px] whitespace-nowrap">
                      {formatTimeUntil(start.getTime() - now.getTime())}
                    </span>
                  )}
                  {event.source && (
                    <span
                      className={`badge text-[10px] whitespace-nowrap ${
                        event.source === "lark" ? "badge-primary" : "badge-accent"
                      }`}
                    >
                      {event.source === "lark" ? "L" : "G"}
                    </span>
                  )}
                </div>
              </div>
            );

            return link ? (
              <a
                key={event.id}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                {content}
                {event.location && (
                  <div className="text-[10px] text-muted-foreground ml-[4.5rem] truncate px-2">
                    {event.location}
                  </div>
                )}
              </a>
            ) : (
              <div key={event.id}>
                {content}
                {event.location && (
                  <div className="text-[10px] text-muted-foreground ml-[4.5rem] truncate px-2">
                    {event.location}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No events today</p>
      )}
    </div>
  );
}
