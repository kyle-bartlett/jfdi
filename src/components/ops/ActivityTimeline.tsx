'use client';

import { useEffect, useState, useCallback } from 'react';
import { ActivityEvent } from '@/lib/ops/types';
import { Modal } from '@/components/ops/Modal';
import { timeAgo } from '@/lib/ops/utils';

const EVENT_TYPES = [
  { value: '', label: 'All Events' },
  { value: 'agent_deploy', label: '🤖 Agent Deploy' },
  { value: 'agent_complete', label: '✅ Agent Complete' },
  { value: 'agent_fail', label: '❌ Agent Fail' },
  { value: 'project_update', label: '📋 Project Update' },
  { value: 'prospect_update', label: '🎯 Prospect Update' },
  { value: 'idea_added', label: '💡 Idea Added' },
  { value: 'queue_action', label: '📥 Queue Action' },
  { value: 'milestone', label: '🏆 Milestone' },
  { value: 'note', label: '📝 Note' },
  { value: 'system', label: '⚙️ System' },
];

const EVENT_ICONS: Record<string, string> = {
  agent_deploy: '🚀',
  agent_complete: '✅',
  agent_fail: '💥',
  project_update: '📋',
  prospect_update: '🎯',
  idea_added: '💡',
  queue_action: '📥',
  milestone: '🏆',
  note: '📝',
  system: '⚙️',
};

const EVENT_COLORS: Record<string, string> = {
  agent_deploy: 'border-l-violet-500',
  agent_complete: 'border-l-green-500',
  agent_fail: 'border-l-red-500',
  project_update: 'border-l-blue-500',
  prospect_update: 'border-l-cyan-500',
  idea_added: 'border-l-yellow-500',
  queue_action: 'border-l-orange-500',
  milestone: 'border-l-amber-400',
  note: 'border-l-slate-500',
  system: 'border-l-sky-500',
};

const EVENT_BG: Record<string, string> = {
  agent_deploy: 'bg-violet-500/10',
  agent_complete: 'bg-green-500/10',
  agent_fail: 'bg-red-500/10',
  project_update: 'bg-blue-500/10',
  prospect_update: 'bg-cyan-500/10',
  idea_added: 'bg-yellow-500/10',
  queue_action: 'bg-orange-500/10',
  milestone: 'bg-amber-500/10',
  note: 'bg-slate-500/10',
  system: 'bg-sky-500/10',
};

export function ActivityTimeline() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterView, setFilterView] = useState<'all' | 'starred' | 'pinned'>('all');
  const [newEvent, setNewEvent] = useState({
    event_type: 'note',
    title: '',
    description: '',
    source: '',
    icon: '📌',
  });

  const fetchEvents = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterType) params.set('event_type', filterType);
    if (filterView === 'starred') params.set('starred', '1');
    if (filterView === 'pinned') params.set('pinned', '1');
    fetch(`/api/activity?${params}`)
      .then((r) => r.json())
      .then((d) => { setEvents(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search, filterType, filterView]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const handleAdd = async () => {
    if (!newEvent.title.trim()) return;
    await fetch('/api/ops/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent),
    });
    setNewEvent({ event_type: 'note', title: '', description: '', source: '', icon: '📌' });
    setShowAdd(false);
    fetchEvents();
  };

  const handleToggleStar = async (event: ActivityEvent) => {
    await fetch('/api/ops/activity', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: event.id, starred: event.starred ? 0 : 1 }),
    });
    fetchEvents();
  };

  const handleTogglePin = async (event: ActivityEvent) => {
    await fetch('/api/ops/activity', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: event.id, pinned: event.pinned ? 0 : 1 }),
    });
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/activity?id=${id}`, { method: 'DELETE' });
    fetchEvents();
  };

  // Group events by date
  const groupedEvents = events.reduce<Record<string, ActivityEvent[]>>((groups, event) => {
    const date = event.created_at ? event.created_at.split('T')[0] : 'Unknown';
    if (!groups[date]) groups[date] = [];
    groups[date].push(event);
    return groups;
  }, {});

  const formatDateHeader = (dateStr: string) => {
    if (dateStr === 'Unknown') return 'Unknown Date';
    try {
      const d = new Date(dateStr + 'T12:00:00');
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (d.toDateString() === today.toDateString()) return '🔥 Today';
      if (d.toDateString() === yesterday.toDateString()) return '📅 Yesterday';
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading timeline...</div>;

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activity..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
          >
            {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggles */}
          <div className="flex bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            {(['all', 'starred', 'pinned'] as const).map(view => (
              <button
                key={view}
                onClick={() => setFilterView(view)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  filterView === view ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                {view === 'all' ? '📋 All' : view === 'starred' ? '⭐ Starred' : '📌 Pinned'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Log Event
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-4 px-4 py-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-medium text-slate-200">{events.length}</span> events
        </div>
        <div className="w-px h-4 bg-slate-700" />
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="text-yellow-400">⭐</span>
          <span className="font-medium text-slate-200">{events.filter(e => e.starred).length}</span> starred
        </div>
        <div className="w-px h-4 bg-slate-700" />
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>📌</span>
          <span className="font-medium text-slate-200">{events.filter(e => e.pinned).length}</span> pinned
        </div>
        <div className="flex-1" />
        <div className="flex gap-1">
          {Object.entries(EVENT_ICONS).map(([type, icon]) => {
            const count = events.filter(e => e.event_type === type).length;
            if (count === 0) return null;
            return (
              <button
                key={type}
                onClick={() => setFilterType(filterType === type ? '' : type)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  filterType === type ? 'bg-blue-600/30 text-blue-400' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                }`}
                title={type.replace('_', ' ')}
              >
                {icon} {count}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.keys(groupedEvents).length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-400 text-sm">No activity yet. Log your first event!</p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-3 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              Log Event
            </button>
          </div>
        )}

        {Object.entries(groupedEvents).map(([date, dayEvents]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
                {formatDateHeader(date)}
              </h3>
              <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
                {dayEvents.length}
              </span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            <div className="space-y-2 relative">
              {/* Timeline connector line */}
              <div className="absolute left-5 top-4 bottom-4 w-px bg-slate-700/50" />

              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className={`relative flex items-start gap-3 p-3 rounded-lg border-l-4 transition-all hover:bg-slate-800/80 group ${
                    EVENT_COLORS[event.event_type] || 'border-l-slate-600'
                  } ${EVENT_BG[event.event_type] || 'bg-slate-800/30'} ${event.pinned ? 'ring-1 ring-amber-500/30' : ''}`}
                >
                  {/* Icon */}
                  <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-lg">
                    {event.icon || EVENT_ICONS[event.event_type] || '📌'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-medium text-slate-100">
                          {event.pinned ? <span className="mr-1">📌</span> : null}
                          {event.title}
                        </h4>
                        {event.description && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{event.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-xs text-slate-500">{timeAgo(event.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {event.source && (
                        <span className="text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded">
                          {event.source}
                        </span>
                      )}
                      <span className="text-xs bg-slate-700/30 text-slate-500 px-2 py-0.5 rounded capitalize">
                        {event.event_type.replace('_', ' ')}
                      </span>

                      {/* Action buttons - show on hover */}
                      <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleStar(event); }}
                          className={`p-1 rounded transition-colors ${
                            event.starred ? 'text-yellow-400 bg-yellow-500/10' : 'text-slate-500 hover:text-yellow-400 hover:bg-yellow-500/10'
                          }`}
                          title={event.starred ? 'Unstar' : 'Star'}
                        >
                          {event.starred ? '⭐' : '☆'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleTogglePin(event); }}
                          className={`p-1 rounded transition-colors ${
                            event.pinned ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-amber-400 hover:bg-amber-500/10'
                          }`}
                          title={event.pinned ? 'Unpin' : 'Pin'}
                        >
                          📌
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }}
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Event Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="📝 Log Activity Event" width="max-w-lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Event Type</label>
              <select
                value={newEvent.event_type}
                onChange={(e) => {
                  const icon = EVENT_ICONS[e.target.value] || '📌';
                  setNewEvent({ ...newEvent, event_type: e.target.value, icon });
                }}
                className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
              >
                {EVENT_TYPES.filter(t => t.value).map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Source</label>
              <select
                value={newEvent.source}
                onChange={(e) => setNewEvent({ ...newEvent, source: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select source...</option>
                {['Knox', 'Kyle', 'Stack', 'Pulse', 'Scout', 'Reach', 'Bridge', 'Forge', 'Wire', 'System', 'Cron'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Title</label>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              placeholder="What happened?"
              className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider mb-1 block">Details (optional)</label>
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              placeholder="More context..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Icon preview */}
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-700/50 rounded-lg">
            <span className="text-2xl">{newEvent.icon}</span>
            <div>
              <span className="text-sm text-slate-200">{newEvent.title || 'Event title'}</span>
              <span className="text-xs text-slate-500 ml-2">{newEvent.event_type.replace('_', ' ')}</span>
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={!newEvent.title.trim()}
            className="w-full px-4 py-2.5 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors font-medium"
          >
            Log Event
          </button>
        </div>
      </Modal>
    </div>
  );
}
