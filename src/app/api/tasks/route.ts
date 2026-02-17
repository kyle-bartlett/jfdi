import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tasks, projects } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

async function recalculateProjectProgress(projectId: string) {
  const projectTasks = await db.select().from(tasks).where(eq(tasks.project_id, projectId)).all();
  if (projectTasks.length === 0) return;

  const done = projectTasks.filter((t) => t.status === "done").length;
  const progress = Math.round((done / projectTasks.length) * 100);

  await db.update(projects)
    .set({ progress, updated_at: new Date().toISOString() })
    .where(eq(projects.id, projectId))
    .run();
}

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("project_id");

  if (projectId) {
    const projectTasks = await db.select().from(tasks).where(eq(tasks.project_id, projectId)).orderBy(tasks.created_at).all();
    return NextResponse.json(projectTasks);
  }

  const all = await db.select().from(tasks).orderBy(tasks.created_at).all();
  return NextResponse.json(all);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const id = uuidv4();
    await db.insert(tasks)
      .values({
        id,
        project_id: body.project_id || null,
        title: body.title,
        description: body.description || null,
        status: body.status || "todo",
        due_date: body.due_date || null,
        assignee: body.assignee || null,
        priority: body.priority || "medium",
      })
      .run();

    if (body.project_id) {
      await recalculateProjectProgress(body.project_id);
    }

    const created = await db.select().from(tasks).where(eq(tasks.id, id)).get();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: `Failed to create task: ${error}` }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.status !== undefined) updates.status = body.status;
    if (body.due_date !== undefined) updates.due_date = body.due_date;
    if (body.assignee !== undefined) updates.assignee = body.assignee;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.project_id !== undefined) updates.project_id = body.project_id;

    await db.update(tasks).set(updates).where(eq(tasks.id, id)).run();

    // Recalculate project progress if status changed
    const updated = await db.select().from(tasks).where(eq(tasks.id, id)).get();
    if (updated?.project_id) {
      await recalculateProjectProgress(updated.project_id);
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: `Failed to update task: ${error}` }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  try {
    // Get task to find project_id before deleting
    const task = await db.select().from(tasks).where(eq(tasks.id, id)).get();
    const projectId = task?.project_id;

    await db.delete(tasks).where(eq(tasks.id, id)).run();

    if (projectId) {
      await recalculateProjectProgress(projectId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: `Failed to delete task: ${error}` }, { status: 500 });
  }
}
