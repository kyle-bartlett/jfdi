import { google } from "googleapis";
import { db } from "@/lib/db";
import { googleTokens } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(state?: string) {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state: state || "",
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  // Get user email
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data } = await oauth2.userinfo.get();
  const email = data.email!;

  // Save to database
  const existing = await db.select().from(googleTokens).where(eq(googleTokens.email, email)).get();

  if (existing) {
    await db.update(googleTokens)
      .set({
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token || existing.refresh_token,
        expiry: tokens.expiry_date?.toString(),
        scopes: SCOPES.join(","),
        updated_at: new Date().toISOString(),
      })
      .where(eq(googleTokens.email, email))
      .run();
  } else {
    await db.insert(googleTokens)
      .values({
        id: uuidv4(),
        email,
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token || null,
        expiry: tokens.expiry_date?.toString(),
        scopes: SCOPES.join(","),
      })
      .run();
  }

  return { email, tokens };
}

export async function getAuthenticatedClient(email?: string) {
  const client = createOAuth2Client();

  // Get stored tokens - use the specified email or the first available
  let tokenRecord;
  if (email) {
    tokenRecord = await db.select().from(googleTokens).where(eq(googleTokens.email, email)).get();
  } else {
    tokenRecord = await db.select().from(googleTokens).limit(1).get();
  }

  if (!tokenRecord) {
    return null;
  }

  client.setCredentials({
    access_token: tokenRecord.access_token,
    refresh_token: tokenRecord.refresh_token,
    expiry_date: tokenRecord.expiry ? parseInt(tokenRecord.expiry) : undefined,
  });

  // Handle token refresh
  client.on("tokens", async (tokens) => {
    await db.update(googleTokens)
      .set({
        access_token: tokens.access_token!,
        expiry: tokens.expiry_date?.toString(),
        updated_at: new Date().toISOString(),
      })
      .where(eq(googleTokens.email, tokenRecord.email))
      .run();
  });

  return { client, email: tokenRecord.email };
}

export async function getConnectedAccounts() {
  return await db.select({ email: googleTokens.email }).from(googleTokens).all();
}
