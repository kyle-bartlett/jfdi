import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const AUTOMATIONS_PATH = process.env.AUTOMATIONS_PATH ||
  path.join('/Volumes/Bart_26/openclaw_data/projects/ops-dashboard/data/automations.json');

function readAutomations() {
  try {
    if (!fs.existsSync(AUTOMATIONS_PATH)) {
      return { automations: [] };
    }
    return JSON.parse(fs.readFileSync(AUTOMATIONS_PATH, 'utf-8'));
  } catch {
    return { automations: [] };
  }
}

export async function GET() {
  const data = readAutomations();
  return NextResponse.json(data.automations);
}
