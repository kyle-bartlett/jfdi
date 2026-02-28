import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reminders } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

function getNextRecurrenceDate(currentDue: string | null, recurrence: string): string {
  const base = currentDue ? new Date(currentDue) : new Date();
  // If the base is in the past, start from now
  const now = new Date();
  if (base < now) {
    base.setTime(now.getTime());
  }
  // Preserve time of day from original (or default to 9 AM)
  const hours = currentDue ? new Date(currentDue).getHours() : 9;
  const minutes = currentDue ? new Date(currentDue).getMinutes() : 0;

  switch (recurrence) {
    case "daily":
      base.setDate(base.getDate() + 1);
      break;
    case "weekdays": {
      base.setDate(base.getDate() + 1);
      // Skip to Monday if landing on weekend
      const day = base.getDay();
      if (day === 0) base.setDate(base.getDate() + 1); // Sun → Mon
      if (day === 6) base.setDate(base.getDate() + 2); // Sat → Mon
      break;
    }
    case "weekly":
      base.setDate(base.getDate() + 7);
      break;
    case "monthly":
      base.setMonth(base.getMonth() + 1);
      break;
    default:
      base.setDate(base.getDate() + 1);
  }
  base.setHours(hours, minutes, 0, 0);
  return base.toISOString().slice(0, 16);
}

export async function GET() {
  const all = await db.select().from(reminders).orderBy(reminders.due_date).all();
  return NextResponse.json(all);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = uuidv4();

  await db.insert(reminders)
    .values({
      id,
      title: body.title,
      description: body.description || null,
      due_date: body.due_date || null,
      status: body.status || "pending",
      priority: body.priority || "medium",
      category: body.category || "personal",
      snoozed_until: body.snoozed_until || null,
      recurrence: body.recurrence || "none",
    })
    .run();

  const created = await db.select().from(reminders).where(eq(reminders.id, id)).get();
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.due_date !== undefined) updates.due_date = body.due_date;
  if (body.status !== undefined) updates.status = body.status;
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.category !== undefined) updates.category = body.category;
  if (body.snoozed_until !== undefined) updates.snoozed_until = body.snoozed_until;
  if (body.recurrence !== undefined) updates.recurrence = body.recurrence;

  await db.update(reminders).set(updates).where(eq(reminders.id, id)).run();

  const updated = await db.select().from(reminders).where(eq(reminders.id, id)).get();

  // Auto-create next occurrence when completing a recurring reminder
  let nextReminder = null;
  const validRecurrences = ["daily", "weekdays", "weekly", "monthly"] as const;
  type Recurrence = typeof validRecurrences[number];
  const recurrence = (updated as Record<string, unknown>)?.recurrence as string | undefined;
  if (
    body.status === "completed" &&
    updated &&
    recurrence &&
    validRecurrences.includes(recurrence as Recurrence)
  ) {
    const rec = recurrence as Recurrence;
    const nextDue = getNextRecurrenceDate(updated.due_date, rec);
    const nextId = uuidv4();
    await db.insert(reminders)
      .values({
        id: nextId,
        title: updated.title,
        description: updated.description || null,
        due_date: nextDue,
        status: "pending",
        priority: updated.priority || "medium",
        category: updated.category || "personal",
        snoozed_until: null,
        recurrence: rec,
      })
      .run();
    nextReminder = await db.select().from(reminders).where(eq(reminders.id, nextId)).get();
  }

  return NextResponse.json({ updated, nextReminder });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await db.delete(reminders).where(eq(reminders.id, id)).run();
  return NextResponse.json({ success: true });
}
