'use client';

import { priorityColors } from '@/lib/ops/utils';

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${priorityColors[priority] || priorityColors.P4}`}>
      {priority}
    </span>
  );
}
