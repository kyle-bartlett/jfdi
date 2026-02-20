'use client';

import { useState } from 'react';

interface QuickAddProps {
  placeholder: string;
  onAdd: (title: string) => void;
}

export function QuickAdd({ placeholder, onAdd }: QuickAddProps) {
  const [value, setValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    if (value.trim()) {
      onAdd(value.trim());
      setValue('');
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg border border-dashed border-slate-700 hover:border-slate-500 transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {placeholder}
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') setIsOpen(false); }}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 text-sm bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
      />
      <button onClick={handleSubmit} className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
        Add
      </button>
      <button onClick={() => setIsOpen(false)} className="px-3 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
        ✕
      </button>
    </div>
  );
}
