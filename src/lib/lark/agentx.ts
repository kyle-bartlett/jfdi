const AGENTX_URL = process.env.LARK_AGENTX_URL;

export function isAgentXConfigured(): boolean {
  return !!AGENTX_URL;
}

export interface MessageStats {
  total: number;
  today: number;
  ai_responses: number;
}

export interface RecentMessage {
  sender: string;
  text: string;
  timestamp: string;
}

export async function getMessageStats(): Promise<MessageStats | null> {
  if (!AGENTX_URL) return null;

  try {
    const res = await fetch(`${AGENTX_URL}/api/messages/stats`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getRecentMessages(limit = 5): Promise<RecentMessage[]> {
  if (!AGENTX_URL) return [];

  try {
    const res = await fetch(`${AGENTX_URL}/api/messages/?page_size=${limit}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    // LarkAgentX returns paginated results
    const items = Array.isArray(data) ? data : data.items || data.results || [];
    return items.map((m: Record<string, string>) => ({
      sender: m.sender_name || m.sender || "Unknown",
      text: (m.text || m.content || "").slice(0, 100),
      timestamp: m.created_at || m.timestamp || "",
    }));
  } catch {
    return [];
  }
}
