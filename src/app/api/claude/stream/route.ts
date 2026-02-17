import { NextRequest } from "next/server";
import {
  getSessionHistory,
  listSessions,
  clearSession,
  DEFAULT_SYSTEM_PROMPT,
} from "@/lib/claude/client";

const ANKER_PROXY_URL = "https://ai-router.anker-in.com/v1/chat/completions";
const MODEL = "vertex_ai/claude-opus-4-6";

// In-memory session store — shared reference with client.ts via module scope
// We duplicate the Map here to avoid circular dependency issues with streaming
const streamSessions = new Map<
  string,
  Array<{ role: "system" | "user" | "assistant"; content: string }>
>();

function getHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.ANTHROPIC_API_KEY}`,
  };
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const body = await request.json();
  if (!body.message) {
    return new Response(JSON.stringify({ error: "Message required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sessionId = body.sessionId || crypto.randomUUID();
  const systemPrompt = body.systemPrompt || DEFAULT_SYSTEM_PROMPT;

  // Get or create conversation history
  const history = streamSessions.get(sessionId) || [];
  const updatedHistory = [
    ...history,
    { role: "user" as const, content: body.message },
  ];

  const messages = [
    { role: "system", content: systemPrompt },
    ...updatedHistory,
  ];

  try {
    const response = await fetch(ANKER_PROXY_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: body.maxTokens || 4096,
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({
          error: `Claude API error (${response.status}): ${errorText}`,
        }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return new Response(JSON.stringify({ error: "No response body" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    let fullResult = "";

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        let buffer = "";

        // Send session_id first
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "session", session_id: sessionId, model: MODEL })}\n\n`
          )
        );

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;
              const payload = trimmed.slice(6);
              if (payload === "[DONE]") continue;

              try {
                const parsed = JSON.parse(payload);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  fullResult += delta;
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: "chunk", content: delta })}\n\n`
                    )
                  );
                }
                if (parsed.usage) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: "usage", usage: parsed.usage })}\n\n`
                    )
                  );
                }
              } catch {
                // Skip malformed SSE lines
              }
            }
          }

          // Save conversation history
          const finalHistory = [
            ...updatedHistory,
            { role: "assistant" as const, content: fullResult },
          ];
          streamSessions.set(
            sessionId,
            finalHistory.length > 40 ? finalHistory.slice(-40) : finalHistory
          );

          // Send done event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "done", full_content: fullResult })}\n\n`
            )
          );
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: String(err) })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Failed to connect to Claude: ${error}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// GET — list sessions or get session history
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");

  if (sessionId) {
    const history = getSessionHistory(sessionId);
    const streamHistory = streamSessions.get(sessionId) || [];
    // Merge both stores — prefer whichever has content
    const combined = history.length > 0 ? history : streamHistory;
    return new Response(JSON.stringify({ session_id: sessionId, messages: combined }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // List all session IDs from both stores
  const allSessions = new Set([
    ...listSessions(),
    ...streamSessions.keys(),
  ]);
  return new Response(JSON.stringify({ sessions: Array.from(allSessions) }), {
    headers: { "Content-Type": "application/json" },
  });
}

// DELETE — clear a session
export async function DELETE(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return new Response(JSON.stringify({ error: "sessionId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  clearSession(sessionId);
  streamSessions.delete(sessionId);
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
