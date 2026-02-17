import { NextRequest, NextResponse } from "next/server";
import { getActionNeededEmails, getEmailStats } from "@/lib/google/gmail";

export async function GET(request: NextRequest) {
  const view = request.nextUrl.searchParams.get("view") || "action-needed";
  const email = request.nextUrl.searchParams.get("email") || undefined;

  try {
    if (view === "stats") {
      const stats = await getEmailStats(email);
      return NextResponse.json(stats || { unreadCount: 0, inboxCount: 0 });
    }

    const emails = await getActionNeededEmails(email);
    return NextResponse.json(emails);
  } catch (error) {
    console.error("Gmail API error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
