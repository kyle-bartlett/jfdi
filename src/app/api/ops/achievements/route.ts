import { NextResponse } from 'next/server';
import { getOpsDb } from '@/lib/ops/db';

export async function GET() {
  const db = getOpsDb();

  // All defined badges (whether unlocked or not)
  const allBadges = [
    { key: 'first_blood', name: 'First Blood', icon: '🩸', description: '1 day streak', threshold: 1, category: 'streak' },
    { key: 'week_warrior', name: 'Week Warrior', icon: '⚔️', description: '7 day streak', threshold: 7, category: 'streak' },
    { key: 'monthly_machine', name: 'Monthly Machine', icon: '🏭', description: '30 day streak', threshold: 30, category: 'streak' },
    { key: 'quarter_killer', name: 'Quarter Killer', icon: '💀', description: '90 day streak', threshold: 90, category: 'streak' },
    { key: 'century_prospector', name: 'Century Prospector', icon: '💯', description: '100 prospects in pipeline', threshold: 100, category: 'milestone' },
    { key: 'agent_commander', name: 'Agent Commander', icon: '🤖', description: '50 agent deploys', threshold: 50, category: 'milestone' },
  ];

  const unlockedRows = db.prepare(
    'SELECT * FROM achievements ORDER BY unlocked_at DESC'
  ).all() as { badge_key: string; badge_name: string; badge_icon: string; unlocked_at: string }[];

  const unlockedMap = new Map(unlockedRows.map(r => [r.badge_key, r]));

  const badges = allBadges.map(b => ({
    ...b,
    unlocked: unlockedMap.has(b.key),
    unlocked_at: unlockedMap.get(b.key)?.unlocked_at || null,
  }));

  return NextResponse.json({
    badges,
    totalUnlocked: unlockedRows.length,
    totalBadges: allBadges.length,
  });
}
