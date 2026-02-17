const LARK_BASE_URL = "https://open.larksuite.com/open-apis";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getTenantAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const appId = process.env.LARK_APP_ID;
  const appSecret = process.env.LARK_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("LARK_APP_ID and LARK_APP_SECRET must be set");
  }

  const res = await fetch(
    `${LARK_BASE_URL}/auth/v3/tenant_access_token/internal`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    }
  );

  const data = await res.json();

  if (data.code !== 0) {
    throw new Error(`Lark auth failed: ${data.msg}`);
  }

  cachedToken = {
    token: data.tenant_access_token,
    expiresAt: Date.now() + (data.expire - 300) * 1000, // refresh 5 min early
  };

  return cachedToken.token;
}

async function larkGet(path: string, params?: Record<string, string>) {
  const token = await getTenantAccessToken();
  const url = new URL(`${LARK_BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return res.json();
}

export async function getLarkCalendarList() {
  const data = await larkGet("/calendar/v4/calendars", { page_size: "50" });

  if (data.code !== 0) {
    console.error("Lark calendar list error:", data.msg);
    return [];
  }

  return (data.data?.calendar_list || []).map(
    (cal: { calendar_id: string; summary: string; type: string }) => ({
      id: cal.calendar_id,
      name: cal.summary,
      type: cal.type,
    })
  );
}

export async function getLarkTodayEvents(calendarId?: string) {
  // If no calendarId, try to get the primary calendar
  let calId = calendarId;
  if (!calId) {
    const calendars = await getLarkCalendarList();
    if (calendars.length === 0) return [];
    // Use the first calendar (usually primary)
    calId = calendars[0].id;
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // Lark uses Unix timestamps in seconds as strings
  const startTime = Math.floor(startOfDay.getTime() / 1000).toString();
  const endTime = Math.floor(endOfDay.getTime() / 1000).toString();

  const data = await larkGet(
    `/calendar/v4/calendars/${calId}/events`,
    {
      start_time: startTime,
      end_time: endTime,
      page_size: "50",
    }
  );

  if (data.code !== 0) {
    console.error("Lark events error:", data.msg);
    return [];
  }

  return (data.data?.items || []).map(
    (event: {
      event_id: string;
      summary: string;
      start_time?: { timestamp?: string };
      end_time?: { timestamp?: string };
      location?: { name?: string };
      description?: string;
      attendees?: Array<{ display_name?: string; user_id?: string }>;
      vchat?: { meeting_url?: string };
    }) => ({
      id: event.event_id,
      title: event.summary || "Untitled",
      start: event.start_time?.timestamp
        ? new Date(parseInt(event.start_time.timestamp) * 1000).toISOString()
        : "",
      end: event.end_time?.timestamp
        ? new Date(parseInt(event.end_time.timestamp) * 1000).toISOString()
        : "",
      location: event.location?.name || null,
      description: event.description || null,
      attendees: (event.attendees || []).map((a) => ({
        name: a.display_name || "Unknown",
      })),
      meetingLink: event.vchat?.meeting_url || null,
      source: "lark" as const,
      account: "Anker (Lark)",
    })
  );
}

export async function getLarkUpcomingEvents(
  calendarId?: string,
  days = 7
) {
  let calId = calendarId;
  if (!calId) {
    const calendars = await getLarkCalendarList();
    if (calendars.length === 0) return [];
    calId = calendars[0].id;
  }

  const now = new Date();
  const endDate = new Date();
  endDate.setDate(now.getDate() + days);

  const startTime = Math.floor(now.getTime() / 1000).toString();
  const endTime = Math.floor(endDate.getTime() / 1000).toString();

  const data = await larkGet(
    `/calendar/v4/calendars/${calId}/events`,
    {
      start_time: startTime,
      end_time: endTime,
      page_size: "50",
    }
  );

  if (data.code !== 0) {
    console.error("Lark upcoming events error:", data.msg);
    return [];
  }

  return (data.data?.items || []).map(
    (event: {
      event_id: string;
      summary: string;
      start_time?: { timestamp?: string };
      end_time?: { timestamp?: string };
      location?: { name?: string };
      attendees?: Array<{ display_name?: string }>;
      vchat?: { meeting_url?: string };
    }) => ({
      id: event.event_id,
      title: event.summary || "Untitled",
      start: event.start_time?.timestamp
        ? new Date(parseInt(event.start_time.timestamp) * 1000).toISOString()
        : "",
      end: event.end_time?.timestamp
        ? new Date(parseInt(event.end_time.timestamp) * 1000).toISOString()
        : "",
      location: event.location?.name || null,
      attendees: (event.attendees || []).map((a) => ({
        name: a.display_name || "Unknown",
      })),
      meetingLink: event.vchat?.meeting_url || null,
      source: "lark" as const,
      account: "Anker (Lark)",
    })
  );
}

export function isLarkConfigured(): boolean {
  return !!(process.env.LARK_APP_ID && process.env.LARK_APP_SECRET);
}
