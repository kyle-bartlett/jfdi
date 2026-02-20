'use client';

import { useEffect, useState, useRef } from 'react';
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
      // Ease out cubic
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
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
          <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central" fill="#64748b" fontSize="12">—</text>
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
              style={{ filter: 'drop-shadow(0 0 3px ' + seg.color + '40)' }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-slate-100">{total}</span>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">total</span>
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
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-medium">{value}/{max}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
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
            <span className="text-xs text-slate-500 w-20 text-right truncate">{stage.label}</span>
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
        className="flex items-center gap-2 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg hover:border-slate-500 transition-colors"
      >
        <span className="text-xl">{current.emoji}</span>
        <span className="text-sm text-slate-300">{current.label}</span>
        <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-1 left-0 z-50 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-2 min-w-[160px]">
            {MOODS.map(mood => (
              <button
                key={mood.value}
                onClick={() => { onSelect(mood.value); setIsOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                  mood.value === currentMood ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:bg-slate-700'
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
function QuickAction({ icon, label, onClick, color = 'bg-slate-700 hover:bg-slate-600' }: {
  icon: string; label: string; onClick: () => void; color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${color} transition-all hover:scale-105 active:scale-95 border border-slate-600/50`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] text-slate-300 font-medium">{label}</span>
    </button>
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

  // Auto-refresh every 60 seconds
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

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Booting command center...</div>;
  if (!data) return <div className="text-slate-400">Failed to load dashboard</div>;

  const hour = new Date().getHours();
  const greeting = hour < 5 ? '🌙 Late night grind' : hour < 12 ? '☀️ Morning ops' : hour < 17 ? '⚡ Afternoon push' : hour < 21 ? '🔥 Evening build' : '🌙 Night shift';

  const doneProjects = data.projectsByStatus.find(s => s.status === 'Done')?.count || 0;
  const inProgressProjects = data.projectsByStatus.find(s => s.status === 'In Progress')?.count || 0;
  const backlogProjects = data.projectsByStatus.find(s => s.status === 'Backlog')?.count || 0;
  const reviewProjects = data.projectsByStatus.find(s => s.status === 'Review')?.count || 0;

  const projectSegments = [
    { label: 'Done', value: doneProjects, color: '#22c55e' },
    { label: 'In Progress', value: inProgressProjects, color: '#3b82f6' },
    { label: 'Review', value: reviewProjects, color: '#eab308' },
    { label: 'Backlog', value: backlogProjects, color: '#64748b' },
  ];

  const pipelineFunnelData = [
    { label: 'Lead', count: data.pipelineByStatus.find(s => s.status === 'Lead')?.count || 0, color: '#94a3b8' },
    { label: 'Contacted', count: data.pipelineByStatus.find(s => s.status === 'Contacted')?.count || 0, color: '#3b82f6' },
    { label: 'Responded', count: data.pipelineByStatus.find(s => s.status === 'Responded')?.count || 0, color: '#06b6d4' },
    { label: 'Proposal', count: data.pipelineByStatus.find(s => s.status === 'Proposal')?.count || 0, color: '#eab308' },
    { label: 'Negotiating', count: data.pipelineByStatus.find(s => s.status === 'Negotiating')?.count || 0, color: '#f97316' },
    { label: 'Won', count: data.pipelineByStatus.find(s => s.status === 'Won')?.count || 0, color: '#22c55e' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-800 to-blue-900/30 rounded-2xl border border-slate-700 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -translate-y-32 translate-x-32 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/5 rounded-full translate-y-24 -translate-x-24 blur-2xl" />

        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-slate-100">{greeting}</h2>
              <MoodSelector currentMood={mood} onSelect={handleMoodChange} />
            </div>
            <p className="text-sm text-slate-400">
              {data.totals.projects} projects · {data.totals.prospects} prospects · {data.weeklyAgentDeploys} agent deploys this week
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-slate-400">Live</span>
              <span className="text-xs text-slate-500">· {timeAgo(lastRefresh.toISOString())}</span>
            </div>
            <button
              onClick={fetchData}
              className="p-2 bg-slate-700/50 rounded-lg hover:bg-slate-600 transition-colors text-slate-400 hover:text-slate-200"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard
          icon="📋"
          label="Projects"
          value={<AnimatedNumber target={data.totals.projects} />}
          sub={`${inProgressProjects} active`}
          trend={data.completionRate > 0 ? `${data.completionRate}% done` : undefined}
          trendUp={data.completionRate > 30}
        />
        <KPICard
          icon="🎯"
          label="Pipeline"
          value={<AnimatedNumber target={data.totals.prospects} />}
          sub={<AnimatedNumber target={data.pipelineValue} prefix="$" />}
          trend="total value"
          trendUp
        />
        <KPICard
          icon="🤖"
          label="Agents"
          value={<AnimatedNumber target={data.weeklyAgentDeploys} />}
          sub="this week"
          trend={`${data.activeAgents.length} running`}
          trendUp={data.activeAgents.length > 0}
        />
        <KPICard
          icon="💡"
          label="Ideas"
          value={<AnimatedNumber target={data.totals.ideas} />}
          sub={`${data.ideasByStatus.find(s => s.status === 'New')?.count || 0} new`}
        />
        <KPICard
          icon="📝"
          label="Prompts"
          value={<AnimatedNumber target={data.totals.prompts} />}
          sub="in library"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">⚡ Quick Actions</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          <QuickAction icon="📝" label="Quick Note" onClick={() => setShowQuickNote(true)} color="bg-blue-600/20 hover:bg-blue-600/30" />
          <QuickAction icon="🤖" label="Deploy Agent" onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'agents' }))} />
          <QuickAction icon="💡" label="New Idea" onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'ideas' }))} />
          <QuickAction icon="🎯" label="Add Prospect" onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'pipeline' }))} />
          <QuickAction icon="📋" label="New Project" onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'projects' }))} />
          <QuickAction icon="📥" label="Kyle Queue" onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'kyle' }))} />
          <QuickAction icon="🔒" label="Knox Queue" onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'knox' }))} />
          <QuickAction icon="📊" label="Timeline" onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: 'timeline' }))} />
        </div>
      </div>

      {/* Quick Note Inline */}
      {showQuickNote && (
        <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4 animate-fadeIn">
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
                className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button onClick={handleQuickNote} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">Save</button>
            <button onClick={() => setShowQuickNote(false)} className="px-3 py-2 text-sm text-slate-400 hover:text-slate-200">✕</button>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Status Donut */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">📊 Project Status</h3>
          <div className="flex items-center justify-center gap-6">
            <DonutChart segments={projectSegments} />
            <div className="space-y-2">
              {projectSegments.map(seg => (
                <div key={seg.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="text-xs text-slate-400">{seg.label}</span>
                  <span className="text-xs font-medium text-slate-200">{seg.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={doneProjects} max={data.totals.projects} color="#22c55e" label="Completion" />
          </div>
        </div>

        {/* Pipeline Funnel */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">🎯 Pipeline Funnel</h3>
          <PipelineFunnel stages={pipelineFunnelData} />
          <div className="mt-4 pt-3 border-t border-slate-700/50 flex justify-between text-xs text-slate-400">
            <span>Total Value</span>
            <span className="text-green-400 font-medium">${data.pipelineValue.toLocaleString()}</span>
          </div>
        </div>

        {/* Queue Overview */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">📥 Queues</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👤</span>
                <div>
                  <div className="text-sm font-medium text-slate-200">Kyle&apos;s Queue</div>
                  <div className="text-xs text-slate-500">Items awaiting review</div>
                </div>
              </div>
              <div className={`text-2xl font-bold ${data.kyleQueuePending > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                <AnimatedNumber target={data.kyleQueuePending} />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <div className="text-sm font-medium text-slate-200">Knox&apos;s Queue</div>
                  <div className="text-xs text-slate-500">Tasks to execute</div>
                </div>
              </div>
              <div className={`text-2xl font-bold ${data.knoxQueuePending > 0 ? 'text-blue-400' : 'text-green-400'}`}>
                <AnimatedNumber target={data.knoxQueuePending} />
              </div>
            </div>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-500">
                {data.kyleQueuePending + data.knoxQueuePending === 0 ? '✅ All queues clear!' : `${data.kyleQueuePending + data.knoxQueuePending} items need attention`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Agents */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">🤖 Active Sub-Agents</h3>
          {data.activeAgents.length === 0 ? (
            <div className="text-center py-6">
              <span className="text-3xl mb-2 block">😴</span>
              <p className="text-slate-500 text-sm">No agents currently running</p>
              <p className="text-slate-600 text-xs mt-1">Deploy one from Quick Actions above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.activeAgents.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${agentColors[a.agent_name] || 'bg-slate-600 text-slate-300'}`}>
                      {a.agent_name}
                    </span>
                    <span className="text-sm text-slate-200">{a.task_description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-slate-400">{timeAgo(a.deployed_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* P0 Priorities */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">🔥 Top Priorities (P0)</h3>
          {data.p0Projects.length === 0 ? (
            <div className="text-center py-6">
              <span className="text-3xl mb-2 block">🎉</span>
              <p className="text-slate-500 text-sm">No P0 items — nice!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.p0Projects.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <PriorityBadge priority={p.priority} />
                    <span className="text-sm text-slate-200">{p.title}</span>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">📈 Recent Projects</h3>
        <div className="space-y-2">
          {data.recentProjects.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
              <div className="flex items-center gap-3">
                <PriorityBadge priority={p.priority} />
                <span className="text-sm text-slate-200">{p.title}</span>
                <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">{p.status}</span>
              </div>
              <span className="text-xs text-slate-500">{timeAgo(p.updated_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── KPI Card Component ────────────────────────────────────────────
function KPICard({ icon, label, value, sub, trend, trendUp }: {
  icon: string;
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-slate-600 transition-colors group">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg group-hover:scale-110 transition-transform">{icon}</span>
        <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-50">{value}</div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-slate-500">{sub}</span>
        {trend && (
          <span className={`text-xs px-1.5 py-0.5 rounded ${trendUp ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
