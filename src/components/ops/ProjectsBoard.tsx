'use client';

import { useEffect, useState, useCallback } from 'react';
import { OpsProject as Project } from '@/lib/ops/types';
import { PriorityBadge } from '@/components/ops/PriorityBadge';
import { KanbanBoard } from '@/components/ops/KanbanBoard';
import { Modal } from '@/components/ops/Modal';
import { timeAgo } from '@/lib/ops/utils';

const COLUMNS = ['Backlog', 'In Progress', 'Review', 'Done'];

export function ProjectsBoard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Project | null>(null);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const fetchProjects = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterPriority) params.set('priority', filterPriority);
    fetch(`/api/projects?${params}`)
      .then((r) => r.json())
      .then((d) => { setProjects(d); setLoading(false); });
  }, [search, filterPriority]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await fetch('/api/ops/projects', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    });
  };

  const handleQuickAdd = async (title: string, status: string) => {
    await fetch('/api/ops/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, status }),
    });
    fetchProjects();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
    setSelected(null);
    fetchProjects();
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Priorities</option>
          <option value="P0">P0</option>
          <option value="P1">P1</option>
          <option value="P2">P2</option>
          <option value="P3">P3</option>
          <option value="P4">P4</option>
        </select>
      </div>

      <KanbanBoard
        columns={COLUMNS}
        items={projects}
        getStatus={(p) => p.status}
        onStatusChange={handleStatusChange}
        onQuickAdd={handleQuickAdd}
        quickAddPlaceholder="Add project..."
        renderCard={(project) => (
          <div
            onClick={() => setSelected(project)}
            className="bg-slate-800 rounded-lg border border-slate-700 p-3 hover:border-slate-500 cursor-pointer transition-colors group"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-medium text-slate-100 group-hover:text-blue-400 transition-colors">{project.title}</span>
              <PriorityBadge priority={project.priority} />
            </div>
            {project.description && (
              <p className="text-xs text-slate-400 line-clamp-2 mb-2">{project.description}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {project.owner && <span>👤 {project.owner}</span>}
              {project.due_date && <span>📅 {project.due_date}</span>}
              <span className="ml-auto">{timeAgo(project.updated_at)}</span>
            </div>
          </div>
        )}
      />

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title || ''} width="max-w-xl">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <PriorityBadge priority={selected.priority} />
              <span className="text-sm text-slate-400 bg-slate-700 px-2 py-1 rounded">{selected.status}</span>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">Description</label>
              <p className="text-sm text-slate-200 mt-1">{selected.description || 'No description'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider">Owner</label>
                <p className="text-sm text-slate-200 mt-1">{selected.owner || '—'}</p>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider">Due Date</label>
                <p className="text-sm text-slate-200 mt-1">{selected.due_date || '—'}</p>
              </div>
            </div>
            <div className="flex justify-between pt-4 border-t border-slate-700">
              <button
                onClick={() => handleDelete(selected.id)}
                className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
              >
                Delete
              </button>
              <span className="text-xs text-slate-500">Updated {timeAgo(selected.updated_at)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
