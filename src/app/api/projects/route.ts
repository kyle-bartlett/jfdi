import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const all = await db.select().from(projects).orderBy(projects.name).all();
  return NextResponse.json(all);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = uuidv4();

  await db.insert(projects)
    .values({
      id,
      name: body.name,
      description: body.description || null,
      space: body.space || "personal",
      status: body.status || "active-focus",
      priority: body.priority || "medium",
      progress: body.progress || 0,
      tags: body.tags ? JSON.stringify(body.tags) : null,
    })
    .run();

  const created = await db.select().from(projects).where(eq(projects.id, id)).get();
  return NextResponse.json(created, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.space !== undefined) updates.space = body.space;
  if (body.status !== undefined) updates.status = body.status;
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.progress !== undefined) updates.progress = body.progress;
  if (body.tags !== undefined) updates.tags = JSON.stringify(body.tags);

  await db.update(projects).set(updates).where(eq(projects.id, id)).run();

  const updated = await db.select().from(projects).where(eq(projects.id, id)).get();
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  await db.delete(projects).where(eq(projects.id, id)).run();
  return NextResponse.json({ success: true });
}
