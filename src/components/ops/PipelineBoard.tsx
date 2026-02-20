'use client';

import { useEffect, useState, useCallback } from 'react';
import { Prospect } from '@/lib/ops/types';
import { KanbanBoard } from '@/components/ops/KanbanBoard';
import { Modal } from '@/components/ops/Modal';
import { timeAgo } from '@/lib/ops/utils';

const COLUMNS = ['Lead', 'Contacted', 'Responded', 'Proposal', 'Negotiating', 'Won', 'Lost'];

export function PipelineBoard() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Prospect | null>(null);
  const [search, setSearch] = useState('');

  const fetchProspects = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    fetch(`/api/pipeline?${params}`)
      .then((r) => r.json())
      .then((d) => { setProspects(d); setLoading(false); });
  }, [search]);

  useEffect(() => { fetchProspects(); }, [fetchProspects]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    await fetch('/api/ops/pipeline', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    });
  };

  const handleQuickAdd = async (name: string, status: string) => {
    await fetch('/api/ops/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_name: name, status }),
    });
    fetchProspects();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/pipeline?id=${id}`, { method: 'DELETE' });
    setSelected(null);
    fetchProspects();
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
            placeholder="Search prospects..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="text-sm text-slate-400">
          {prospects.length} prospects · Est. value: {prospects.reduce((sum, p) => sum + parseInt(p.estimated_value?.replace(/[^0-9]/g, '') || '0'), 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}
        </div>
      </div>

      <KanbanBoard
        columns={COLUMNS}
        items={prospects}
        getStatus={(p) => p.status}
        onStatusChange={handleStatusChange}
        onQuickAdd={handleQuickAdd}
        quickAddPlaceholder="Add prospect..."
        renderCard={(prospect) => (
          <div
            onClick={() => setSelected(prospect)}
            className="bg-slate-800 rounded-lg border border-slate-700 p-3 hover:border-slate-500 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between mb-1">
              <span className="text-sm font-medium text-slate-100">{prospect.business_name}</span>
              {prospect.estimated_value && (
                <span className="text-xs font-medium text-green-400">{prospect.estimated_value}</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {prospect.industry && <span className="bg-slate-700/50 px-1.5 py-0.5 rounded">{prospect.industry}</span>}
              {prospect.location && <span>{prospect.location}</span>}
            </div>
          </div>
        )}
      />

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.business_name || ''} width="max-w-xl">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Contact" value={selected.contact} />
              <Field label="Phone" value={selected.phone} />
              <Field label="Email" value={selected.email} />
              <Field label="Website" value={selected.website} />
              <Field label="Industry" value={selected.industry} />
              <Field label="Location" value={selected.location} />
              <Field label="Estimated Value" value={selected.estimated_value} />
              <Field label="Last Contact" value={selected.last_contact_date} />
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">Notes</label>
              <p className="text-sm text-slate-200 mt-1">{selected.notes || 'No notes'}</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs text-slate-500">Move to:</span>
              <div className="flex flex-wrap gap-1">
                {COLUMNS.map(s => (
                  <button
                    key={s}
                    onClick={() => { handleStatusChange(selected.id, s); setSelected(null); fetchProspects(); }}
                    className={`text-xs px-2 py-1 rounded transition-colors ${s === selected.status ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-xs text-slate-500 uppercase tracking-wider">{label}</label>
      <p className="text-sm text-slate-200 mt-1">{value || '—'}</p>
    </div>
  );
}
