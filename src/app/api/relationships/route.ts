import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { relationships } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (id) {
    const item = await db.select().from(relationships).where(eq(relationships.id, id)).get();
    if (!item) {
      return NextResponse.json({ error: "Relationship not found" }, { status: 404 });
    }
    return NextResponse.json(item);
  }

  const all = await db.select().from(relationships).orderBy(relationships.name).all();
  return NextResponse.json(all);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const id = uuidv4();
    await db.insert(relationships)
      .values({
        id,
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        type: body.type || "casual",
        priority: body.priority || "medium",
        last_contact: body.last_contact || null,
        contact_frequency_days: body.contact_frequency_days || 30,
        notes: body.notes || null,
        notes_path: body.notes_path || null,
        tags: body.tags ? JSON.stringify(body.tags) : null,
      })
      .run();

    const created = await db.select().from(relationships).where(eq(relationships.id, id)).get();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: `Failed to create relationship: ${error}` }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) updates.name = body.name;
    if (body.email !== undefined) updates.email = body.email;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.type !== undefined) updates.type = body.type;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.last_contact !== undefined) updates.last_contact = body.last_contact;
    if (body.contact_frequency_days !== undefined) updates.contact_frequency_days = body.contact_frequency_days;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.notes_path !== undefined) updates.notes_path = body.notes_path;
    if (body.tags !== undefined) updates.tags = JSON.stringify(body.tags);

    await db.update(relationships).set(updates).where(eq(relationships.id, id)).run();

    const updated = await db.select().from(relationships).where(eq(relationships.id, id)).get();
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: `Failed to update relationship: ${error}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  try {
    await db.delete(relationships).where(eq(relationships.id, id)).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: `Failed to delete relationship: ${error}` }, { status: 500 });
  }
}
