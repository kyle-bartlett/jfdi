import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sparkEntries } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const all = await db.select().from(sparkEntries).orderBy(sparkEntries.created_at).all();
  // Return newest first
  return NextResponse.json(all.reverse());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = uuidv4();

  await db.insert(sparkEntries)
    .values({
      id,
      content: body.content,
      tags: body.tags ? JSON.stringify(body.tags) : null,
      connections: body.connections ? JSON.stringify(body.connections) : null,
    })
    .run();

  const created = await db.select().from(sparkEntries).where(eq(sparkEntries.id, id)).get();
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.content !== undefined) updates.content = body.content;
  if (body.tags !== undefined) updates.tags = JSON.stringify(body.tags);
  if (body.connections !== undefined) updates.connections = JSON.stringify(body.connections);

  await db.update(sparkEntries).set(updates).where(eq(sparkEntries.id, id)).run();

  const updated = await db.select().from(sparkEntries).where(eq(sparkEntries.id, id)).get();
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await db.delete(sparkEntries).where(eq(sparkEntries.id, id)).run();
  return NextResponse.json({ success: true });
}
