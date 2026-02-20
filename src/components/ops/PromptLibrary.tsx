'use client';

import { useEffect, useState, useCallback } from 'react';
import { Prompt } from '@/lib/ops/types';
import { Modal } from '@/components/ops/Modal';
import { timeAgo } from '@/lib/ops/utils';

const CATEGORIES = ['Outreach', 'Content', 'Development', 'Research', 'Client Work'];

export function PromptLibrary() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Prompt | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [newPrompt, setNewPrompt] = useState({ title: '', prompt_text: '', category: 'Development', tags: '' });

  const fetchPrompts = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (filterCategory) params.set('category', filterCategory);
    fetch(`/api/prompts?${params}`)
      .then((r) => r.json())
      .then((d) => { setPrompts(d); setLoading(false); });
  }, [search, filterCategory]);

  useEffect(() => { fetchPrompts(); }, [fetchPrompts]);

  const handleAdd = async () => {
    if (!newPrompt.title.trim()) return;
    await fetch('/api/ops/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPrompt),
    });
    setNewPrompt({ title: '', prompt_text: '', category: 'Development', tags: '' });
    setShowAdd(false);
    fetchPrompts();
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    await fetch('/api/ops/prompts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, usage_count: (prompts.find(p => p.id === id)?.usage_count || 0) + 1, last_used: new Date().toISOString() }),
    });
    fetchPrompts();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/prompts?id=${id}`, { method: 'DELETE' });
    setSelected(null);
    fetchPrompts();
  };

  const categoryColors: Record<string, string> = {
    Outreach: 'bg-cyan-500/20 text-cyan-400',
    Content: 'bg-pink-500/20 text-pink-400',
    Development: 'bg-violet-500/20 text-violet-400',
    Research: 'bg-emerald-500/20 text-emerald-400',
    'Client Work': 'bg-amber-500/20 text-amber-400',
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
            placeholder="Search prompts..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => setShowAdd(true)} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Prompt
        </button>
      </div>

      <div className="grid gap-3">
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-slate-500 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 cursor-pointer" onClick={() => setSelected(prompt)}>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-medium text-slate-100">{prompt.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[prompt.category]}`}>{prompt.category}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 font-mono">{prompt.prompt_text}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  {prompt.tags && prompt.tags.split(',').map(t => (
                    <span key={t} className="bg-slate-700/50 px-1.5 py-0.5 rounded">#{t.trim()}</span>
                  ))}
                  <span className="ml-auto">Used {prompt.usage_count}x</span>
                  {prompt.last_used && <span>· {timeAgo(prompt.last_used)}</span>}
                </div>
              </div>
              <button
                onClick={() => handleCopy(prompt.prompt_text, prompt.id)}
                className="ml-3 px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        ))}
        {prompts.length === 0 && <p className="text-slate-500 text-center py-8">No prompts yet. Add one!</p>}
      </div>

      {/* Add Prompt Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="📝 New Prompt" width="max-w-xl">
        <div className="space-y-4">
          <input
            type="text"
            value={newPrompt.title}
            onChange={(e) => setNewPrompt({ ...newPrompt, title: e.target.value })}
            placeholder="Prompt title"
            className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
          <textarea
            value={newPrompt.prompt_text}
            onChange={(e) => setNewPrompt({ ...newPrompt, prompt_text: e.target.value })}
            placeholder="Prompt text..."
            rows={6}
            className="w-full px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={newPrompt.category}
              onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
              className="px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              type="text"
              value={newPrompt.tags}
              onChange={(e) => setNewPrompt({ ...newPrompt, tags: e.target.value })}
              placeholder="Tags (comma-separated)"
              className="px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button onClick={handleAdd} className="w-full px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
            Add Prompt
          </button>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title || ''} width="max-w-2xl">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[selected.category]}`}>{selected.category}</span>
              <span className="text-xs text-slate-500">Used {selected.usage_count}x</span>
            </div>
            <pre className="text-sm text-slate-200 bg-slate-900 p-4 rounded-lg whitespace-pre-wrap font-mono border border-slate-700">{selected.prompt_text}</pre>
            {selected.tags && (
              <div className="flex items-center gap-2">
                {selected.tags.split(',').map(t => (
                  <span key={t} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">#{t.trim()}</span>
                ))}
              </div>
            )}
            <div className="flex justify-between pt-4 border-t border-slate-700">
              <button onClick={() => handleDelete(selected.id)} className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors">
                Delete
              </button>
              <button
                onClick={() => handleCopy(selected.prompt_text, selected.id)}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                Copy Prompt
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
