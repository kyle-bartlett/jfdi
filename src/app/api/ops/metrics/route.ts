import { NextRequest, NextResponse } from 'next/server';
import { getOpsDb } from '@/lib/ops/db';
import { seedOpsIfEmpty } from '@/lib/ops/seed';
import { v4 as uuid } from 'uuid';

export async function GET(req: NextRequest) {
  seedOpsIfEmpty();
  const db = getOpsDb();
  const date = req.nextUrl.searchParams.get('date');
  const range = req.nextUrl.searchParams.get('range'); // 'week' or 'month'

  if (date) {
    const row = db.prepare('SELECT * FROM daily_metrics WHERE metric_date = ?').get(date);
    return NextResponse.json(row || null);
  }

  if (range === 'week') {
    const rows = db.prepare(
      "SELECT * FROM daily_metrics WHERE metric_date >= date('now', '-7 days') ORDER BY metric_date DESC"
    ).all();
    return NextResponse.json(rows);
  }

  if (range === 'month') {
    const rows = db.prepare(
      "SELECT * FROM daily_metrics WHERE metric_date >= date('now', '-30 days') ORDER BY metric_date DESC"
    ).all();
    return NextResponse.json(rows);
  }

  const rows = db.prepare('SELECT * FROM daily_metrics ORDER BY metric_date DESC LIMIT 30').all();
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  seedOpsIfEmpty();
  const db = getOpsDb();
  const body = await req.json();
  const today = body.metric_date || new Date().toISOString().split('T')[0];

  // Upsert — if today exists, update it; otherwise insert
  const existing = db.prepare('SELECT * FROM daily_metrics WHERE metric_date = ?').get(today);

  if (existing) {
    const fields = ['agents_deployed', 'tasks_completed', 'prospects_contacted', 'ideas_logged', 'revenue_closed', 'active_streak', 'mood', 'notes', 'daily_focus'];
    const updates: string[] = [];
    const params: (string | number)[] = [];
    for (const f of fields) {
      if (body[f] !== undefined) { updates.push(`${f} = ?`); params.push(body[f]); }
    }
    if (updates.length > 0) {
      updates.push("updated_at = datetime('now')");
      params.push(today);
      db.prepare(`UPDATE daily_metrics SET ${updates.join(', ')} WHERE metric_date = ?`).run(...params);
    }
    const row = db.prepare('SELECT * FROM daily_metrics WHERE metric_date = ?').get(today);
    return NextResponse.json(row);
  }

  const id = uuid();
  db.prepare(
    'INSERT INTO daily_metrics (id, metric_date, agents_deployed, tasks_completed, prospects_contacted, ideas_logged, revenue_closed, active_streak, mood, notes, daily_focus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id, today,
    body.agents_deployed || 0,
    body.tasks_completed || 0,
    body.prospects_contacted || 0,
    body.ideas_logged || 0,
    body.revenue_closed || 0,
    body.active_streak || 0,
    body.mood || 'grinding',
    body.notes || '',
    body.daily_focus || '[]'
  );
  const row = db.prepare('SELECT * FROM daily_metrics WHERE id = ?').get(id);
  return NextResponse.json(row, { status: 201 });
}
