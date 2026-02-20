import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const QUEUE_PATH = process.env.ACTION_QUEUE_PATH ||
  path.join('/Volumes/Bart_26/openclaw_data/projects/ops-dashboard/data/action-queue.json');

function readQueue() {
  try {
    if (!fs.existsSync(QUEUE_PATH)) {
      return { items: [] };
    }
    return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));
  } catch {
    return { items: [] };
  }
}

function writeQueue(data: { items: unknown[] }) {
  const dir = path.dirname(QUEUE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(data, null, 2));
}

export async function GET() {
  const data = readQueue();
  return NextResponse.json(data.items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = readQueue();
  const newItem = {
    id: `aq-${Date.now()}`,
    title: body.title || '',
    description: body.description || '',
    source: body.source || 'Manual',
    priority: body.priority || 'P2',
    status: 'pending',
    notes: body.notes || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  data.items.push(newItem);
  writeQueue(data);
  return NextResponse.json(newItem, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const data = readQueue();
  const idx = data.items.findIndex((i: { id: string }) => i.id === body.id);
  if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const item = data.items[idx] as Record<string, unknown>;
  if (body.status !== undefined) item.status = body.status;
  if (body.notes !== undefined) item.notes = body.notes;
  if (body.title !== undefined) item.title = body.title;
  if (body.description !== undefined) item.description = body.description;
  if (body.priority !== undefined) item.priority = body.priority;
  item.updated_at = new Date().toISOString();

  data.items[idx] = item;
  writeQueue(data);
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const data = readQueue();
  data.items = data.items.filter((i: { id: string }) => i.id !== id);
  writeQueue(data);
  return NextResponse.json({ ok: true });
}
