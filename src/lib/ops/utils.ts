export const priorityColors: Record<string, string> = {
  P0: 'bg-red-500/20 text-red-400 border-red-500/30',
  P1: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  P2: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  P3: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  P4: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export const priorityDots: Record<string, string> = {
  P0: 'bg-red-500',
  P1: 'bg-orange-500',
  P2: 'bg-yellow-500',
  P3: 'bg-blue-500',
  P4: 'bg-gray-500',
};

export const agentColors: Record<string, string> = {
  Stack: 'bg-violet-500/20 text-violet-400',
  Pulse: 'bg-pink-500/20 text-pink-400',
  Scout: 'bg-emerald-500/20 text-emerald-400',
  Reach: 'bg-cyan-500/20 text-cyan-400',
  Bridge: 'bg-amber-500/20 text-amber-400',
  Forge: 'bg-orange-500/20 text-orange-400',
  Wire: 'bg-sky-500/20 text-sky-400',
  Knox: 'bg-blue-500/20 text-blue-400',
  Kyle: 'bg-green-500/20 text-green-400',
  System: 'bg-slate-500/20 text-slate-400',
  Cron: 'bg-indigo-500/20 text-indigo-400',
};

export const statusIcons: Record<string, string> = {
  Queued: '⏳',
  Running: '🔄',
  Completed: '✅',
  Failed: '❌',
};

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
}
