'use client';

import { useEffect, useState, useCallback } from 'react';
import { Idea } from '@/lib/ops/types';
import { Modal } from '@/components/ops/Modal';
import { timeAgo } from '@/lib/ops/utils';

const STATUSES = ['New', 'Evaluating', 'Approved', 'Rejected'];
const EFFORTS = ['S', 'M', 'L', 'XL'];

const statusColors: Record<string, string> = {
  New: 'bg-blue-500/20 text-blue-400',
  Evaluating: 'bg-yellow-500/20 text-yellow-400',
  Approved: 'bg-green-500/20 text-green-400',
  Rejected: 'bg-red-500/20 text-red-400',
};

const effortColors: Record<string, string> = {
  S: 'bg-green-500/20 text-green-400',
  M: 'bg-yellow-500/20 text-yellow-400',
  L: 'bg-orange-500/20 text-orange-400',
  XL: 'bg-red-500/20 text-red-400',
};

export function IdeasBoard() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Idea | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [newIdea, setNewIdea] = useState({ title: '', description: '', potential_revenue: '', effort: 'M', source: '' });

  const fetchIdeas = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterStatus) params.set('status', filterStatus);
    fetch(`/api/ideas?${params}`)
      .then((r) => r.json())
      .then((d) => { setIdeas(d); setLoading(false); });
  }, [search, filterStatus]);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  const handleAdd = async () => {
    if (!newIdea.title.trim()) return;
    await fetch('/api/ops/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newIdea),
    });
    setNewIdea({ title: '', description: '', potential_revenue: '', effort: 'M', source: '' });
    setShowAdd(false);
    fetchIdeas();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch('/api/ops/ideas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    fetchIdeas();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/ideas?id=${id}`, { method: 'DELETE' });
    setSelected(null);
    fetchIdeas();
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ideas..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Idea
        </button>
      </div>

      <div className="grid gap-3">
        {ideas.map((idea) => (
          <div
            key={idea.id}
            onClick={() => setSelected(idea)}
            className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-slate-500 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-medium text-slate-100">{idea.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColors[idea.status]}`}>{idea.status}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${effortColors[idea.effort]}`}>{idea.effort}</span>
                </div>
                {idea.description && <p className="text-xs text-slate-400 line-clamp-2">{idea.description}</p>}
              </div>
              <div className="text-right ml-4">
                {idea.potential_revenue && <span className="text-sm font-medium text-green-400">{idea.potential_revenue}</span>}
                <div className="text-xs text-slate-500 mt-1">{timeAgo(idea.created_at)}</div>
              </div>
            </div>
          </div>
        ))}
        {ideas.length === 0 && <p className="text-slate-500 text-center py-8">No ideas yet. Add one!</p>}
      </div>

      {/* Add Idea Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="💡 New Idea">
        <div className="space-y-4">
          <input
            type="text"
            value={newIdea.title}
            onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
            placeholder="Idea title"
            className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <textarea
            value={newIdea.description}
            onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
            placeholder="Description..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              value={newIdea.potential_revenue}
              onChange={(e) => setNewIdea({ ...newIdea, potential_revenue: e.target.value })}
              placeholder="Revenue potential"
              className="px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <select
              value={newIdea.effort}
              onChange={(e) => setNewIdea({ ...newIdea, effort: e.target.value })}
              className="px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
            >
              {EFFORTS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <input
              type="text"
              value={newIdea.source}
              onChange={(e) => setNewIdea({ ...newIdea, source: e.target.value })}
              placeholder="Source"
              className="px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button onClick={handleAdd} className="w-full px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
            Add Idea
          </button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title || ''}>
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded ${statusColors[selected.status]}`}>{selected.status}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${effortColors[selected.effort]}`}>Effort: {selected.effort}</span>
              {selected.potential_revenue && <span className="text-sm text-green-400">{selected.potential_revenue}</span>}
            </div>
            <p className="text-sm text-slate-200">{selected.description || 'No description'}</p>
            {selected.source && <p className="text-xs text-slate-400">Source: {selected.source}</p>}
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs text-slate-500">Move to:</span>
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
