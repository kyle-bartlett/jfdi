import { NextRequest, NextResponse } from 'next/server';
import { getOpsDb } from '@/lib/ops/db';
import { seedOpsIfEmpty } from '@/lib/ops/seed';
import { v4 as uuid } from 'uuid';

export async function GET(req: NextRequest) {
  seedOpsIfEmpty();
  const db = getOpsDb();
  const eventType = req.nextUrl.searchParams.get('event_type');
  const starred = req.nextUrl.searchParams.get('starred');
  const pinned = req.nextUrl.searchParams.get('pinned');
  const search = req.nextUrl.searchParams.get('search');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

  let query = 'SELECT * FROM activity_log WHERE 1=1';
  const params: (string | number)[] = [];

  if (eventType) { query += ' AND event_type = ?'; params.push(eventType); }
  if (starred === '1') { query += ' AND starred = 1'; }
  if (pinned === '1') { query += ' AND pinned = 1'; }
  if (search) { query += ' AND (title LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  // Pinned first, then by date
  query += ' ORDER BY pinned DESC, created_at DESC LIMIT ?';
  params.push(limit);

  const rows = db.prepare(query).all(...params);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  seedOpsIfEmpty();
  const db = getOpsDb();
  const body = await req.json();
  const id = uuid();
  db.prepare(
    'INSERT INTO activity_log (id, event_type, title, description, source, icon, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id,
    body.event_type || 'note',
    body.title || '',
    body.description || '',
    body.source || '',
    body.icon || '📌',
    JSON.stringify(body.metadata || {})
  );
  const row = db.prepare('SELECT * FROM activity_log WHERE id = ?').get(id);
  return NextResponse.json(row, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const db = getOpsDb();
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const fields = ['event_type', 'title', 'description', 'source', 'icon', 'starred', 'pinned', 'metadata'];
  const updates: string[] = [];
  const params: (string | number)[] = [];

  for (const f of fields) {
    if (body[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(f === 'metadata' ? JSON.stringify(body[f]) : body[f]);
    }
  }

  if (updates.length === 0) return NextResponse.json({ error: 'no fields' }, { status: 400 });
  params.push(body.id);

  db.prepare(`UPDATE activity_log SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  const row = db.prepare('SELECT * FROM activity_log WHERE id = ?').get(body.id);
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const db = getOpsDb();
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  db.prepare('DELETE FROM activity_log WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
