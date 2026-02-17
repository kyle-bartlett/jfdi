import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { meetings, relationships, interactions } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";
import { sendClaudeMessage } from "@/lib/claude/client";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const braindump = body.braindump;

    if (!braindump) {
      return NextResponse.json(
        { error: "braindump text is required" },
        { status: 400 }
      );
    }

    const meeting = await db.select().from(meetings).where(eq(meetings.id, id)).get();
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Get attendee names for context
    let attendeeNames: string[] = [];
    if (meeting.attendee_ids) {
      try {
        const ids: string[] = JSON.parse(meeting.attendee_ids);
        if (ids.length > 0) {
          const attendees = await db
            .select()
            .from(relationships)
            .where(inArray(relationships.id, ids))
            .all();
          attendeeNames = attendees.map((a) => a.name);
        }
      } catch {
        // Invalid JSON
      }
    }

    const prompt = `Process this meeting debrief brain dump and extract structured information.

**Meeting**: ${meeting.title}
**Date**: ${meeting.date}
**Attendees**: ${attendeeNames.length > 0 ? attendeeNames.join(", ") : "Not specified"}

**Brain Dump**:
${braindump}

Please extract and organize:

1. **Key Decisions** — Decisions that were made during the meeting
2. **Action Items** — Specific tasks with who is responsible and any deadlines mentioned. Format each as: "- [ ] [Task description] — [Owner] (by [date if mentioned])"
3. **Important Information Shared** — Key facts, updates, or data shared
4. **Follow-ups Needed** — Things to follow up on
5. **Meeting Summary** — 2-3 sentence summary of the meeting

Also output a JSON block at the end with extracted action items in this format:
\`\`\`json
{
  "action_items": [
    {"title": "Task description", "assignee": "Person name or 'me'", "due_date": "YYYY-MM-DD or null"}
  ]
}
\`\`\`

Format everything in clean Markdown.`;

    const response = await sendClaudeMessage(prompt, {
      systemPrompt:
        "You are a meeting debrief assistant. Extract structured, actionable information from meeting notes. Be thorough but concise.",
      maxTokens: 2048,
    });

    // Try to extract action items JSON
    let actionItems: Array<{ title: string; assignee?: string; due_date?: string | null }> = [];
    const jsonMatch = response.result.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        actionItems = parsed.action_items || [];
      } catch {
        // Could not parse action items
      }
    }

    // Save debrief notes and action items
    await db
      .update(meetings)
      .set({
        debrief_notes: response.result,
        action_items: JSON.stringify(actionItems),
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .where(eq(meetings.id, id))
      .run();

    // Update last_contact on attendee relationships and create interactions
    if (meeting.attendee_ids) {
      try {
        const ids: string[] = JSON.parse(meeting.attendee_ids);
        const now = new Date().toISOString();
        for (const relId of ids) {
          await db
            .update(relationships)
            .set({ last_contact: now, updated_at: now })
            .where(eq(relationships.id, relId))
            .run();

          await db
            .insert(interactions)
            .values({
              id: uuidv4(),
              relationship_id: relId,
              type: "meeting",
              notes: `Meeting: ${meeting.title}`,
            })
            .run();
        }
      } catch {
        // Invalid JSON for attendee_ids
      }
    }

    // Auto-create reminders for action items assigned to "me"
    const createdReminders: string[] = [];
    for (const item of actionItems) {
      if (
        item.assignee?.toLowerCase() === "me" ||
        item.assignee?.toLowerCase() === "kyle"
      ) {
        try {
          const res = await fetch(
            new URL("/api/reminders", request.url).toString(),
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: item.title,
                due_date: item.due_date || null,
                category: "follow-up",
                priority: "high",
              }),
            }
          );
          if (res.ok) {
            createdReminders.push(item.title);
          }
        } catch {
          // Skip failed reminder creation
        }
      }
    }

    const updated = await db.select().from(meetings).where(eq(meetings.id, id)).get();
    return NextResponse.json({
      debrief_notes: response.result,
      action_items: actionItems,
      created_reminders: createdReminders,
      meeting: updated,
      model: response.model,
      usage: response.usage,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to process debrief: ${error}` },
      { status: 500 }
    );
  }
}
