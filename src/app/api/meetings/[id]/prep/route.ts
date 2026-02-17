import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { meetings, relationships, tasks, reminders } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";
import { sendClaudeMessage } from "@/lib/claude/client";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const meeting = await db.select().from(meetings).where(eq(meetings.id, id)).get();
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Gather attendee context
    let attendeeContext = "No attendees linked.";
    if (meeting.attendee_ids) {
      try {
        const ids: string[] = JSON.parse(meeting.attendee_ids);
        if (ids.length > 0) {
          const attendees = await db
            .select()
            .from(relationships)
            .where(inArray(relationships.id, ids))
            .all();
          attendeeContext = attendees
            .map((a) => {
              const parts = [`- ${a.name} (${a.type}, ${a.priority} priority)`];
              if (a.email) parts.push(`  Email: ${a.email}`);
              if (a.last_contact) {
                const days = Math.floor(
                  (Date.now() - new Date(a.last_contact).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                parts.push(`  Last contact: ${days} days ago`);
              }
              if (a.notes) parts.push(`  Notes: ${a.notes.slice(0, 300)}`);
              return parts.join("\n");
            })
            .join("\n\n");
        }
      } catch {
        // Invalid JSON
      }
    }

    // Get open tasks and upcoming reminders for context
    const openTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.status, "todo"))
      .all();
    const pendingReminders = await db
      .select()
      .from(reminders)
      .where(eq(reminders.status, "pending"))
      .all();

    const taskContext =
      openTasks.length > 0
        ? openTasks
            .slice(0, 10)
            .map((t) => `- ${t.title} (${t.priority})`)
            .join("\n")
        : "No open tasks.";

    const reminderContext =
      pendingReminders.length > 0
        ? pendingReminders
            .slice(0, 5)
            .map((r) => `- ${r.title} (due: ${r.due_date || "no date"})`)
            .join("\n")
        : "No pending reminders.";

    const prompt = `Generate meeting prep notes for the following meeting:

**Meeting**: ${meeting.title}
**Date**: ${meeting.date}
**Location**: ${meeting.location || "Not specified"}

**Agenda**:
${meeting.agenda || "No agenda provided."}

**Attendees**:
${attendeeContext}

**Open Tasks**:
${taskContext}

**Pending Reminders**:
${reminderContext}

Please generate comprehensive meeting prep including:
1. **Key Talking Points** — What to discuss based on the meeting context and attendees
2. **Attendee Context** — Summary of each attendee's relationship, last interaction, and key notes
3. **Open Items** — Relevant tasks and reminders that may come up
4. **Questions to Ask** — Strategic questions to prepare
5. **Goals for This Meeting** — What to aim for

Format in clean Markdown.`;

    const response = await sendClaudeMessage(prompt, {
      systemPrompt:
        "You are a meeting preparation assistant. Generate thorough, actionable meeting prep notes. Be specific and practical.",
      maxTokens: 2048,
    });

    // Save prep notes to the meeting
    await db
      .update(meetings)
      .set({
        prep_notes: response.result,
        updated_at: new Date().toISOString(),
      })
      .where(eq(meetings.id, id))
      .run();

    const updated = await db.select().from(meetings).where(eq(meetings.id, id)).get();
    return NextResponse.json({
      prep_notes: response.result,
      meeting: updated,
      model: response.model,
      usage: response.usage,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to generate prep: ${error}` },
      { status: 500 }
    );
  }
}
