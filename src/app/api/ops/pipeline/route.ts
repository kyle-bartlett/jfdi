import { NextRequest, NextResponse } from 'next/server';
import { getOpsDb } from '@/lib/ops/db';
import { seedOpsIfEmpty } from '@/lib/ops/seed';
import { v4 as uuid } from 'uuid';

export async function GET(req: NextRequest) {
  seedOpsIfEmpty();
  const db = getOpsDb();
  const status = req.nextUrl.searchParams.get('status');
  const search = req.nextUrl.searchParams.get('search');
  let query = 'SELECT * FROM pipeline WHERE 1=1';
  const params: string[] = [];
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (search) { query += ' AND (business_name LIKE ? OR industry LIKE ? OR notes LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  query += ' ORDER BY created_at DESC';
  return NextResponse.json(db.prepare(query).all(...params));
}

export async function POST(req: NextRequest) {
  seedOpsIfEmpty();
  const db = getOpsDb();
  const body = await req.json();
  const id = uuid();
  db.prepare('INSERT INTO pipeline (id, business_name, contact, phone, email, website, industry, location, estimated_value, notes, last_contact_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    id, body.business_name || '', body.contact || '', body.phone || '', body.email || '', body.website || '', body.industry || '', body.location || '', body.estimated_value || '', body.notes || '', body.last_contact_date || '', body.status || 'Lead'
  );
  return NextResponse.json(db.prepare('SELECT * FROM pipeline WHERE id = ?').get(id), { status: 201 });
}

export async function PUT(req: NextRequest) {
  const db = getOpsDb();
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const fields = ['business_name', 'contact', 'phone', 'email', 'website', 'industry', 'location', 'estimated_value', 'notes', 'last_contact_date', 'status'];
  const updates: string[] = [];
  const params: string[] = [];
  for (const f of fields) {
    if (body[f] !== undefined) { updates.push(`${f} = ?`); params.push(body[f]); }
  }
  if (updates.length === 0) return NextResponse.json({ error: 'no fields' }, { status: 400 });
  updates.push("updated_at = datetime('now')");
  params.push(body.id);
  db.prepare(`UPDATE pipeline SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  return NextResponse.json(db.prepare('SELECT * FROM pipeline WHERE id = ?').get(body.id));
}

export async function DELETE(req: NextRequest) {
  const db = getOpsDb();
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  db.prepare('DELETE FROM pipeline WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
