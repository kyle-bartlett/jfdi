'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AutomationTask } from '@/lib/ops/types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const statusConfig = {
  fully_automated: { icon: '✅', label: 'Fully Automated', color: 'bg-green-500/20 text-green-400 border-green-500/30', dot: 'bg-green-500', bar: '#22c55e' },
  semi_automated: { icon: '⚡', label: 'Semi-Automated', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', dot: 'bg-yellow-500', bar: '#eab308' },
  pending: { icon: '🔴', label: 'Pending', color: 'bg-red-500/20 text-red-400 border-red-500/30', dot: 'bg-red-500', bar: '#ef4444' },
};

const categoryColors: Record<string, string> = {
  Work: 'bg-blue-500/20 text-blue-400',
  Content: 'bg-pink-500/20 text-pink-400',
  Operations: 'bg-violet-500/20 text-violet-400',
  Development: 'bg-emerald-500/20 text-emerald-400',
  Business: 'bg-amber-500/20 text-amber-400',
  Personal: 'bg-cyan-500/20 text-cyan-400',
};

function formatTime(hour: number): string {
  if (hour === 0) return '12a';
  if (hour === 12) return '12p';
  if (hour < 12) return `${hour}a`;
  return `${hour - 12}p`;
}

function parseFrequencyMinutes(freq: string, cron: string): number | null {
  if (cron.startsWith('*/30')) return 30;
  if (cron.startsWith('0 */4')) return 240;
  if (cron.startsWith('0 */2')) return 120;
  if (cron.startsWith('0 *')) return 60;
  if (cron.startsWith('0 23') || cron.startsWith('0 10') || cron.startsWith('0 14')) return null; // daily
  return null;
}

function getActiveHours(task: AutomationTask): number[] {
  const hours: number[] = [];
  const freqMinutes = parseFrequencyMinutes(task.frequency, task.cron_expression);

  if (!freqMinutes) {
    // Single daily run
    hours.push(task.hour_start);
    return hours;
  }

  const freqHours = freqMinutes / 60;
  for (let h = task.hour_start; h <= task.hour_end; h += freqHours) {
    hours.push(Math.floor(h));
  }
  return [...new Set(hours)];
}

export default function AutomationsPage() {
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/automations');
      const data = await res.json();
      setTasks(data);
    } catch {
      console.error('Failed to fetch automations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const fullyAutomated = tasks.filter(t => t.status === 'fully_automated');
  const semiAutomated = tasks.filter(t => t.status === 'semi_automated');
  const pending = tasks.filter(t => t.status === 'pending');

  // Build timeline data — which tasks fire at which hours
  const automatedTasks = tasks.filter(t => t.status !== 'pending');
  const timelineData: Record<number, AutomationTask[]> = {};
  HOURS.forEach(h => { timelineData[h] = []; });
  automatedTasks.forEach(task => {
    const activeHours = getActiveHours(task);
    activeHours.forEach(h => {
      if (h >= 0 && h < 24) timelineData[h].push(task);
    });
  });
  const maxTasksInHour = Math.max(...Object.values(timelineData).map(arr => arr.length), 1);

  // Current hour for the marker
  const now = new Date();
  const currentHour = now.getHours();

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Automations</h1>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map(i => <div key={i} className="card animate-pulse h-24" />)}
        </div>
        <div className="card animate-pulse h-48 mb-8" />
        <div className="card animate-pulse h-64" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Automations</h1>
        <p className="text-muted-foreground mt-1">
          {tasks.length} tasks · {fullyAutomated.length + semiAutomated.length} automated · {pending.length} could be
        </p>
      </div>

      {/* ─── Status Cards ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatusCard
          icon="✅"
          label="Fully Automated"
          count={fullyAutomated.length}
          description="No human input needed"
          color="border-green-500/50"
          bgGlow="bg-green-500/5"
        />
        <StatusCard
          icon="⚡"
          label="Semi-Automated"
          count={semiAutomated.length}
          description="Runs via cron, needs review"
          color="border-yellow-500/50"
          bgGlow="bg-yellow-500/5"
        />
        <StatusCard
          icon="🔴"
          label="Pending"
          count={pending.length}
          description="Manual tasks to automate"
          color="border-red-500/50"
          bgGlow="bg-red-500/5"
        />
      </div>

      {/* ─── 24-Hour Timeline ──────────────────────────── */}
      <div className="card mb-8">
        <h2 className="widget-title mb-4">📅 Daily Timeline (CST)</h2>
        <div className="relative">
          {/* Hour grid */}
          <div className="flex gap-0 overflow-x-auto pb-2">
            {HOURS.map(hour => {
              const tasksAtHour = timelineData[hour];
              const barHeight = tasksAtHour.length > 0
                ? Math.max(20, (tasksAtHour.length / maxTasksInHour) * 120)
                : 4;
              const isCurrentHour = hour === currentHour;

              return (
                <div
                  key={hour}
                  className="flex flex-col items-center flex-shrink-0 group relative"
                  style={{ width: 'calc(100% / 24)', minWidth: '36px' }}
                >
                  {/* Task count */}
                  <div className="text-[10px] text-muted-foreground mb-1 h-4 flex items-end">
                    {tasksAtHour.length > 0 && (
                      <span className="font-medium">{tasksAtHour.length}</span>
                    )}
                  </div>

                  {/* Bar */}
                  <div className="w-full px-0.5 flex items-end" style={{ height: '124px' }}>
                    <div
                      className={`w-full rounded-t transition-all duration-300 ${
                        isCurrentHour ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''
                      } ${tasksAtHour.length === 0 ? 'bg-border' : ''}`}
                      style={{
                        height: `${barHeight}px`,
                        background: tasksAtHour.length > 0
                          ? `linear-gradient(to top, ${getBarGradient(tasksAtHour)})`
                          : undefined,
                      }}
                      title={tasksAtHour.map(t => t.name).join('\n') || 'No tasks'}
                    />
                  </div>

                  {/* Hour label */}
                  <div className={`text-[10px] mt-1 ${
                    isCurrentHour ? 'text-primary font-bold' : 'text-muted-foreground'
                  }`}>
                    {formatTime(hour)}
                  </div>

                  {/* Tooltip on hover */}
                  {tasksAtHour.length > 0 && (
                    <div className="absolute bottom-full mb-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-30">
                      <div className="bg-popover border border-border rounded-lg p-2 shadow-lg min-w-[180px] text-xs">
                        <div className="font-medium text-foreground mb-1">{formatTime(hour)} CST</div>
                        {tasksAtHour.map(t => (
                          <div key={t.id} className="flex items-center gap-1.5 py-0.5">
                            <div className={`w-2 h-2 rounded-full ${statusConfig[t.status].dot}`} />
                            <span className="text-muted-foreground">{t.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
            {Object.entries(statusConfig).filter(([k]) => k !== 'pending').map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className={`w-3 h-3 rounded ${cfg.dot}`} />
                <span>{cfg.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-xs text-primary ml-auto">
              <div className="w-3 h-3 rounded ring-2 ring-primary bg-primary/30" />
              <span>Current Hour</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Weekly Calendar Grid ──────────────────────── */}
      <div className="card mb-8">
        <h2 className="widget-title mb-4">📆 Weekly Schedule</h2>
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {DAY_NAMES.map((day, i) => {
            const isToday = now.getDay() === i;
            return (
              <div
                key={day}
                className={`text-center text-xs font-semibold uppercase tracking-wider pb-2 border-b border-border ${
                  isToday ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {day}
                {isToday && <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-1" />}
              </div>
            );
          })}

          {/* Day columns */}
          {DAY_NAMES.map((_, dayIdx) => {
            const dayTasks = tasks.filter(t => t.days_of_week.includes(dayIdx));
            return (
              <div key={dayIdx} className="space-y-1 pt-2 min-h-[120px]">
                {dayTasks.map(task => (
                  <div
                    key={task.id}
                    className={`px-1.5 py-1 rounded text-[10px] font-medium truncate cursor-pointer transition-colors ${
                      statusConfig[task.status].color
                    } hover:opacity-80`}
                    title={`${task.name} — ${task.frequency}`}
                    onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
                  >
                    {task.name.length > 12 ? task.name.slice(0, 12) + '…' : task.name}
                  </div>
                ))}
                {dayTasks.length === 0 && (
                  <div className="text-[10px] text-muted-foreground/40 text-center py-4">—</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
          {Object.entries(statusConfig).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className={`w-3 h-3 rounded ${cfg.dot}`} />
              <span>{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Task Cards by Status ──────────────────────── */}
      {[
        { key: 'fully_automated' as const, title: '✅ Fully Automated', items: fullyAutomated },
        { key: 'semi_automated' as const, title: '⚡ Semi-Automated', items: semiAutomated },
        { key: 'pending' as const, title: '🔴 Pending — Could Be Automated', items: pending },
      ].map(group => (
        <div key={group.key} className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {group.title}
            <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
              {group.items.length}
            </span>
          </h2>
          <div className="grid gap-3">
            {group.items.map(task => (
              <div
                key={task.id}
                className={`card cursor-pointer transition-all hover:border-muted-foreground/40 ${
                  expandedId === task.id ? 'ring-1 ring-primary/30' : ''
                }`}
                onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusConfig[task.status].color}`}>
                        {statusConfig[task.status].icon} {statusConfig[task.status].label}
                      </span>
                      <h3 className="text-sm font-semibold">{task.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[task.category] || 'bg-secondary text-muted-foreground'}`}>
                        {task.category}
                      </span>
                    </div>
                    {expandedId === task.id && (
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-muted-foreground">{task.frequency}</div>
                    {task.last_run && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Last: {new Date(task.last_run).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago' })}
                      </div>
                    )}
                  </div>
                </div>

                {expandedId === task.id && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Cron:</span>
                        <span className="ml-1 font-mono">{task.cron_expression || '—'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Days:</span>
                        <span className="ml-1">{task.days_of_week.map(d => DAY_NAMES[d]).join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Hours:</span>
                        <span className="ml-1">{formatTime(task.hour_start)}–{formatTime(task.hour_end)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Approval:</span>
                        <span className="ml-1">{task.requires_approval ? '⚡ Required' : '✅ Auto'}</span>
                      </div>
                    </div>

                    {task.status === 'pending' && (
                      <div className="mt-3 flex justify-end">
                        <button className="btn btn-primary text-xs">
                          🔄 Convert to Automation
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {group.items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No {group.key.replace('_', ' ')} tasks
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusCard({ icon, label, count, description, color, bgGlow }: {
  icon: string; label: string; count: number; description: string; color: string; bgGlow: string;
}) {
  return (
    <div className={`card border ${color} ${bgGlow} relative overflow-hidden`}>
      <div className="flex items-center gap-3">
        <div className="text-3xl">{icon}</div>
        <div>
          <div className="text-2xl font-bold">{count}</div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
    </div>
  );
}

function getBarGradient(tasks: AutomationTask[]): string {
  const colors: string[] = [];
  const hasFullyAuto = tasks.some(t => t.status === 'fully_automated');
  const hasSemiAuto = tasks.some(t => t.status === 'semi_automated');

  if (hasFullyAuto && hasSemiAuto) {
    colors.push('#22c55e', '#eab308');
  } else if (hasFullyAuto) {
    colors.push('#22c55e', '#16a34a');
  } else if (hasSemiAuto) {
    colors.push('#eab308', '#ca8a04');
  } else {
    colors.push('#64748b', '#475569');
  }
  return colors.join(', ');
}
