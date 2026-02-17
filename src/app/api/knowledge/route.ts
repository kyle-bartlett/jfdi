import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { knowledgeEntries } from "@/lib/schema";
import { eq, like, or } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search");

    if (search) {
      const pattern = `%${search}%`;
      const results = await db
        .select()
        .from(knowledgeEntries)
        .where(
          or(
            like(knowledgeEntries.title, pattern),
            like(knowledgeEntries.content, pattern)
          )
        )
        .orderBy(knowledgeEntries.created_at)
        .all();
      return NextResponse.json(results);
    }

    const all = await db
      .select()
      .from(knowledgeEntries)
      .orderBy(knowledgeEntries.created_at)
      .all();
    return NextResponse.json(all);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch knowledge entries: ${error}` },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const id = uuidv4();
    await db
      .insert(knowledgeEntries)
      .values({
        id,
        title: body.title,
        source_url: body.source_url || null,
        content: body.content || null,
        content_path: null,
        tags: body.tags ? JSON.stringify(body.tags) : null,
        related_people: body.related_people
          ? JSON.stringify(body.related_people)
          : null,
      })
      .run();

    const created = await db
      .select()
      .from(knowledgeEntries)
      .where(eq(knowledgeEntries.id, id))
      .get();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to create entry: ${error}` },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.title !== undefined) updates.title = body.title;
    if (body.source_url !== undefined) updates.source_url = body.source_url;
    if (body.content !== undefined) updates.content = body.content;
    if (body.tags !== undefined) updates.tags = JSON.stringify(body.tags);
    if (body.related_people !== undefined)
      updates.related_people = JSON.stringify(body.related_people);

    await db
      .update(knowledgeEntries)
      .set(updates)
      .where(eq(knowledgeEntries.id, id))
      .run();

    const updated = await db
      .select()
      .from(knowledgeEntries)
      .where(eq(knowledgeEntries.id, id))
      .get();
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to update entry: ${error}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  try {
    await db
      .delete(knowledgeEntries)
      .where(eq(knowledgeEntries.id, id))
      .run();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to delete entry: ${error}` },
      { status: 500 }
    );
  }
}
