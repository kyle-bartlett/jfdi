"use client";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  source?: "google" | "lark";
  account?: string;
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

export function CalendarWidget({ events }: Props) {
  return (
    <div className="widget">
      <h2 className="widget-title">Calendar</h2>
      {events.length > 0 ? (
        <div className="space-y-2">
          {events.slice(0, 8).map((event) => (
            <div key={event.id} className="flex gap-3 text-sm items-center">
              <span className="text-muted-foreground whitespace-nowrap">
                {formatTime(event.start)}
              </span>
              <span className="truncate flex-1">{event.title}</span>
              {event.source && (
                <span
                  className={`badge text-[10px] whitespace-nowrap ${
                    event.source === "lark" ? "badge-primary" : "badge-accent"
                  }`}
                >
                  {event.source === "lark" ? "Lark" : "Google"}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No events today</p>
      )}
    </div>
  );
}
