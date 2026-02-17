import { NextResponse } from "next/server";
import { isAgentXConfigured, getMessageStats, getRecentMessages } from "@/lib/lark/agentx";

export async function GET() {
  if (!isAgentXConfigured()) {
    return NextResponse.json({ error: "LarkAgentX not configured" }, { status: 404 });
  }

  const [stats, recent] = await Promise.all([
    getMessageStats(),
    getRecentMessages(5),
  ]);

  if (!stats) {
    return NextResponse.json({ error: "LarkAgentX not reachable" }, { status: 502 });
  }

  return NextResponse.json({
    total: stats.total,
    today: stats.today,
    ai_responses: stats.ai_responses,
    recent,
  });
}
