'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ActionQueueItem } from '@/lib/ops/types';
import { agentColors, timeAgo } from '@/lib/ops/utils';

const priorityConfig: Record<string, { color: string; label: string }> = {
  P0: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: '🔴 P0 — Critical' },
  P1: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: '🟠 P1 — High' },
  P2: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: '🟡 P2 — Medium' },
  P3: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: '🔵 P3 — Low' },
  P4: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: '⚪ P4 — Minimal' },
};

const statusConfig: Record<string, { icon: string; color: string }> = {
  pending: { icon: '⏳', color: 'bg-yellow-500/20 text-yellow-400' },
  approved: { icon: '✅', color: 'bg-green-500/20 text-green-400' },
  rejected: { icon: '❌', color: 'bg-red-500/20 text-red-400' },
  modified: { icon: '✏️', color: 'bg-blue-500/20 text-blue-400' },
};

export default function ActionQueuePage() {
  const [items, setItems] = useState<ActionQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'modified'>('all');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showShortcuts, setShowShortcuts] = useState(true);
  const focusedCardRef = useRef<HTMLDivElement>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/action-queue');
      const data = await res.json();
      setItems(data);
    } catch {
      console.error('Failed to fetch action queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Scroll focused card into view
  useEffect(() => {
    if (focusedCardRef.current) {
      focusedCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [focusedIndex]);

  // Keyboard shortcuts for queue triage
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const total = filteredItems.length;
      if (total === 0 && e.key !== '?') return;

      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, total - 1));
          break;
        case 'k':
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'a': {
          if (focusedIndex >= 0 && focusedIndex < total) {
            const item = filteredItems[focusedIndex];
            if (item.status === 'pending') {
              e.preventDefault();
              handleApprove(item.id);
            }
          }
          break;
        }
        case 'x': {
          if (focusedIndex >= 0 && focusedIndex < total) {
            const item = filteredItems[focusedIndex];
            if (item.status === 'pending') {
              e.preventDefault();
              handleReject(item.id);
            }
          }
          break;
        }
        case 'm': {
          if (focusedIndex >= 0 && focusedIndex < total) {
            const item = filteredItems[focusedIndex];
            if (item.status === 'pending') {
              e.preventDefault();
              handleModify(item);
            }
          }
          break;
        }
        case '1':
          e.preventDefault();
          setFilter('all');
          setFocusedIndex(-1);
          break;
        case '2':
          e.preventDefault();
          setFilter('pending');
          setFocusedIndex(-1);
          break;
        case '3':
          e.preventDefault();
          setFilter('approved');
          setFocusedIndex(-1);
          break;
        case '4':
          e.preventDefault();
          setFilter('rejected');
          setFocusedIndex(-1);
          break;
        case '?':
          e.preventDefault();
          setShowShortcuts((prev) => !prev);
          break;
        case 'Escape':
          setFocusedIndex(-1);
          setEditingId(null);
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const updateItem = async (id: string, updates: Partial<ActionQueueItem>) => {
    await fetch('/api/action-queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    await fetchItems();
  };

  const handleApprove = (id: string) => updateItem(id, { status: 'approved' });
  const handleReject = (id: string) => updateItem(id, { status: 'rejected' });

  const handleModify = (item: ActionQueueItem) => {
    setEditingId(item.id);
    setEditNotes(item.notes || '');
  };

  const handleSaveModify = async (id: string) => {
    await updateItem(id, { status: 'modified', notes: editNotes });
    setEditingId(null);
    setEditNotes('');
  };

  const filteredItems = filter === 'all' ? items : items.filter(i => i.status === filter);
  const pendingCount = items.filter(i => i.status === 'pending').length;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Action Queue</h1>
          <p className="text-muted-foreground mt-1">
            Items requiring your decision
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                {pendingCount} pending
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'approved', 'rejected', 'modified'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {f === 'all' ? '📋 All' : `${statusConfig[f].icon} ${f.charAt(0).toUpperCase() + f.slice(1)}`}
            {f === 'all' ? ` (${items.length})` : ` (${items.filter(i => i.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse h-32" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">{filter === 'pending' ? '🎉' : '📭'}</div>
          <p className="text-muted-foreground">
            {filter === 'pending' ? 'No pending items — all caught up!' : `No ${filter} items`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item, idx) => {
            const isFocused = idx === focusedIndex;
            return (
            <div
              key={item.id}
              ref={isFocused ? focusedCardRef : undefined}
              className={`card transition-all ${
                isFocused
                  ? 'ring-2 ring-primary/60 border-l-4 ' + (
                      item.status === 'pending' ? 'border-l-yellow-500' :
                      item.status === 'approved' ? 'border-l-green-500 opacity-75' :
                      item.status === 'rejected' ? 'border-l-red-500 opacity-60' :
                      'border-l-blue-500 opacity-75'
                    )
                  : (
                      item.status === 'pending' ? 'border-l-4 border-l-yellow-500' :
                      item.status === 'approved' ? 'border-l-4 border-l-green-500 opacity-75' :
                      item.status === 'rejected' ? 'border-l-4 border-l-red-500 opacity-60' :
                      'border-l-4 border-l-blue-500 opacity-75'
                    )
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${priorityConfig[item.priority]?.color || priorityConfig.P2.color}`}>
                      {item.priority}
                    </span>
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${statusConfig[item.status]?.color || ''}`}>
                      {statusConfig[item.status]?.icon} {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className={`px-2 py-0.5 rounded ${agentColors[item.source.split(' ')[0]] || 'bg-secondary text-muted-foreground'}`}>
                      {item.source}
                    </span>
                    <span>{timeAgo(item.created_at)}</span>
                  </div>

                  {item.notes && (
                    <div className="mt-3 p-2 bg-secondary rounded text-sm text-muted-foreground">
                      <span className="text-xs font-medium uppercase tracking-wider">Notes:</span>
                      <p className="mt-1">{item.notes}</p>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                {item.status === 'pending' && (
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-500 text-white transition-colors flex items-center gap-1.5"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleReject(item.id)}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center gap-1.5"
                    >
                      ❌ Reject
                    </button>
                    <button
                      onClick={() => handleModify(item)}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-secondary hover:bg-muted text-foreground border border-border transition-colors flex items-center gap-1.5"
                    >
                      ✏️ Modify
                    </button>
                  </div>
                )}
              </div>

              {/* Inline edit for Modify */}
              {editingId === item.id && (
                <div className="mt-4 pt-4 border-t border-border">
                  <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Notes / Instructions
                  </label>
                  <textarea
                    autoFocus
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null); }}
                    placeholder="Add your notes, modifications, or instructions..."
                    rows={3}
                    className="input mt-2 w-full"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleSaveModify(item.id)}
                      className="px-4 py-2 text-sm bg-primary hover:bg-primary/85 text-primary-foreground rounded-lg transition-colors"
                    >
                      Save & Mark Modified
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ); })}
        </div>
      )}

      {/* Keyboard Shortcuts Hint Bar */}
      {showShortcuts && filteredItems.length > 0 && !editingId && (
        <div className="fixed bottom-4 right-4 z-40 bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-lg px-4 py-2.5 text-xs flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono font-semibold">j</kbd>
            <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono font-semibold">k</kbd>
            <span className="text-muted-foreground">navigate</span>
          </span>
          <span className="w-px h-4 bg-border" />
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-mono font-semibold">a</kbd>
            <span className="text-muted-foreground">approve</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] font-mono font-semibold">x</kbd>
            <span className="text-muted-foreground">reject</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-mono font-semibold">m</kbd>
            <span className="text-muted-foreground">modify</span>
          </span>
          <span className="w-px h-4 bg-border" />
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono font-semibold">1-4</kbd>
            <span className="text-muted-foreground">filter</span>
          </span>
          <button
            onClick={() => setShowShortcuts(false)}
            className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
