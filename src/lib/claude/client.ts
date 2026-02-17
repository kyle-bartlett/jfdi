// Claude client — routes through Anker proxy (OpenAI-compatible) to Opus 4.6

const ANKER_PROXY_URL = "https://ai-router.anker-in.com/v1/chat/completions";
const MODEL = "vertex_ai/claude-opus-4-6";

export interface ClaudeResponse {
  result: string;
  session_id: string;
  model: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// In-memory conversation history per session
const sessions = new Map<string, ChatMessage[]>();

const DEFAULT_SYSTEM_PROMPT = `You are Claude (Opus 4.6), integrated into JFDI — Kyle's personal command center.

JFDI modules: Dashboard, Reminders, Projects (with Tasks), Relationships (CRM), Meetings (with AI Prep/Debrief), Knowledge Base, Spark (ideas), Goals, Chat.

Available API endpoints you can reference:
- /api/reminders — CRUD for reminders
- /api/projects — CRUD for projects
- /api/tasks?project_id=X — CRUD for tasks
- /api/relationships — CRUD for relationships/CRM
- /api/meetings — CRUD for meetings
- /api/knowledge — CRUD for knowledge entries
- /api/spark — CRUD for spark ideas
- /api/goals — CRUD for goals
- /api/calendar — Unified calendar (Google + Lark)

Be concise, actionable, and direct. When referencing data, suggest specific actions Kyle can take.`;

function getHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.ANTHROPIC_API_KEY}`,
  };
}

function buildMessages(
  history: ChatMessage[],
  systemPrompt: string
): ChatMessage[] {
  return [{ role: "system", content: systemPrompt }, ...history];
}

export async function sendClaudeMessage(
  prompt: string,
  options?: {
    sessionId?: string;
    systemPrompt?: string;
    maxTokens?: number;
  }
): Promise<ClaudeResponse> {
  const sessionId = options?.sessionId || crypto.randomUUID();
  const systemPrompt = options?.systemPrompt || DEFAULT_SYSTEM_PROMPT;

  // Get or create conversation history
  const history = sessions.get(sessionId) || [];
  const updatedHistory = [...history, { role: "user" as const, content: prompt }];

  const response = await fetch(ANKER_PROXY_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: options?.maxTokens || 4096,
      messages: buildMessages(updatedHistory, systemPrompt),
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const result = data.choices?.[0]?.message?.content || "";
  const usage = data.usage;

  // Store history immutably
  const finalHistory = [
    ...updatedHistory,
    { role: "assistant" as const, content: result },
  ];
  sessions.set(
    sessionId,
    finalHistory.length > 40 ? finalHistory.slice(-40) : finalHistory
  );

  return {
    result,
    session_id: sessionId,
    model: MODEL,
    usage: usage
      ? {
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
          total_tokens: usage.total_tokens,
        }
      : undefined,
  };
}

export async function streamClaudeMessage(
  prompt: string,
  onChunk: (chunk: string) => void,
  options?: {
    sessionId?: string;
    systemPrompt?: string;
    maxTokens?: number;
  }
): Promise<ClaudeResponse> {
  const sessionId = options?.sessionId || crypto.randomUUID();
  const systemPrompt = options?.systemPrompt || DEFAULT_SYSTEM_PROMPT;

  const history = sessions.get(sessionId) || [];
  const updatedHistory = [...history, { role: "user" as const, content: prompt }];

  const response = await fetch(ANKER_PROXY_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: options?.maxTokens || 4096,
      messages: buildMessages(updatedHistory, systemPrompt),
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorText}`);
  }

  let fullResult = "";
  let usage: ClaudeResponse["usage"] | undefined;

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

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
          onChunk(delta);
          fullResult += delta;
        }
        if (parsed.usage) {
          usage = {
            prompt_tokens: parsed.usage.prompt_tokens,
            completion_tokens: parsed.usage.completion_tokens,
            total_tokens: parsed.usage.total_tokens,
          };
        }
      } catch {
        // Skip malformed SSE lines
      }
    }
  }

  // Store history immutably
  const finalHistory = [
    ...updatedHistory,
    { role: "assistant" as const, content: fullResult },
  ];
  sessions.set(
    sessionId,
    finalHistory.length > 40 ? finalHistory.slice(-40) : finalHistory
  );

  return {
    result: fullResult,
    session_id: sessionId,
    model: MODEL,
    usage,
  };
}

export function getSessionHistory(sessionId: string): ChatMessage[] {
  return sessions.get(sessionId) || [];
}

export function listSessions(): string[] {
  return Array.from(sessions.keys());
}

export function clearSession(sessionId: string): void {
  sessions.delete(sessionId);
}

export { DEFAULT_SYSTEM_PROMPT };
