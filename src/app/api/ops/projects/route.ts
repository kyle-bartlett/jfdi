import { NextRequest, NextResponse } from 'next/server';
import { getOpsDb } from '@/lib/ops/db';
import { seedOpsIfEmpty } from '@/lib/ops/seed';
import { v4 as uuid } from 'uuid';

export async function GET(req: NextRequest) {
  seedOpsIfEmpty();
  const db = getOpsDb();
  const status = req.nextUrl.searchParams.get('status');
  const priority = req.nextUrl.searchParams.get('priority');
  const search = req.nextUrl.searchParams.get('search');

  let query = 'SELECT * FROM projects WHERE 1=1';
  const params: string[] = [];

  if (status) { query += ' AND status = ?'; params.push(status); }
  if (priority) { query += ' AND priority = ?'; params.push(priority); }
  if (search) { query += ' AND (title LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  query += ' ORDER BY CASE priority WHEN "P0" THEN 0 WHEN "P1" THEN 1 WHEN "P2" THEN 2 WHEN "P3" THEN 3 WHEN "P4" THEN 4 END, updated_at DESC';

  const rows = db.prepare(query).all(...params);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  seedOpsIfEmpty();
  const db = getOpsDb();
  const body = await req.json();
  const id = uuid();
  const stmt = db.prepare(
    'INSERT INTO projects (id, title, description, priority, status, owner, due_date, linked_files) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run(id, body.title || '', body.description || '', body.priority || 'P2', body.status || 'Backlog', body.owner || '', body.due_date || '', body.linked_files || '');
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  return NextResponse.json(row, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const db = getOpsDb();
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const fields = ['title', 'description', 'priority', 'status', 'owner', 'due_date', 'linked_files'];
  const updates: string[] = [];
  const params: string[] = [];
  for (const f of fields) {
    if (body[f] !== undefined) { updates.push(`${f} = ?`); params.push(body[f]); }
  }
  if (updates.length === 0) return NextResponse.json({ error: 'no fields to update' }, { status: 400 });
  updates.push("updated_at = datetime('now')");
  params.push(body.id);
  db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(body.id);
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const db = getOpsDb();
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
