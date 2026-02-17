import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { goals } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const all = await db.select().from(goals).orderBy(goals.category).all();
  return NextResponse.json(all);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = uuidv4();

  await db.insert(goals)
    .values({
      id,
      title: body.title,
      description: body.description || null,
      category: body.category || "personal",
      target_percentage: body.target_percentage ?? 100,
      current_percentage: body.current_percentage ?? 0,
      period_start: body.period_start || null,
      period_end: body.period_end || null,
    })
    .run();

  const created = await db.select().from(goals).where(eq(goals.id, id)).get();
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.category !== undefined) updates.category = body.category;
  if (body.target_percentage !== undefined) updates.target_percentage = body.target_percentage;
  if (body.current_percentage !== undefined) updates.current_percentage = body.current_percentage;
  if (body.period_start !== undefined) updates.period_start = body.period_start;
  if (body.period_end !== undefined) updates.period_end = body.period_end;

  await db.update(goals).set(updates).where(eq(goals.id, id)).run();

  const updated = await db.select().from(goals).where(eq(goals.id, id)).get();
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await db.delete(goals).where(eq(goals.id, id)).run();
  return NextResponse.json({ success: true });
}
