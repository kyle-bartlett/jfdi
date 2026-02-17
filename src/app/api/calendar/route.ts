import { NextRequest, NextResponse } from "next/server";
import { getUpcomingEvents, getTodayEvents, createEvent } from "@/lib/google/calendar";
import {
  getLarkTodayEvents,
  getLarkUpcomingEvents,
  isLarkConfigured,
} from "@/lib/lark/client";

export async function GET(request: NextRequest) {
  const view = request.nextUrl.searchParams.get("view") || "upcoming";
  const email = request.nextUrl.searchParams.get("email") || undefined;
  const source = request.nextUrl.searchParams.get("source") || "all";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allEvents: any[] = [];

  // Google Calendar
  if (source === "all" || source === "google") {
    try {
      const events =
        view === "today"
          ? await getTodayEvents(email)
          : await getUpcomingEvents(email);
      allEvents.push(...events.map((e) => ({ ...e, source: "google" })));
    } catch {
      // Google not connected
    }
  }

  // Lark Calendar
  if ((source === "all" || source === "lark") && isLarkConfigured()) {
    try {
      const events =
        view === "today"
          ? await getLarkTodayEvents()
          : await getLarkUpcomingEvents();
      allEvents.push(...events);
    } catch {
      // Lark not available
    }
  }

  // Sort by start time
  allEvents.sort((a, b) => {
    const aTime = a.start ? new Date(a.start).getTime() : 0;
    const bTime = b.start ? new Date(b.start).getTime() : 0;
    return aTime - bTime;
  });

  return NextResponse.json(allEvents);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = body.email;

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    const event = await createEvent(email, {
      title: body.title,
      start: body.start,
      end: body.end,
      description: body.description,
      location: body.location,
      attendees: body.attendees,
    });
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
