import { NextRequest, NextResponse } from 'next/server';
import { getOpsDb } from '@/lib/ops/db';
import { v4 as uuid } from 'uuid';

const HABIT_KEYS = [
  'prospect_outreach',
  'content_posted',
  'agent_deployed',
  'code_shipped',
  'inbox_zero',
  'exercise',
];

export async function GET(req: NextRequest) {
  const db = getOpsDb();
  const date = req.nextUrl.searchParams.get('date');
  const days = parseInt(req.nextUrl.searchParams.get('days') || '90');

  if (date) {
    // Get habits for a specific date
    const rows = db.prepare(
      'SELECT * FROM daily_habits WHERE habit_date = ? ORDER BY habit_key'
    ).all(date);
    return NextResponse.json(rows);
  }

  // Get habits for last N days
  const rows = db.prepare(
    `SELECT * FROM daily_habits WHERE habit_date >= date('now', '-${days} days') ORDER BY habit_date DESC, habit_key`
  ).all();

  // Calculate streaks for each habit
  const streaks: Record<string, { current: number; longest: number }> = {};
  for (const key of HABIT_KEYS) {
    const habitRows = db.prepare(
      `SELECT habit_date, completed FROM daily_habits WHERE habit_key = ? ORDER BY habit_date DESC`
    ).all(key) as { habit_date: string; completed: number }[];

    let current = 0;
    let longest = 0;
    let tempStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Calculate current streak (must include today or yesterday)
    for (const row of habitRows) {
      if (row.completed) {
        tempStreak++;
      } else {
        break;
      }
    }
    // Only count as current streak if the most recent completed is today or yesterday
    if (habitRows.length > 0 && habitRows[0].completed &&
      (habitRows[0].habit_date === today || habitRows[0].habit_date === yesterday)) {
      current = tempStreak;
    }

    // Calculate longest streak
    tempStreak = 0;
    for (const row of habitRows) {
      if (row.completed) {
        tempStreak++;
        longest = Math.max(longest, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    streaks[key] = { current, longest };
  }

  // Get activity heatmap data (from activity_log)
  const heatmapData = db.prepare(
    `SELECT date(created_at) as day, COUNT(*) as count FROM activity_log WHERE created_at >= date('now', '-${days} days') GROUP BY date(created_at) ORDER BY day`
  ).all() as { day: string; count: number }[];

  // Overall streak (any activity)
  const dailyActivityDays = db.prepare(
    `SELECT DISTINCT date(created_at) as day FROM activity_log ORDER BY day DESC`
  ).all() as { day: string }[];

  let overallCurrentStreak = 0;
  let overallLongestStreak = 0;
  let tempOverall = 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Check consecutive days
  if (dailyActivityDays.length > 0) {
    let prevDate: Date | null = null;
    for (const d of dailyActivityDays) {
      const currentDate = new Date(d.day + 'T00:00:00');
      if (prevDate === null) {
        if (d.day === todayStr || d.day === yesterdayStr) {
          tempOverall = 1;
        } else {
          break;
        }
      } else {
        const diff = (prevDate.getTime() - currentDate.getTime()) / 86400000;
        if (diff === 1) {
          tempOverall++;
        } else {
          break;
        }
      }
      prevDate = currentDate;
    }
    overallCurrentStreak = tempOverall;

    // Longest streak
    tempOverall = 0;
    let prev: Date | null = null;
    for (const d of dailyActivityDays) {
      const cur = new Date(d.day + 'T00:00:00');
      if (prev === null) {
        tempOverall = 1;
      } else {
        const diff = (prev.getTime() - cur.getTime()) / 86400000;
        if (diff === 1) {
          tempOverall++;
        } else {
          tempOverall = 1;
        }
      }
      overallLongestStreak = Math.max(overallLongestStreak, tempOverall);
      prev = cur;
    }
  }

  const totalActiveDays = dailyActivityDays.length;
  const weeklyAvg = totalActiveDays > 0 ? Math.round((totalActiveDays / Math.max(days / 7, 1)) * 10) / 10 : 0;

  // Monthly trend (last 4 months)
  const monthlyTrend = db.prepare(
    `SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count FROM activity_log WHERE created_at >= date('now', '-120 days') GROUP BY month ORDER BY month`
  ).all() as { month: string; count: number }[];

  return NextResponse.json({
    habits: rows,
    streaks,
    heatmapData,
    overallStats: {
      currentStreak: overallCurrentStreak,
      longestStreak: overallLongestStreak,
      totalActiveDays,
      weeklyAvg,
      monthlyTrend,
    },
  });
}

export async function POST(req: NextRequest) {
  const db = getOpsDb();
  const body = await req.json();
  const { habit_date, habit_key, completed } = body;

  if (!habit_date || !habit_key) {
    return NextResponse.json({ error: 'habit_date and habit_key required' }, { status: 400 });
  }

  if (!HABIT_KEYS.includes(habit_key)) {
    return NextResponse.json({ error: 'Invalid habit_key' }, { status: 400 });
  }

  // Upsert habit
  const existing = db.prepare(
    'SELECT id FROM daily_habits WHERE habit_date = ? AND habit_key = ?'
  ).get(habit_date, habit_key) as { id: string } | undefined;

  if (existing) {
    db.prepare(
      'UPDATE daily_habits SET completed = ? WHERE id = ?'
    ).run(completed ? 1 : 0, existing.id);
  } else {
    const id = uuid();
    db.prepare(
      'INSERT INTO daily_habits (id, habit_date, habit_key, completed) VALUES (?, ?, ?, ?)'
    ).run(id, habit_date, habit_key, completed ? 1 : 0);
  }

  // Recalculate streak_count for this habit
  const habitHistory = db.prepare(
    'SELECT habit_date, completed FROM daily_habits WHERE habit_key = ? ORDER BY habit_date DESC'
  ).all(habit_key) as { habit_date: string; completed: number }[];

  let streakCount = 0;
  for (const h of habitHistory) {
    if (h.completed) {
      streakCount++;
    } else {
      break;
    }
  }

  // Update streak count on all recent entries
  db.prepare(
    'UPDATE daily_habits SET streak_count = ? WHERE habit_key = ? AND habit_date = ?'
  ).run(streakCount, habit_key, habit_date);

  // Check for achievement unlocks
  checkAchievements(db, streakCount);

  // Also log to activity_log
  if (completed) {
    const habitLabels: Record<string, string> = {
      prospect_outreach: 'Prospect outreach',
      content_posted: 'Content posted',
      agent_deployed: 'Agent deployed',
      code_shipped: 'Code shipped',
      inbox_zero: 'Inbox zero',
      exercise: 'Exercise',
    };
    db.prepare(
      'INSERT INTO activity_log (id, event_type, title, description, source, icon, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      uuid(),
      'milestone',
      `✅ ${habitLabels[habit_key] || habit_key} completed`,
      `Streak: ${streakCount} day${streakCount !== 1 ? 's' : ''}`,
      'Kyle',
      '✅',
      JSON.stringify({ habit_key, streak: streakCount })
    );
  }

  return NextResponse.json({ ok: true, streak_count: streakCount });
}

function checkAchievements(db: ReturnType<typeof getOpsDb>, streakCount: number) {
  const badges = [
    { key: 'first_blood', name: 'First Blood', icon: '🩸', threshold: 1 },
    { key: 'week_warrior', name: 'Week Warrior', icon: '⚔️', threshold: 7 },
    { key: 'monthly_machine', name: 'Monthly Machine', icon: '🏭', threshold: 30 },
    { key: 'quarter_killer', name: 'Quarter Killer', icon: '💀', threshold: 90 },
  ];

  for (const badge of badges) {
    if (streakCount >= badge.threshold) {
      const existing = db.prepare(
        'SELECT id FROM achievements WHERE badge_key = ?'
      ).get(badge.key);
      if (!existing) {
        db.prepare(
          'INSERT INTO achievements (id, badge_key, badge_name, badge_icon) VALUES (?, ?, ?, ?)'
        ).run(uuid(), badge.key, badge.name, badge.icon);
      }
    }
  }

  // Custom milestone badges based on total counts
  try {
    const totalProspects = db.prepare("SELECT COUNT(*) as count FROM pipeline").get() as { count: number };
    if (totalProspects.count >= 100) {
      const existing = db.prepare("SELECT id FROM achievements WHERE badge_key = 'century_prospector'").get();
      if (!existing) {
        db.prepare(
          'INSERT INTO achievements (id, badge_key, badge_name, badge_icon) VALUES (?, ?, ?, ?)'
        ).run(uuid(), 'century_prospector', 'Century Prospector', '💯');
      }
    }

    const totalAgentDeploys = db.prepare("SELECT COUNT(*) as count FROM agent_tasks").get() as { count: number };
    if (totalAgentDeploys.count >= 50) {
      const existing = db.prepare("SELECT id FROM achievements WHERE badge_key = 'agent_commander'").get();
      if (!existing) {
        db.prepare(
          'INSERT INTO achievements (id, badge_key, badge_name, badge_icon) VALUES (?, ?, ?, ?)'
        ).run(uuid(), 'agent_commander', 'Agent Commander', '🤖');
      }
    }
  } catch {
    // Tables may not exist
  }
}
