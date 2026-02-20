'use client';

import { useEffect, useState, useCallback } from 'react';
import { QueueItem } from '@/lib/ops/types';
import { PriorityBadge } from '@/components/ops/PriorityBadge';
import { Modal } from '@/components/ops/Modal';
import { agentColors, timeAgo } from '@/lib/ops/utils';

const STATUSES = ['Pending', 'Reviewed', 'Done'];

interface QueueBoardProps {
  queueType: 'kyle' | 'knox';
  title: string;
  icon: string;
}

export function QueueBoard({ queueType, title, icon }: QueueBoardProps) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<QueueItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [newItem, setNewItem] = useState({ title: '', description: '', priority: 'P2', requested_by: '' });

  const fetchItems = useCallback(() => {
    const params = new URLSearchParams({ queue_type: queueType });
    if (search) params.set('search', search);
    if (filterStatus) params.set('status', filterStatus);
    fetch(`/api/queues?${params}`)
      .then((r) => r.json())
      .then((d) => { setItems(d); setLoading(false); });
  }, [queueType, search, filterStatus]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAdd = async () => {
    if (!newItem.title.trim()) return;
    await fetch('/api/ops/queues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newItem, queue_type: queueType }),
    });
    setNewItem({ title: '', description: '', priority: 'P2', requested_by: '' });
    setShowAdd(false);
    fetchItems();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch('/api/ops/queues', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/queues?id=${id}`, { method: 'DELETE' });
    setSelected(null);
    fetchItems();
  };

  const statusBg: Record<string, string> = {
    Pending: 'bg-yellow-500/20 text-yellow-400',
    Reviewed: 'bg-blue-500/20 text-blue-400',
    Done: 'bg-green-500/20 text-green-400',
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;

  const pendingCount = items.filter(i => i.status === 'Pending').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          {pendingCount > 0 && (
            <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full">{pendingCount} pending</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </button>
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelected(item)}
            className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-slate-500 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <PriorityBadge priority={item.priority} />
                  <h3 className="text-sm font-medium text-slate-100">{item.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusBg[item.status]}`}>{item.status}</span>
                </div>
                {item.description && <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>}
              </div>
              <div className="text-right ml-4">
                {item.requested_by && (
                  <span className={`text-xs px-2 py-0.5 rounded ${agentColors[item.requested_by] || 'bg-slate-700 text-slate-300'}`}>
                    {item.requested_by}
                  </span>
                )}
                <div className="text-xs text-slate-500 mt-1">{timeAgo(item.created_at)}</div>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-slate-500 text-center py-8">Queue is empty 🎉</p>}
      </div>

      {/* Add Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={`${icon} Add to ${title}`}>
        <div className="space-y-4">
          <input
            type="text"
            value={newItem.title}
            onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
            placeholder="Title"
            className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <textarea
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            placeholder="Description..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={newItem.priority}
              onChange={(e) => setNewItem({ ...newItem, priority: e.target.value })}
              className="px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
            >
              {['P0','P1','P2','P3','P4'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select
              value={newItem.requested_by}
              onChange={(e) => setNewItem({ ...newItem, requested_by: e.target.value })}
              className="px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">Requested by...</option>
              {['Knox','Stack','Pulse','Scout','Reach','Bridge','Forge','Wire','Kyle'].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <button onClick={handleAdd} className="w-full px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
            Add to Queue
          </button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title || ''}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <PriorityBadge priority={selected.priority} />
              <span className={`text-xs px-2 py-0.5 rounded ${statusBg[selected.status]}`}>{selected.status}</span>
              {selected.requested_by && (
                <span className={`text-xs px-2 py-0.5 rounded ${agentColors[selected.requested_by] || 'bg-slate-700 text-slate-300'}`}>
                  from {selected.requested_by}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-200">{selected.description || 'No description'}</p>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs text-slate-500">Status:</span>
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => { handleStatusChange(selected.id, s); setSelected(null); }}
                  className={`text-xs px-2 py-1 rounded transition-colors ${s === selected.status ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex justify-between pt-4 border-t border-slate-700">
              <button onClick={() => handleDelete(selected.id)} className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors">
                Delete
              </button>
              <span className="text-xs text-slate-500">{timeAgo(selected.created_at)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
