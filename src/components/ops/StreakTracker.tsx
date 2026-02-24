'use client';

import { useEffect, useState, useCallback } from 'react';

// ─── Types ─────────────────────────────────────────────────────────
interface HabitRow {
  id: string;
  habit_date: string;
  habit_key: string;
  completed: number;
  streak_count: number;
}

interface HeatmapDay {
  day: string;
  count: number;
}

interface MonthlyTrend {
  month: string;
  count: number;
}

interface StreakData {
  habits: HabitRow[];
  streaks: Record<string, { current: number; longest: number }>;
  heatmapData: HeatmapDay[];
  overallStats: {
    currentStreak: number;
    longestStreak: number;
    totalActiveDays: number;
    weeklyAvg: number;
    monthlyTrend: MonthlyTrend[];
  };
}

interface Badge {
  key: string;
  name: string;
  icon: string;
  description: string;
  threshold: number;
  category: string;
  unlocked: boolean;
  unlocked_at: string | null;
}

interface AchievementData {
  badges: Badge[];
  totalUnlocked: number;
  totalBadges: number;
}

const HABITS = [
  { key: 'prospect_outreach', label: 'Prospect outreach done', icon: '🎯' },
  { key: 'content_posted', label: 'Content posted', icon: '📝' },
  { key: 'agent_deployed', label: 'Agent deployed', icon: '🤖' },
  { key: 'code_shipped', label: 'Code shipped', icon: '🚀' },
  { key: 'inbox_zero', label: 'Inbox zero', icon: '📬' },
  { key: 'exercise', label: 'Exercise', icon: '💪' },
];

// ─── Contribution Heatmap ──────────────────────────────────────────
function ContributionHeatmap({ heatmapData }: { heatmapData: HeatmapDay[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  // Build 90-day grid
  const days: { date: string; count: number; dayOfWeek: number }[] = [];
  const today = new Date();
  const dataMap = new Map(heatmapData.map(d => [d.day, d.count]));

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      count: dataMap.get(dateStr) || 0,
      dayOfWeek: d.getDay(),
    });
  }

  // Group into weeks
  const weeks: typeof days[] = [];
  let currentWeek: typeof days = [];
  for (const day of days) {
    if (day.dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const getIntensity = (count: number): string => {
    if (count === 0) return 'bg-secondary';
    if (count <= 2) return 'bg-primary/20';
    if (count <= 5) return 'bg-primary/40';
    if (count <= 10) return 'bg-primary/70';
    return 'bg-primary';
  };

  const maxCount = Math.max(...days.map(d => d.count), 1);

  return (
    <div className="widget">
      <h3 className="widget-title">📊 Activity Heatmap — Last 90 Days</h3>
      <div className="relative">
        <div className="flex gap-[3px] overflow-x-auto pb-2">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`w-3 h-3 rounded-sm ${getIntensity(day.count)} cursor-pointer transition-all hover:ring-1 hover:ring-ring`}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({
                      x: rect.left + rect.width / 2,
                      y: rect.top - 8,
                      text: `${day.date}: ${day.count} event${day.count !== 1 ? 's' : ''}`,
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-secondary" />
          <div className="w-3 h-3 rounded-sm bg-primary/20" />
          <div className="w-3 h-3 rounded-sm bg-primary/40" />
          <div className="w-3 h-3 rounded-sm bg-primary/70" />
          <div className="w-3 h-3 rounded-sm bg-primary" />
          <span>More</span>
          <span className="ml-auto">Peak: {maxCount} events</span>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 px-2 py-1 text-xs bg-popover text-popover-foreground border border-border rounded shadow-lg pointer-events-none"
            style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
          >
            {tooltip.text}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Daily Habits Checklist ────────────────────────────────────────
function DailyHabits({
  habits,
  streaks,
  onToggle,
}: {
  habits: HabitRow[];
  streaks: Record<string, { current: number; longest: number }>;
  onToggle: (key: string, completed: boolean) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const todayHabits = new Map(
    habits.filter(h => h.habit_date === today).map(h => [h.habit_key, h.completed])
  );
  const completedCount = HABITS.filter(h => todayHabits.get(h.key) === 1).length;

  return (
    <div className="widget">
      <div className="flex items-center justify-between mb-4">
        <h3 className="widget-title mb-0">✅ Daily Habits</h3>
        <span className="badge badge-primary">{completedCount}/{HABITS.length} today</span>
      </div>
      <div className="space-y-2">
        {HABITS.map((habit) => {
          const isCompleted = todayHabits.get(habit.key) === 1;
          const streak = streaks[habit.key] || { current: 0, longest: 0 };
          return (
            <button
              key={habit.key}
              onClick={() => onToggle(habit.key, !isCompleted)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                isCompleted
                  ? 'bg-accent/10 border-accent/30'
                  : 'bg-card border-border hover:border-muted-foreground/40'
              }`}
            >
              <span className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                isCompleted
                  ? 'bg-accent border-accent text-accent-foreground'
                  : 'border-muted-foreground/40'
              }`}>
                {isCompleted && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className="text-lg">{habit.icon}</span>
              <span className={`text-sm flex-1 text-left ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                {habit.label}
              </span>
              {streak.current > 0 && (
                <span className="flex items-center gap-1 text-xs text-warning font-medium">
                  🔥 {streak.current}d
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / HABITS.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Streak Stats Dashboard ───────────────────────────────────────
function StreakStats({ stats }: {
  stats: {
    currentStreak: number;
    longestStreak: number;
    totalActiveDays: number;
    weeklyAvg: number;
    monthlyTrend: MonthlyTrend[];
  };
}) {
  const maxMonthly = Math.max(...stats.monthlyTrend.map(m => m.count), 1);

  return (
    <div className="widget">
      <h3 className="widget-title">📈 Streak Stats</h3>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon="🔥"
          label="Current Streak"
          value={`${stats.currentStreak}d`}
          accent={stats.currentStreak >= 7}
        />
        <StatCard
          icon="🏆"
          label="Longest Streak"
          value={`${stats.longestStreak}d`}
          accent={stats.longestStreak >= 30}
        />
        <StatCard
          icon="📅"
          label="Active Days"
          value={`${stats.totalActiveDays}`}
          accent={false}
        />
        <StatCard
          icon="📊"
          label="Weekly Avg"
          value={`${stats.weeklyAvg}`}
          accent={stats.weeklyAvg >= 5}
        />
      </div>

      {/* Monthly Trend */}
      {stats.monthlyTrend.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Monthly Trend</h4>
          <div className="flex items-end gap-2 h-24">
            {stats.monthlyTrend.map((m) => {
              const height = Math.max((m.count / maxMonthly) * 100, 5);
              const monthLabel = new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short' });
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">{m.count}</span>
                  <div
                    className="w-full bg-primary/30 rounded-t transition-all duration-500"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{monthLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, accent }: {
  icon: string; label: string; value: string; accent: boolean;
}) {
  return (
    <div className={`p-3 rounded-lg border transition-all ${
      accent ? 'bg-primary/10 border-primary/30' : 'bg-card border-border'
    }`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className={`text-xl font-bold ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</div>
    </div>
  );
}

// ─── Achievement Badges ────────────────────────────────────────────
function AchievementBadges({ badges, totalUnlocked, totalBadges }: AchievementData) {
  return (
    <div className="widget">
      <div className="flex items-center justify-between mb-4">
        <h3 className="widget-title mb-0">🏅 Achievements</h3>
        <span className="badge badge-accent">{totalUnlocked}/{totalBadges} unlocked</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {badges.map((badge) => (
          <div
            key={badge.key}
            className={`relative p-4 rounded-xl border text-center transition-all ${
              badge.unlocked
                ? 'bg-card border-primary/30 achievement-unlocked'
                : 'bg-secondary/50 border-border opacity-50'
            }`}
          >
            <div className={`text-3xl mb-2 ${badge.unlocked ? '' : 'grayscale'}`}>
              {badge.icon}
            </div>
            <div className={`text-sm font-medium ${badge.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
              {badge.name}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{badge.description}</div>
            {badge.unlocked && badge.unlocked_at && (
              <div className="text-[10px] text-accent mt-2">
                Unlocked {new Date(badge.unlocked_at).toLocaleDateString()}
              </div>
            )}
            {!badge.unlocked && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl opacity-30">🔒</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main StreakTracker ─────────────────────────────────────────────
export function StreakTracker() {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [achievementData, setAchievementData] = useState<AchievementData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [habitsRes, achievementsRes] = await Promise.all([
        fetch('/api/ops/habits?days=90'),
        fetch('/api/ops/achievements'),
      ]);
      const habits = await habitsRes.json();
      const achievements = await achievementsRes.json();
      setStreakData(habits);
      setAchievementData(achievements);
    } catch (err) {
      console.error('Failed to fetch streak data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleHabit = async (habitKey: string, completed: boolean) => {
    const today = new Date().toISOString().split('T')[0];
    await fetch('/api/ops/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habit_date: today, habit_key: habitKey, completed }),
    });
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading streak data...
      </div>
    );
  }

  if (!streakData || !achievementData) {
    return <div className="text-muted-foreground">Failed to load streak data</div>;
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="widget">
        <div className="flex items-center gap-4">
          <span className="text-5xl">🔥</span>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {streakData.overallStats.currentStreak > 0
                ? `${streakData.overallStats.currentStreak} Day Streak!`
                : 'Start Your Streak'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {streakData.overallStats.currentStreak > 0
                ? 'Keep the momentum going. Every day counts.'
                : 'Complete your daily habits to build streaks and unlock achievements.'}
            </p>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <ContributionHeatmap heatmapData={streakData.heatmapData} />

      {/* Habits + Stats row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailyHabits
          habits={streakData.habits}
          streaks={streakData.streaks}
          onToggle={handleToggleHabit}
        />
        <StreakStats stats={streakData.overallStats} />
      </div>

      {/* Achievements */}
      <AchievementBadges {...achievementData} />
    </div>
  );
}
