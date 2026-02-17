import { google } from "googleapis";
import { getAuthenticatedClient } from "./oauth";

export async function getUpcomingEvents(email?: string, maxResults = 20) {
  const auth = await getAuthenticatedClient(email);
  if (!auth) return [];

  const calendar = google.calendar({ version: "v3", auth: auth.client });

  const now = new Date();
  const endOfWeek = new Date();
  endOfWeek.setDate(now.getDate() + 7);

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: now.toISOString(),
    timeMax: endOfWeek.toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: "startTime",
  });

  return (response.data.items || []).map((event) => ({
    id: event.id,
    title: event.summary || "Untitled",
    start: event.start?.dateTime || event.start?.date || "",
    end: event.end?.dateTime || event.end?.date || "",
    location: event.location || null,
    description: event.description || null,
    attendees: (event.attendees || []).map((a) => ({
      email: a.email,
      name: a.displayName || a.email,
      status: a.responseStatus,
    })),
    hangoutLink: event.hangoutLink || null,
    htmlLink: event.htmlLink || null,
    calendarId: "primary",
    account: auth.email,
  }));
}

export async function getTodayEvents(email?: string) {
  const auth = await getAuthenticatedClient(email);
  if (!auth) return [];

  const calendar = google.calendar({ version: "v3", auth: auth.client });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return (response.data.items || []).map((event) => ({
    id: event.id,
    title: event.summary || "Untitled",
    start: event.start?.dateTime || event.start?.date || "",
    end: event.end?.dateTime || event.end?.date || "",
    location: event.location || null,
    attendees: (event.attendees || []).map((a) => ({
      email: a.email,
      name: a.displayName || a.email,
    })),
    hangoutLink: event.hangoutLink || null,
    htmlLink: event.htmlLink || null,
    account: auth.email,
  }));
}

export async function createEvent(
  email: string,
  event: {
    title: string;
    start: string;
    end: string;
    description?: string;
    location?: string;
    attendees?: string[];
  },
) {
  const auth = await getAuthenticatedClient(email);
  if (!auth) throw new Error("Not authenticated");

  const calendar = google.calendar({ version: "v3", auth: auth.client });

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: { dateTime: event.start },
      end: { dateTime: event.end },
      attendees: event.attendees?.map((email) => ({ email })),
    },
  });

  return response.data;
}
