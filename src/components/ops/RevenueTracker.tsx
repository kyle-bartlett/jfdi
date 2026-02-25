'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Modal } from '@/components/ops/Modal';
import { RevenueEntry, RevenueSummary } from '@/lib/ops/types';
import { formatDate } from '@/lib/ops/utils';

// ─── Constants ─────────────────────────────────────────────────────
const SOURCES = [
  { value: 'consulting', label: 'Consulting', color: 'hsl(158, 100%, 43%)' },
  { value: 'contract', label: 'Contract', color: 'hsl(196, 100%, 44%)' },
  { value: 'website', label: 'Website', color: 'hsl(270, 70%, 55%)' },
  { value: 'social_media', label: 'Social Media', color: 'hsl(330, 80%, 55%)' },
  { value: 'template', label: 'Template', color: 'hsl(38, 92%, 50%)' },
  { value: 'pod', label: 'POD', color: 'hsl(15, 85%, 55%)' },
  { value: 'kdp', label: 'KDP', color: 'hsl(45, 90%, 50%)' },
  { value: 'custom_ai', label: 'Custom AI', color: 'hsl(210, 90%, 55%)' },
  { value: 'agent', label: 'Agent', color: 'hsl(280, 75%, 60%)' },
  { value: 'other', label: 'Other', color: 'hsl(215, 20%, 55%)' },
];

const REVENUE_TYPES = [
  { value: 'recurring', label: '🔄 Recurring' },
  { value: 'one-time', label: '💵 One-Time' },
  { value: 'project', label: '📋 Project' },
];

const DEFAULT_MONTHLY_GOAL = 10000;

function getSourceColor(source: string): string {
  return SOURCES.find(s => s.value === source)?.color || 'hsl(215, 20%, 55%)';
}

function getSourceLabel(source: string): string {
  return SOURCES.find(s => s.value === source)?.label || source;
}

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

// ─── Revenue Donut Chart ───────────────────────────────────────────
function RevenueDonut({ segments, size = 140, strokeWidth = 16, onSegmentClick }: {
  segments: { label: string; value: number; color: string; source: string }[];
  size?: number; strokeWidth?: number;
  onSegmentClick?: (source: string) => void;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let cumulative = 0;
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={strokeWidth} />
          <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central" fill="hsl(var(--muted-foreground))" fontSize="12">No data</text>
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
              strokeWidth={hoveredIdx === i ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              className="transition-all duration-300 cursor-pointer"
              style={{ opacity: hoveredIdx !== null && hoveredIdx !== i ? 0.4 : 1 }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onSegmentClick?.(seg.source)}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-foreground">${total.toLocaleString()}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">total</span>
      </div>
    </div>
  );
}

// ─── Goal Progress Ring ────────────────────────────────────────────
function GoalRing({ current, goal, size = 120 }: { current: number; goal: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(current / goal, 1);
  const dashLen = pct * circumference;

  const color = pct >= 1 ? 'hsl(158, 100%, 43%)' : pct >= 0.7 ? 'hsl(38, 92%, 50%)' : pct >= 0.4 ? 'hsl(196, 100%, 44%)' : 'hsl(0, 80%, 55%)';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={strokeWidth} />
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={`${dashLen} ${circumference - dashLen}`}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-foreground">{Math.round(pct * 100)}%</span>
        <span className="text-[10px] text-muted-foreground">of goal</span>
      </div>
    </div>
  );
}

// ─── Monthly Bar Chart ─────────────────────────────────────────────
function MonthlyBarChart({ data, onBarClick }: {
  data: { month: string; total: number }[];
  onBarClick?: (month: string) => void;
}) {
  const maxVal = Math.max(...data.map(d => d.total), 1);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {data.map((item, i) => {
        const widthPct = Math.max((item.total / maxVal) * 100, 4);
        const isHovered = hoveredIdx === i;
        return (
          <div
            key={item.month}
            className="flex items-center gap-3 cursor-pointer group"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            onClick={() => onBarClick?.(item.month)}
          >
            <span className="text-xs text-muted-foreground w-16 text-right font-mono">{item.month}</span>
            <div className="flex-1 relative">
              <div
                className="h-7 rounded-r-lg flex items-center px-3 transition-all duration-500"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: isHovered ? 'hsl(158, 100%, 43%)' : 'hsla(158, 100%, 43%, 0.25)',
                  borderLeft: '3px solid hsl(158, 100%, 43%)',
                }}
              >
                <span className={`text-xs font-medium transition-colors ${isHovered ? 'text-white' : 'text-accent'}`}>
                  ${item.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Summary Card ──────────────────────────────────────────────────
function SummaryCard({ icon, label, value, sub }: {
  icon: string; label: string; value: React.ReactNode; sub?: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:border-primary/40 transition-colors group">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg group-hover:scale-110 transition-transform">{icon}</span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

// ─── Main Revenue Tracker ──────────────────────────────────────────
export function RevenueTracker() {
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RevenueEntry | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [monthlyGoal, setMonthlyGoal] = useState(DEFAULT_MONTHLY_GOAL);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(DEFAULT_MONTHLY_GOAL));
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formAmount, setFormAmount] = useState('');
  const [formSource, setFormSource] = useState('consulting');
  const [formClient, setFormClient] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState('one-time');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = useCallback(async () => {
    try {
      let url = '/api/ops/revenue?';
      if (sourceFilter) url += `source=${sourceFilter}&`;
      const res = await fetch(url);
      const data = await res.json();
      setEntries(data.entries);
      setSummary(data.summary);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [sourceFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Load goal from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('revenue_monthly_goal');
    if (saved) {
      setMonthlyGoal(Number(saved));
      setGoalInput(saved);
    }
  }, []);

  const resetForm = () => {
    setFormAmount('');
    setFormSource('consulting');
    setFormClient('');
    setFormDescription('');
    setFormType('one-time');
    setFormDate(new Date().toISOString().split('T')[0]);
    setEditingEntry(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEdit = (entry: RevenueEntry) => {
    setFormAmount(String(entry.amount));
    setFormSource(entry.source);
    setFormClient(entry.client_name);
    setFormDescription(entry.description);
    setFormType(entry.revenue_type);
    setFormDate(entry.revenue_date);
    setEditingEntry(entry);
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) return;

    const payload = {
      amount,
      source: formSource,
      client_name: formClient,
      description: formDescription,
      revenue_type: formType,
      revenue_date: formDate,
    };

    if (editingEntry) {
      await fetch('/api/ops/revenue', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, id: editingEntry.id }),
      });
    } else {
      await fetch('/api/ops/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    setShowAddModal(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/ops/revenue?id=${id}`, { method: 'DELETE' });
    setDeleteConfirm(null);
    fetchData();
  };

  const handleGoalSave = () => {
    const val = parseInt(goalInput);
    if (!isNaN(val) && val > 0) {
      setMonthlyGoal(val);
      localStorage.setItem('revenue_monthly_goal', String(val));
    }
    setEditingGoal(false);
  };

  const handleSourceClick = (source: string) => {
    setSourceFilter(prev => prev === source ? null : source);
  };

  const handleMonthClick = (month: string) => {
    setMonthFilter(prev => prev === month ? null : month);
  };

  const filteredEntries = monthFilter
    ? entries.filter(e => {
        const d = new Date(e.revenue_date);
        const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        return label === monthFilter;
      })
    : entries;

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading revenue data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            💰 Revenue Tracker
            {sourceFilter && (
              <button
                onClick={() => setSourceFilter(null)}
                className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full hover:bg-primary/30 transition-colors"
              >
                Filtering: {getSourceLabel(sourceFilter)} ✕
              </button>
            )}
            {monthFilter && (
              <button
                onClick={() => setMonthFilter(null)}
                className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full hover:bg-accent/30 transition-colors"
              >
                Month: {monthFilter} ✕
              </button>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">Revenue is the oxygen. Track every dollar.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-all hover:scale-105 active:scale-95 font-medium text-sm"
        >
          <span className="text-lg">+</span> Add Revenue
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon="💰"
          label="All Time"
          value={<AnimatedNumber target={summary?.total_all_time || 0} prefix="$" />}
          sub="Total revenue"
        />
        <SummaryCard
          icon="📅"
          label="This Month"
          value={<AnimatedNumber target={summary?.total_this_month || 0} prefix="$" />}
          sub={`${Math.round(((summary?.total_this_month || 0) / monthlyGoal) * 100)}% of goal`}
        />
        <SummaryCard
          icon="📊"
          label="This Week"
          value={<AnimatedNumber target={summary?.total_this_week || 0} prefix="$" />}
        />
        <SummaryCard
          icon="🔥"
          label="Today"
          value={<AnimatedNumber target={summary?.total_today || 0} prefix="$" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by Source Donut */}
        <div className="widget">
          <h3 className="widget-title">📊 Revenue by Source</h3>
          <div className="flex items-center justify-center gap-4">
            <RevenueDonut
              segments={(summary?.by_source || []).map(s => ({
                label: getSourceLabel(s.source),
                value: s.total,
                color: getSourceColor(s.source),
                source: s.source,
              }))}
              onSegmentClick={handleSourceClick}
            />
            <div className="space-y-1.5">
              {(summary?.by_source || []).map(s => (
                <button
                  key={s.source}
                  onClick={() => handleSourceClick(s.source)}
                  className={`flex items-center gap-2 px-2 py-1 rounded transition-colors text-left w-full ${
                    sourceFilter === s.source ? 'bg-primary/20' : 'hover:bg-muted'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: getSourceColor(s.source) }} />
                  <span className="text-xs text-muted-foreground truncate">{getSourceLabel(s.source)}</span>
                  <span className="text-xs font-medium text-foreground ml-auto">${s.total.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="widget">
          <h3 className="widget-title">📈 Monthly Revenue (6mo)</h3>
          <MonthlyBarChart
            data={summary?.monthly_totals || []}
            onBarClick={handleMonthClick}
          />
        </div>

        {/* Goal Progress */}
        <div className="widget">
          <div className="flex items-center justify-between mb-3">
            <h3 className="widget-title mb-0">🎯 Monthly Goal</h3>
            <button
              onClick={() => setEditingGoal(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ✏️ Edit
            </button>
          </div>

          {editingGoal ? (
            <div className="flex gap-2 mb-4">
              <div className="flex items-center gap-1 flex-1">
                <span className="text-sm text-muted-foreground">$</span>
                <input
                  type="number"
                  value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleGoalSave(); if (e.key === 'Escape') setEditingGoal(false); }}
                  className="input flex-1"
                  autoFocus
                />
              </div>
              <button onClick={handleGoalSave} className="btn btn-primary text-sm">Save</button>
            </div>
          ) : null}

          <div className="flex flex-col items-center gap-3">
            <GoalRing current={summary?.total_this_month || 0} goal={monthlyGoal} />
            <div className="text-center">
              <span className="text-sm font-medium text-foreground">
                ${(summary?.total_this_month || 0).toLocaleString()} / ${monthlyGoal.toLocaleString()}
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                {(summary?.total_this_month || 0) >= monthlyGoal
                  ? '🎉 Goal reached!'
                  : `$${(monthlyGoal - (summary?.total_this_month || 0)).toLocaleString()} to go`
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Log Table */}
      <div className="widget">
        <div className="flex items-center justify-between mb-4">
          <h3 className="widget-title mb-0">
            📋 Revenue Log
            <span className="text-muted-foreground font-normal ml-2">({filteredEntries.length} entries)</span>
          </h3>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-3 block">💸</span>
            <p className="text-muted-foreground text-sm">No revenue entries yet. Time to make some money!</p>
            <button
              onClick={handleOpenAdd}
              className="mt-3 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              + Log your first revenue
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Date</th>
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Amount</th>
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Source</th>
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Client</th>
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Type</th>
                  <th className="text-left py-2 px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Description</th>
                  <th className="text-right py-2 px-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-border/50 hover:bg-muted/50 transition-colors group"
                  >
                    <td className="py-2.5 px-3 text-foreground font-mono text-xs">{formatDate(entry.revenue_date)}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-accent font-bold">${entry.amount.toLocaleString()}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: getSourceColor(entry.source) + '20',
                          color: getSourceColor(entry.source),
                        }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getSourceColor(entry.source) }} />
                        {getSourceLabel(entry.source)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-foreground">{entry.client_name || '—'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        entry.revenue_type === 'recurring' ? 'bg-primary/20 text-primary' :
                        entry.revenue_type === 'project' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-secondary text-muted-foreground'
                      }`}>
                        {entry.revenue_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground max-w-[200px] truncate">{entry.description || '—'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        {deleteConfirm === entry.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(entry.id)}
                            className="p-1.5 rounded hover:bg-red-500/20 transition-colors text-muted-foreground hover:text-red-400"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title={editingEntry ? '✏️ Edit Revenue Entry' : '💰 Log Revenue'}>
        <div className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-primary"
                autoFocus
              />
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Source *</label>
            <select
              value={formSource}
              onChange={e => setFormSource(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 focus:outline-none focus:border-primary"
            >
              {SOURCES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Revenue Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
            <div className="flex gap-2">
              {REVENUE_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setFormType(t.value)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    formType === t.value
                      ? 'bg-primary/20 text-primary border border-primary/50'
                      : 'bg-slate-700 text-slate-400 border border-slate-600 hover:bg-slate-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Client Name</label>
            <input
              type="text"
              value={formClient}
              onChange={e => setFormClient(e.target.value)}
              placeholder="Client or company name"
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <input
              type="text"
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              placeholder="What was this for?"
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Date *</label>
            <input
              type="date"
              value={formDate}
              onChange={e => setFormDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 focus:outline-none focus:border-primary"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={!formAmount || parseFloat(formAmount) <= 0}
              className="flex-1 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingEntry ? 'Update Entry' : 'Log Revenue'}
            </button>
            <button
              onClick={() => { setShowAddModal(false); resetForm(); }}
              className="px-6 py-2.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
