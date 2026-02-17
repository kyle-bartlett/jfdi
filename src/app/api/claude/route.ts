import { NextRequest, NextResponse } from "next/server";
import { sendClaudeMessage } from "@/lib/claude/client";

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await sendClaudeMessage(body.message, {
      sessionId: body.sessionId || undefined,
      systemPrompt: body.systemPrompt || undefined,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Claude API error:", error);
    return NextResponse.json(
      { error: "Failed to communicate with Claude API." },
      { status: 500 }
    );
  }
}
