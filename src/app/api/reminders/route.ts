import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reminders } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

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

  await db.update(reminders).set(updates).where(eq(reminders.id, id)).run();

  const updated = await db.select().from(reminders).where(eq(reminders.id, id)).get();
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await db.delete(reminders).where(eq(reminders.id, id)).run();
  return NextResponse.json({ success: true });
}
