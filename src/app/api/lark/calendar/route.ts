import { NextResponse } from "next/server";
import {
  getLarkTodayEvents,
  getLarkUpcomingEvents,
  getLarkCalendarList,
  isLarkConfigured,
} from "@/lib/lark/client";

export async function GET(request: Request) {
  if (!isLarkConfigured()) {
    return NextResponse.json(
      { error: "Lark not configured. Set LARK_APP_ID and LARK_APP_SECRET." },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view") || "today";
  const calendarId = searchParams.get("calendar_id") || undefined;

  try {
    if (view === "calendars") {
      const calendars = await getLarkCalendarList();
      return NextResponse.json({ calendars });
    }

    if (view === "upcoming") {
      const events = await getLarkUpcomingEvents(calendarId);
      return NextResponse.json({ events });
    }

    // Default: today
    const events = await getLarkTodayEvents(calendarId);
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Lark calendar error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Lark calendar" },
      { status: 500 }
    );
  }
}
