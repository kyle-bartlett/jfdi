import { google } from "googleapis";
import { getAuthenticatedClient } from "./oauth";

export async function getActionNeededEmails(email?: string, maxResults = 10) {
  const auth = await getAuthenticatedClient(email);
  if (!auth) return [];

  const gmail = google.gmail({ version: "v1", auth: auth.client });

  // Get unread emails from inbox
  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q: "is:unread in:inbox",
  });

  if (!response.data.messages) return [];

  const emails = await Promise.all(
    response.data.messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      });

      const headers = detail.data.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

      return {
        id: msg.id,
        threadId: msg.threadId,
        from: getHeader("From"),
        subject: getHeader("Subject"),
        date: getHeader("Date"),
        snippet: detail.data.snippet || "",
        labels: detail.data.labelIds || [],
        account: auth.email,
      };
    })
  );

  return emails;
}

export async function getEmailStats(email?: string) {
  const auth = await getAuthenticatedClient(email);
  if (!auth) return null;

  const gmail = google.gmail({ version: "v1", auth: auth.client });

  const [unread, inbox] = await Promise.all([
    gmail.users.messages.list({ userId: "me", q: "is:unread", maxResults: 1 }),
    gmail.users.messages.list({ userId: "me", q: "in:inbox", maxResults: 1 }),
  ]);

  return {
    unreadCount: unread.data.resultSizeEstimate || 0,
    inboxCount: inbox.data.resultSizeEstimate || 0,
    account: auth.email,
  };
}

export async function getLabels(email?: string) {
  const auth = await getAuthenticatedClient(email);
  if (!auth) return [];

  const gmail = google.gmail({ version: "v1", auth: auth.client });
  const response = await gmail.users.labels.list({ userId: "me" });

  return (response.data.labels || []).map((label) => ({
    id: label.id,
    name: label.name,
    type: label.type,
  }));
}
