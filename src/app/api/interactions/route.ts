import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { interactions, relationships } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  const relationshipId = request.nextUrl.searchParams.get("relationship_id");

  if (relationshipId) {
    const items = await db.select().from(interactions)
      .where(eq(interactions.relationship_id, relationshipId))
      .orderBy(interactions.created_at)
      .all();
    return NextResponse.json(items);
  }

  const all = await db.select().from(interactions).orderBy(interactions.created_at).all();
  return NextResponse.json(all);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.relationship_id) {
      return NextResponse.json({ error: "relationship_id is required" }, { status: 400 });
    }

    const id = uuidv4();
    await db.insert(interactions).values({
      id,
      relationship_id: body.relationship_id,
      type: body.type || "contact",
      notes: body.notes || null,
    }).run();

    // Update last_contact on the relationship
    await db.update(relationships)
      .set({
        last_contact: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .where(eq(relationships.id, body.relationship_id))
      .run();

    const created = await db.select().from(interactions).where(eq(interactions.id, id)).get();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: `Failed to create interaction: ${error}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  try {
    await db.delete(interactions).where(eq(interactions.id, id)).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: `Failed to delete interaction: ${error}` }, { status: 500 });
  }
}
