import { NextRequest, NextResponse } from 'next/server';
import { getOpsDb } from '@/lib/ops/db';
import { seedOpsIfEmpty } from '@/lib/ops/seed';
import { v4 as uuid } from 'uuid';

export async function GET(req: NextRequest) {
  seedOpsIfEmpty();
  const db = getOpsDb();
  const category = req.nextUrl.searchParams.get('category');
  const search = req.nextUrl.searchParams.get('search');
  let query = 'SELECT * FROM prompts WHERE 1=1';
  const params: string[] = [];
  if (category) { query += ' AND category = ?'; params.push(category); }
  if (search) { query += ' AND (title LIKE ? OR prompt_text LIKE ? OR tags LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  query += ' ORDER BY usage_count DESC, created_at DESC';
  return NextResponse.json(db.prepare(query).all(...params));
}

export async function POST(req: NextRequest) {
  seedOpsIfEmpty();
  const db = getOpsDb();
  const body = await req.json();
  const id = uuid();
  db.prepare('INSERT INTO prompts (id, title, prompt_text, category, tags) VALUES (?, ?, ?, ?, ?)').run(
    id, body.title || '', body.prompt_text || '', body.category || 'Development', body.tags || ''
  );
  return NextResponse.json(db.prepare('SELECT * FROM prompts WHERE id = ?').get(id), { status: 201 });
}

export async function PUT(req: NextRequest) {
  const db = getOpsDb();
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const fields = ['title', 'prompt_text', 'category', 'tags', 'usage_count', 'last_used'];
  const updates: string[] = [];
  const params: (string | number)[] = [];
  for (const f of fields) {
    if (body[f] !== undefined) { updates.push(`${f} = ?`); params.push(body[f]); }
  }
  if (updates.length === 0) return NextResponse.json({ error: 'no fields' }, { status: 400 });
  updates.push("updated_at = datetime('now')");
  params.push(body.id);
  db.prepare(`UPDATE prompts SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  return NextResponse.json(db.prepare('SELECT * FROM prompts WHERE id = ?').get(body.id));
}

export async function DELETE(req: NextRequest) {
  const db = getOpsDb();
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  db.prepare('DELETE FROM prompts WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
