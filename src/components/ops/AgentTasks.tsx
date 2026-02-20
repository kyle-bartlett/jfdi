'use client';

import { useEffect, useState, useCallback } from 'react';
import { AgentTask } from '@/lib/ops/types';
import { KanbanBoard } from '@/components/ops/KanbanBoard';
import { Modal } from '@/components/ops/Modal';
import { agentColors, statusIcons, timeAgo } from '@/lib/ops/utils';

const COLUMNS = ['Queued', 'Running', 'Completed', 'Failed'];
const AGENTS = ['Stack', 'Pulse', 'Scout', 'Reach', 'Bridge', 'Forge', 'Wire'];

export function AgentTasks() {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AgentTask | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [newTask, setNewTask] = useState({ agent_name: 'Stack', task_description: '' });

  const fetchTasks = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterAgent) params.set('agent_name', filterAgent);
    fetch(`/api/agents?${params}`)
      .then((r) => r.json())
      .then((d) => { setTasks(d); setLoading(false); });
  }, [search, filterAgent]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const updates: Record<string, string> = { id, status: newStatus };
    if (newStatus === 'Running') updates.deployed_at = new Date().toISOString();
    if (newStatus === 'Completed' || newStatus === 'Failed') updates.completed_at = new Date().toISOString();
    await fetch('/api/ops/agents', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  };

  const handleAdd = async () => {
    if (!newTask.task_description.trim()) return;
    await fetch('/api/ops/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask),
    });
    setNewTask({ agent_name: 'Stack', task_description: '' });
    setShowAdd(false);
    fetchTasks();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/agents?id=${id}`, { method: 'DELETE' });
    setSelected(null);
    fetchTasks();
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
            placeholder="Search agent tasks..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={filterAgent}
          onChange={(e) => setFilterAgent(e.target.value)}
          className="px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Agents</option>
          {AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </button>
      </div>

      <KanbanBoard
        columns={COLUMNS}
        items={tasks}
        getStatus={(t) => t.status}
        onStatusChange={handleStatusChange}
        renderCard={(task) => (
          <div
            onClick={() => setSelected(task)}
            className="bg-slate-800 rounded-lg border border-slate-700 p-3 hover:border-slate-500 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">{statusIcons[task.status] || '❓'}</span>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${agentColors[task.agent_name] || 'bg-slate-700 text-slate-300'}`}>
                {task.agent_name}
              </span>
            </div>
            <p className="text-sm text-slate-200 line-clamp-2">{task.task_description}</p>
            {task.result_summary && (
              <p className="text-xs text-slate-400 mt-2 line-clamp-1">→ {task.result_summary}</p>
            )}
            <div className="text-xs text-slate-500 mt-2">{timeAgo(task.deployed_at)}</div>
          </div>
        )}
      />

      {/* Add Task Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="🤖 Deploy Agent Task">
        <div className="space-y-4">
          <select
            value={newTask.agent_name}
            onChange={(e) => setNewTask({ ...newTask, agent_name: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
          >
            {AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <textarea
            value={newTask.task_description}
            onChange={(e) => setNewTask({ ...newTask, task_description: e.target.value })}
            placeholder="Task description..."
            rows={4}
            className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <button onClick={handleAdd} className="w-full px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
            Deploy Task
          </button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`${selected?.agent_name || ''} Task`} width="max-w-xl">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${agentColors[selected.agent_name]}`}>{selected.agent_name}</span>
              <span className="text-sm">{statusIcons[selected.status]} {selected.status}</span>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">Task</label>
              <p className="text-sm text-slate-200 mt-1">{selected.task_description}</p>
            </div>
            {selected.result_summary && (
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider">Result</label>
                <p className="text-sm text-slate-200 mt-1">{selected.result_summary}</p>
              </div>
            )}
            {selected.performance_notes && (
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider">Performance Notes</label>
                <p className="text-sm text-slate-200 mt-1">{selected.performance_notes}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
              <div>Deployed: {selected.deployed_at ? timeAgo(selected.deployed_at) : '—'}</div>
              <div>Completed: {selected.completed_at ? timeAgo(selected.completed_at) : '—'}</div>
            </div>
            <div className="flex justify-between pt-4 border-t border-slate-700">
              <button onClick={() => handleDelete(selected.id)} className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors">
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
