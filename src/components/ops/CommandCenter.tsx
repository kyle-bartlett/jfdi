'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { OpsDashboardData } from '@/lib/ops/types';
import { PriorityBadge } from '@/components/ops/PriorityBadge';
import { agentColors, timeAgo } from '@/lib/ops/utils';

// ─── Animated Counter ──────────────────────────────────────────────
function AnimatedNumber({ target, duration = 1000, prefix = '', suffix = '' }: {
  target: number; duration?: number; prefix?: string; suffix?: string;
}) {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const from = current;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return <span>{prefix}{current.toLocaleString()}{suffix}</span>;
}

// ─── Live Clock + Session Timer ────────────────────────────────────
function LiveClock({ sessionStart }: { sessionStart: Date }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsed = Math.floor((now.getTime() - sessionStart.getTime()) / 1000);
  const hours = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;
  const sessionStr = hours > 0
    ? `${hours}h ${mins}m`
    : mins > 0
      ? `${mins}m ${secs}s`
      : `${secs}s`;

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-sm font-mono text-foreground font-medium">
        {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <span className="text-[10px] text-muted-foreground">
        Session: {sessionStr}
      </span>
    </div>
  );
}

// ─── Stat Ticker ───────────────────────────────────────────────────
function StatTicker({ data }: { data: OpsDashboardData }) {
  const stats = [
    `${data.totals.projects} projects tracked`,
    `${data.totals.prospects} pipeline prospects`,
    `${data.weeklyAgentDeploys} agent deploys this week`,
    `$${data.pipelineValue.toLocaleString()} pipeline value`,
    `${data.totals.ideas} ideas captured`,
    `${data.totals.prompts} prompts in library`,
    `${data.completionRate}% completion rate`,
    `${data.activeAgents.length} agents running now`,
    `${data.kyleQueuePending + data.knoxQueuePending} queue items pending`,
  ];

  const tickerContent = stats.join(' · ');

  return (
    <div className="overflow-hidden mt-4 py-2 border-t border-border/50">
      <div className="ticker-track whitespace-nowrap">
        <span className="text-xs text-muted-foreground px-4">{tickerContent}</span>
        <span className="text-xs text-muted-foreground px-4">{tickerContent}</span>
      </div>
    </div>
  );
}

// ─── Daily Focus Widget ────────────────────────────────────────────
interface FocusItem {
  text: string;
  done: boolean;
  estimate: string;
}

function DailyFocus() {
  const [items, setItems] = useState<FocusItem[]>([
    { text: '', done: false, estimate: '' },
    { text: '', done: false, estimate: '' },
    { text: '', done: false, estimate: '' },
  ]);
  const [loaded, setLoaded] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const [justCompleted, setJustCompleted] = useState<number | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const labels = ['🎯 Main Focus', '📌 Secondary', '🌟 Stretch Goal'];

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    fetch(`/api/ops/metrics?date=${today}`)
      .then(r => r.json())
      .then(data => {
        if (data?.daily_focus) {
          try {
            const parsed = JSON.parse(data.daily_focus);
            if (Array.isArray(parsed) && parsed.length === 3) {
              setItems(parsed);
            }
          } catch { /* ok */ }
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const saveItems = useCallback((newItems: FocusItem[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      fetch('/api/ops/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_focus: JSON.stringify(newItems) }),
      });
    }, 500);
  }, []);

  const updateItem = (index: number, changes: Partial<FocusItem>) => {
    const newItems = items.map((item, i) => i === index ? { ...item, ...changes } : item);
    setItems(newItems);
    saveItems(newItems);

    if (changes.done === true) {
      setJustCompleted(index);
      setTimeout(() => setJustCompleted(null), 600);
    }

    // Check all done
    const doneCount = newItems.filter(i => i.done).length;
    if (doneCount === 3 && !allDone) {
      setAllDone(true);
      setTimeout(() => setAllDone(false), 3000);
    }
  };

  const doneCount = items.filter(i => i.done).length;
  const ringSize = 64;
  const ringStroke = 6;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringPct = doneCount / 3;
  const ringDash = ringPct * ringCircumference;
  const ringColor = doneCount === 3 ? 'hsl(158, 100%, 43%)' : doneCount >= 2 ? 'hsl(38, 92%, 50%)' : doneCount >= 1 ? 'hsl(196, 100%, 44%)' : 'hsl(var(--border))';

  if (!loaded) return null;

  return (
    <div className="widget relative overflow-hidden">
      {allDone && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 animate-fadeIn">
          <span className="text-6xl animate-bounce">🎉</span>
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <h3 className="widget-title mb-0">🎯 Daily Focus</h3>
        <div className="relative" style={{ width: ringSize, height: ringSize }}>
          <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`} className="transform -rotate-90">
            <circle cx={ringSize/2} cy={ringSize/2} r={ringRadius} fill="none" stroke="hsl(var(--border))" strokeWidth={ringStroke} />
            <circle
              cx={ringSize/2} cy={ringSize/2} r={ringRadius}
              fill="none" stroke={ringColor} strokeWidth={ringStroke}
              strokeDasharray={`${ringDash} ${ringCircumference - ringDash}`}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-foreground">{doneCount}/3</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
              item.done
                ? 'bg-accent/10 border-accent/30'
                : 'bg-card border-border hover:border-muted-foreground/40'
            }`}
          >
            {/* Checkbox */}
            <button
              onClick={() => updateItem(i, { done: !item.done })}
              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                item.done
                  ? 'bg-accent border-accent'
                  : 'border-muted-foreground/40 hover:border-primary'
              } ${justCompleted === i ? 'scale-125' : ''}`}
            >
              {item.done && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* Label & Input */}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{labels[i]}</span>
              <input
                type="text"
                value={item.text}
                onChange={e => updateItem(i, { text: e.target.value })}
                placeholder="What's the focus?"
                className={`w-full bg-transparent border-none outline-none text-sm mt-0.5 placeholder-muted-foreground/50 ${
                  item.done ? 'text-muted-foreground line-through' : 'text-foreground'
                }`}
              />
            </div>

            {/* Time Estimate */}
            <input
              type="text"
              value={item.estimate}
              onChange={e => updateItem(i, { estimate: e.target.value })}
              placeholder="1h"
              className="w-12 text-center text-xs bg-secondary border border-border rounded px-1 py-1 text-muted-foreground focus:text-foreground focus:border-primary outline-none transition-colors"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Today's Wins ──────────────────────────────────────────────────
function TodaysWins() {
  const [wins, setWins] = useState<{ id: string; title: string; created_at: string }[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [winText, setWinText] = useState('');
  const [newWinId, setNewWinId] = useState<string | null>(null);

  useEffect(() => {
    fetchWins();
  }, []);

  const fetchWins = async () => {
    try {
      const res = await fetch('/api/ops/activity?event_type=milestone&limit=20');
      const data = await res.json();
      // Filter to today's wins (ones with 🏆 icon)
      const today = new Date().toISOString().split('T')[0];
      const todayWins = data.filter((e: { icon: string; created_at: string }) =>
        e.icon === '🏆' && e.created_at?.startsWith(today)
      );
      setWins(todayWins);
    } catch {
      // ok
    }
  };

  const addWin = async () => {
    if (!winText.trim()) return;
    try {
      const res = await fetch('/api/ops/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'milestone',
          title: winText.trim(),
          source: 'Kyle',
          icon: '🏆',
          description: 'Daily win',
        }),
      });
      const newWin = await res.json();
      setNewWinId(newWin.id);
      setTimeout(() => setNewWinId(null), 1500);
      setWinText('');
      setShowInput(false);
      fetchWins();
    } catch {
      // ok
    }
  };

  return (
    <div className="widget">
      <div className="flex items-center justify-between mb-3">
        <h3 className="widget-title mb-0">🏆 Today&apos;s Wins</h3>
        <button
          onClick={() => setShowInput(!showInput)}
          className="w-7 h-7 flex items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-bold"
        >
          +
        </button>
      </div>

      {showInput && (
        <div className="flex gap-2 mb-3">
          <input
            autoFocus
            type="text"
            value={winText}
            onChange={(e) => setWinText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addWin(); if (e.key === 'Escape') setShowInput(false); }}
            placeholder="Log a win..."
            className="input flex-1"
          />
          <button onClick={addWin} className="btn btn-primary text-sm">Add</button>
        </div>
      )}

      {wins.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No wins logged yet today. Start crushing it! 💪</p>
      ) : (
        <div className="space-y-2">
          {wins.map((win) => (
            <div
              key={win.id}
              className={`flex items-center gap-2 p-2 rounded-lg bg-card border border-border ${
                win.id === newWinId ? 'win-sparkle win-glow' : ''
              }`}
            >
              <span className="text-lg">🏆</span>
              <span className="text-sm text-foreground flex-1">{win.title}</span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(win.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mini Donut Chart ──────────────────────────────────────────────
function DonutChart({ segments, size = 120, strokeWidth = 14 }: {
  segments: { label: string; value: number; color: string }[];
  size?: number; strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let cumulative = 0;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={strokeWidth} />
          <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central" fill="hsl(var(--muted-foreground))" fontSize="12">—</text>
        </svg>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const offset = (cumulative / total) * circumference;
          const dash = pct * circumference;
          cumulative += seg.value;
          return (
            <circle
              key={i}
              cx={size/2}
              cy={size/2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-foreground">{total}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">total</span>
      </div>
    </div>
  );
}

// ─── Mini Progress Bar ─────────────────────────────────────────────
function ProgressBar({ value, max, color, label }: {
  value: number; max: number; color: string; label: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-medium">{value}/{max}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── Pipeline Funnel ───────────────────────────────────────────────
function PipelineFunnel({ stages }: { stages: { label: string; count: number; color: string }[] }) {
  const maxCount = Math.max(...stages.map(s => s.count), 1);
  return (
    <div className="space-y-1.5">
      {stages.map((stage, i) => {
        const widthPct = Math.max((stage.count / maxCount) * 100, 15);
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20 text-right truncate">{stage.label}</span>
            <div className="flex-1 relative">
              <div
                className="h-6 rounded-r-md flex items-center px-2 transition-all duration-700"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: stage.color + '30',
                  borderLeft: `3px solid ${stage.color}`,
                }}
              >
                <span className="text-xs font-medium" style={{ color: stage.color }}>
                  {stage.count}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Mood / Status Selector ────────────────────────────────────────
const MOODS = [
  { emoji: '🔥', label: 'On Fire', value: 'on-fire' },
  { emoji: '💪', label: 'Grinding', value: 'grinding' },
  { emoji: '🚀', label: 'Shipping', value: 'shipping' },
  { emoji: '🧠', label: 'Deep Work', value: 'deep-work' },
  { emoji: '⚡', label: 'Hyper', value: 'hyper' },
  { emoji: '😤', label: 'Frustrated', value: 'frustrated' },
  { emoji: '☕', label: 'Warming Up', value: 'warming-up' },
  { emoji: '🌙', label: 'Night Owl', value: 'night-owl' },
];

function MoodSelector({ currentMood, onSelect }: { currentMood: string; onSelect: (mood: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const current = MOODS.find(m => m.value === currentMood) || MOODS[1];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-secondary border border-border rounded-lg hover:border-muted-foreground/40 transition-colors"
      >
        <span className="text-xl">{current.emoji}</span>
        <span className="text-sm text-foreground">{current.label}</span>
        <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-1 left-0 z-50 bg-popover border border-border rounded-lg shadow-xl p-2 min-w-[160px]">
            {MOODS.map(mood => (
              <button
                key={mood.value}
                onClick={() => { onSelect(mood.value); setIsOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                  mood.value === currentMood ? 'bg-primary/20 text-primary' : 'text-foreground hover:bg-muted'
                }`}
              >
                <span>{mood.emoji}</span>
                <span>{mood.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Quick Action Button ───────────────────────────────────────────
function QuickAction({ icon, label, onClick, color = 'bg-secondary hover:bg-muted' }: {
  icon: string; label: string; onClick: () => void; color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${color} transition-all hover:scale-105 active:scale-95 border border-border`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
    </button>
  );
}

// ─── Interactive KPI Card ──────────────────────────────────────────
function KPICard({ icon, label, value, sub, trend, trendUp, tabTarget }: {
  icon: string;
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  tabTarget?: string;
}) {
  const handleClick = () => {
    if (tabTarget) {
      window.dispatchEvent(new CustomEvent('switch-tab', { detail: tabTarget }));
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-card rounded-xl border border-border p-5 transition-colors group ${
        tabTarget ? 'cursor-pointer hover:border-primary/50 hover:bg-primary/5' : 'hover:border-muted-foreground/40'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg group-hover:scale-110 transition-transform">{icon}</span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        {tabTarget && (
          <svg className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-muted-foreground">{sub}</span>
        {trend && (
          <span className={`text-xs px-1.5 py-0.5 rounded ${trendUp ? 'bg-accent/10 text-accent' : 'bg-secondary text-muted-foreground'}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Command Center ───────────────────────────────────────────
export function CommandCenter() {
  const [data, setData] = useState<OpsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState('grinding');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [sessionStart] = useState(new Date());

  const fetchData = () => {
    fetch('/api/ops/dashboard')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
        setLastRefresh(new Date());
        if (d.todayMetrics?.mood) setMood(d.todayMetrics.mood);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMoodChange = async (newMood: string) => {
    setMood(newMood);
    await fetch('/api/ops/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mood: newMood }),
    });
  };

  const handleQuickNote = async () => {
    if (!quickNote.trim()) return;
    await fetch('/api/ops/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'note',
        title: quickNote.trim(),
        source: 'Kyle',
        icon: '📝',
      }),
    });
    setQuickNote('');
    setShowQuickNote(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Booting command center...</div>;
  if (!data) return <div className="text-muted-foreground">Failed to load dashboard</div>;

  const hour = new Date().getHours();
  const greeting = hour < 5 ? '🌙 Late night grind' : hour < 12 ? '☀️ Morning ops' : hour < 17 ? '⚡ Afternoon push' : hour < 21 ? '🔥 Evening build' : '🌙 Night shift';

  const doneProjects = data.projectsByStatus.find(s => s.status === 'Done')?.count || 0;
  const inProgressProjects = data.projectsByStatus.find(s => s.status === 'In Progress')?.count || 0;
  const backlogProjects = data.projectsByStatus.find(s => s.status === 'Backlog')?.count || 0;
  const reviewProjects = data.projectsByStatus.find(s => s.status === 'Review')?.count || 0;

  const projectSegments = [
    { label: 'Done', value: doneProjects, color: 'hsl(158, 100%, 43%)' },
    { label: 'In Progress', value: inProgressProjects, color: 'hsl(196, 100%, 44%)' },
    { label: 'Review', value: reviewProjects, color: 'hsl(38, 92%, 50%)' },
    { label: 'Backlog', value: backlogProjects, color: 'hsl(215, 20%, 50%)' },
  ];

  const pipelineFunnelData = [
    { label: 'Lead', count: data.pipelineByStatus.find(s => s.status === 'Lead')?.count || 0, color: 'hsl(215, 20%, 65%)' },
    { label: 'Contacted', count: data.pipelineByStatus.find(s => s.status === 'Contacted')?.count || 0, color: 'hsl(196, 100%, 44%)' },
    { label: 'Responded', count: data.pipelineByStatus.find(s => s.status === 'Responded')?.count || 0, color: 'hsl(188, 100%, 42%)' },
    { label: 'Proposal', count: data.pipelineByStatus.find(s => s.status === 'Proposal')?.count || 0, color: 'hsl(38, 92%, 50%)' },
    { label: 'Negotiating', count: data.pipelineByStatus.find(s => s.status === 'Negotiating')?.count || 0, color: 'hsl(25, 95%, 53%)' },
    { label: 'Won', count: data.pipelineByStatus.find(s => s.status === 'Won')?.count || 0, color: 'hsl(158, 100%, 43%)' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-card rounded-2xl border border-border p-6">
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-foreground">{greeting}</h2>
              <MoodSelector currentMood={mood} onSelect={handleMoodChange} />
            </div>
            <p className="text-sm text-muted-foreground">
              {data.totals.projects} projects · {data.totals.prospects} prospects · {data.weeklyAgentDeploys} agent deploys this week
            </p>
          </div>

          <div className="flex items-center gap-3">
            <LiveClock sessionStart={sessionStart} />
            <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">Live</span>
              <span className="text-xs text-muted-foreground">· {timeAgo(lastRefresh.toISOString())}</span>
            </div>
            <button
              onClick={fetchData}
              className="p-2 bg-secondary rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stat Ticker */}
        <StatTicker data={data} />
      </div>

      {/* KPI Cards Row — now interactive */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard
          icon="📋"
          label="Projects"
          value={<AnimatedNumber target={data.totals.projects} />}
          sub={`${inProgressProjects} active`}
          trend={data.completionRate > 0 ? `${data.completionRate}% done` : undefined}
          trendUp={data.completionRate > 30}
          tabTarget="projects"
        />
        <KPICard
          icon="🎯"
          label="Pipeline"
          value={<AnimatedNumber target={data.totals.prospects} />}
          sub={<AnimatedNumber target={data.pipelineValue} prefix="$" />}
          trend="total value"
          trendUp
          tabTarget="pipeline"
        />
        <KPICard
          icon="🤖"
          label="Agents"
          value={<AnimatedNumber target={data.weeklyAgentDeploys} />}
          sub="this week"
          trend={`${data.activeAgents.length} running`}
          trendUp={data.activeAgents.length > 0}
          tabTarget="agents"
        />
        <KPICard
          icon="💡"
          label="Ideas"
          value={<AnimatedNumber target={data.totals.ideas} />}
          sub={`${data.ideasByStatus.find(s => s.status === 'New')?.count || 0} new`}
          tabTarget="ideas"
        />
        <KPICard
          icon="📝"
          label="Prompts"
          value={<AnimatedNumber target={data.totals.prompts} />}
          sub="in library"
          tabTarget="prompts"
        />
      </div>

      {/* Daily Focus */}
      <DailyFocus />

      {/* Today's Wins */}
      <TodaysWins />

      {/* Quick Actions */}
      <div className="widget">
        <h3 className="widget-title">⚡ Quick Actions</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          <QuickAction icon="📝" label="Quick Note" onClick={() => setShowQuickNote(true)} color="bg-primary/10 hover:bg-primary/20" />
          <QuickAction icon="🤖" label="Deploy Agent" onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'agents' }))} />
          <QuickAction icon="💡" label="New Idea" onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'ideas' }))} />
          <QuickAction icon="🎯" label="Add Prospect" onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'pipeline' }))} />
          <QuickAction icon="📋" label="New Project" onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'projects' }))} />
          <QuickAction icon="📥" label="Kyle Queue" onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'kyle' }))} />
          <QuickAction icon="🔒" label="Knox Queue" onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'knox' }))} />
          <QuickAction icon="🔥" label="Streaks" onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'streaks' }))} />
        </div>
      </div>

      {/* Quick Note Inline */}
      {showQuickNote && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 animate-fadeIn">
          <div className="flex gap-3">
            <span className="text-2xl">📝</span>
            <div className="flex-1">
              <input
                autoFocus
                type="text"
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleQuickNote(); if (e.key === 'Escape') setShowQuickNote(false); }}
                placeholder="Quick thought, note, or update..."
                className="input"
              />
            </div>
            <button onClick={handleQuickNote} className="btn btn-primary">Save</button>
            <button onClick={() => setShowQuickNote(false)} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground">✕</button>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Status Donut */}
        <div className="widget">
          <h3 className="widget-title">📊 Project Status</h3>
          <div className="flex items-center justify-center gap-6">
            <DonutChart segments={projectSegments} />
            <div className="space-y-2">
              {projectSegments.map(seg => (
                <div key={seg.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="text-xs text-muted-foreground">{seg.label}</span>
                  <span className="text-xs font-medium text-foreground">{seg.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={doneProjects} max={data.totals.projects} color="hsl(158, 100%, 43%)" label="Completion" />
          </div>
        </div>

        {/* Pipeline Funnel */}
        <div className="widget">
          <h3 className="widget-title">🎯 Pipeline Funnel</h3>
          <PipelineFunnel stages={pipelineFunnelData} />
          <div className="mt-4 pt-3 border-t border-border flex justify-between text-xs text-muted-foreground">
            <span>Total Value</span>
            <span className="text-accent font-medium">${data.pipelineValue.toLocaleString()}</span>
          </div>
        </div>

        {/* Queue Overview */}
        <div className="widget">
          <h3 className="widget-title">📥 Queues</h3>
          <div className="space-y-4">
            <div
              className="flex items-center justify-between p-4 bg-secondary rounded-lg cursor-pointer hover:bg-muted transition-colors"
              onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'kyle' }))}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">👤</span>
                <div>
                  <div className="text-sm font-medium text-foreground">Kyle&apos;s Queue</div>
                  <div className="text-xs text-muted-foreground">Items awaiting review</div>
                </div>
              </div>
              <div className={`text-2xl font-bold ${data.kyleQueuePending > 0 ? 'text-warning' : 'text-accent'}`}>
                <AnimatedNumber target={data.kyleQueuePending} />
              </div>
            </div>

            <div
              className="flex items-center justify-between p-4 bg-secondary rounded-lg cursor-pointer hover:bg-muted transition-colors"
              onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'knox' }))}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <div className="text-sm font-medium text-foreground">Knox&apos;s Queue</div>
                  <div className="text-xs text-muted-foreground">Tasks to execute</div>
                </div>
              </div>
              <div className={`text-2xl font-bold ${data.knoxQueuePending > 0 ? 'text-primary' : 'text-accent'}`}>
                <AnimatedNumber target={data.knoxQueuePending} />
              </div>
            </div>

            <div className="text-center pt-2">
              <span className="text-xs text-muted-foreground">
                {data.kyleQueuePending + data.knoxQueuePending === 0 ? '✅ All queues clear!' : `${data.kyleQueuePending + data.knoxQueuePending} items need attention`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Agents */}
        <div className="widget">
          <h3 className="widget-title">🤖 Active Sub-Agents</h3>
          {data.activeAgents.length === 0 ? (
            <div className="text-center py-6">
              <span className="text-3xl mb-2 block">😴</span>
              <p className="text-muted-foreground text-sm">No agents currently running</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Deploy one from Quick Actions above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.activeAgents.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${agentColors[a.agent_name] || 'bg-secondary text-muted-foreground'}`}>
                      {a.agent_name}
                    </span>
                    <span className="text-sm text-foreground">{a.task_description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                    <span className="text-xs text-muted-foreground">{timeAgo(a.deployed_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* P0 Priorities */}
        <div className="widget">
          <h3 className="widget-title">🔥 Top Priorities (P0)</h3>
          {data.p0Projects.length === 0 ? (
            <div className="text-center py-6">
              <span className="text-3xl mb-2 block">🎉</span>
              <p className="text-muted-foreground text-sm">No P0 items — nice!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.p0Projects.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div className="flex items-center gap-3">
                    <PriorityBadge priority={p.priority} />
                    <span className="text-sm text-foreground">{p.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Projects */}
      <div className="widget">
        <h3 className="widget-title">📈 Recent Projects</h3>
        <div className="space-y-2">
          {data.recentProjects.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <PriorityBadge priority={p.priority} />
                <span className="text-sm text-foreground">{p.title}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{p.status}</span>
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo(p.updated_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
