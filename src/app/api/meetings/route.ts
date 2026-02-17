import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { meetings } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (id) {
    const item = await db.select().from(meetings).where(eq(meetings.id, id)).get();
    if (!item) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }
    return NextResponse.json(item);
  }

  const all = await db.select().from(meetings).orderBy(meetings.date).all();
  return NextResponse.json(all);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || !body.date) {
      return NextResponse.json({ error: "Title and date are required" }, { status: 400 });
    }

    const id = uuidv4();
    await db.insert(meetings)
      .values({
        id,
        title: body.title,
        date: body.date,
        location: body.location || null,
        attendee_ids: body.attendee_ids ? JSON.stringify(body.attendee_ids) : null,
        calendar_event_id: body.calendar_event_id || null,
        agenda: body.agenda || null,
        prep_notes: body.prep_notes || null,
        debrief_notes: body.debrief_notes || null,
        action_items: body.action_items ? JSON.stringify(body.action_items) : null,
        prep_notes_path: body.prep_notes_path || null,
        debrief_notes_path: body.debrief_notes_path || null,
        status: body.status || "upcoming",
      })
      .run();

    const created = await db.select().from(meetings).where(eq(meetings.id, id)).get();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: `Failed to create meeting: ${error}` }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.title !== undefined) updates.title = body.title;
    if (body.date !== undefined) updates.date = body.date;
    if (body.location !== undefined) updates.location = body.location;
    if (body.attendee_ids !== undefined) updates.attendee_ids = JSON.stringify(body.attendee_ids);
    if (body.calendar_event_id !== undefined) updates.calendar_event_id = body.calendar_event_id;
    if (body.agenda !== undefined) updates.agenda = body.agenda;
    if (body.prep_notes !== undefined) updates.prep_notes = body.prep_notes;
    if (body.debrief_notes !== undefined) updates.debrief_notes = body.debrief_notes;
    if (body.action_items !== undefined) updates.action_items = JSON.stringify(body.action_items);
    if (body.prep_notes_path !== undefined) updates.prep_notes_path = body.prep_notes_path;
    if (body.debrief_notes_path !== undefined) updates.debrief_notes_path = body.debrief_notes_path;
    if (body.status !== undefined) updates.status = body.status;

    await db.update(meetings).set(updates).where(eq(meetings.id, id)).run();

    const updated = await db.select().from(meetings).where(eq(meetings.id, id)).get();
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: `Failed to update meeting: ${error}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  try {
    await db.delete(meetings).where(eq(meetings.id, id)).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: `Failed to delete meeting: ${error}` }, { status: 500 });
  }
}
