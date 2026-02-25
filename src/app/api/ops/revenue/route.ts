import { NextRequest, NextResponse } from 'next/server';
import { getOpsDb } from '@/lib/ops/db';
import { seedOpsIfEmpty } from '@/lib/ops/seed';
import { v4 as uuid } from 'uuid';

export async function GET(req: NextRequest) {
  seedOpsIfEmpty();
  const db = getOpsDb();
  const source = req.nextUrl.searchParams.get('source');
  const from = req.nextUrl.searchParams.get('from');
  const to = req.nextUrl.searchParams.get('to');
  const type = req.nextUrl.searchParams.get('type');

  let query = 'SELECT * FROM revenue_entries WHERE 1=1';
  const params: string[] = [];

  if (source) {
    query += ' AND source = ?';
    params.push(source);
  }
  if (from) {
    query += ' AND revenue_date >= ?';
    params.push(from);
  }
  if (to) {
    query += ' AND revenue_date <= ?';
    params.push(to);
  }
  if (type) {
    query += ' AND revenue_type = ?';
    params.push(type);
  }

  query += ' ORDER BY revenue_date DESC';
  const entries = db.prepare(query).all(...params);

  // Summary stats
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const totalAllTime = (db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM revenue_entries').get() as { total: number }).total;
  const totalThisMonth = (db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM revenue_entries WHERE revenue_date >= ?').get(monthStart) as { total: number }).total;
  const totalThisWeek = (db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM revenue_entries WHERE revenue_date >= ?').get(weekStartStr) as { total: number }).total;
  const totalToday = (db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM revenue_entries WHERE revenue_date = ?').get(today) as { total: number }).total;

  const bySource = db.prepare(
    'SELECT source, COALESCE(SUM(amount), 0) as total FROM revenue_entries GROUP BY source ORDER BY total DESC'
  ).all() as { source: string; total: number }[];

  // Monthly totals for last 6 months
  const monthlyTotals: { month: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStart = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const mEndStr = `${mEnd.getFullYear()}-${String(mEnd.getMonth() + 1).padStart(2, '0')}-${String(mEnd.getDate()).padStart(2, '0')}`;
    const row = db.prepare(
      'SELECT COALESCE(SUM(amount), 0) as total FROM revenue_entries WHERE revenue_date >= ? AND revenue_date <= ?'
    ).get(mStart, mEndStr) as { total: number };
    const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    monthlyTotals.push({ month: monthLabel, total: row.total });
  }

  return NextResponse.json({
    entries,
    summary: {
      total_all_time: totalAllTime,
      total_this_month: totalThisMonth,
      total_this_week: totalThisWeek,
      total_today: totalToday,
      by_source: bySource,
      monthly_totals: monthlyTotals,
    },
  });
}

export async function POST(req: NextRequest) {
  seedOpsIfEmpty();
  const db = getOpsDb();
  const body = await req.json();
  const id = uuid();

  db.prepare(
    `INSERT INTO revenue_entries (id, amount, source, client_name, description, revenue_type, revenue_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    body.amount,
    body.source,
    body.client_name || '',
    body.description || '',
    body.revenue_type || 'one-time',
    body.revenue_date
  );

  const row = db.prepare('SELECT * FROM revenue_entries WHERE id = ?').get(id);
  return NextResponse.json(row, { status: 201 });
}

export async function PUT(req: NextRequest) {
  seedOpsIfEmpty();
  const db = getOpsDb();
  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const fields = ['amount', 'source', 'client_name', 'description', 'revenue_type', 'revenue_date'];
  const updates: string[] = [];
  const params: (string | number)[] = [];

  for (const f of fields) {
    if (body[f] !== undefined) {
      updates.push(`${f} = ?`);
      params.push(body[f]);
    }
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    params.push(body.id);
    db.prepare(`UPDATE revenue_entries SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  const row = db.prepare('SELECT * FROM revenue_entries WHERE id = ?').get(body.id);
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  seedOpsIfEmpty();
  const db = getOpsDb();
  const id = req.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  db.prepare('DELETE FROM revenue_entries WHERE id = ?').run(id);
  return NextResponse.json({ deleted: true });
}
