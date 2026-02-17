"use client";

import Link from "next/link";

interface RelationshipItem {
  id: string;
  name: string;
  type: string;
  days_since_contact: number | null;
}

interface Props {
  items: RelationshipItem[];
  needsAttention: number;
  total: number;
  onContacted?: (id: string) => void;
}

export function RelationshipsWidget({ items, needsAttention, total, onContacted }: Props) {
  return (
    <div className="widget">
      <div className="flex items-center justify-between mb-3">
        <h2 className="widget-title mb-0">Relationships</h2>
        <Link href="/relationships" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </div>
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.id} className="flex items-center justify-between text-sm group">
              <Link
                href={`/relationships/${r.id}`}
                className="truncate hover:text-primary"
              >
                {r.name}
              </Link>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {r.days_since_contact !== null
                    ? `${r.days_since_contact}d ago`
                    : "Never"}
                </span>
                {onContacted && (
                  <button
                    onClick={() => onContacted(r.id)}
                    className="text-[10px] text-primary hover:underline opacity-0 group-hover:opacity-100"
                    title="Mark as contacted"
                  >
                    Contacted
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">All contacts up to date</p>
      )}
      <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
        {needsAttention} need{needsAttention !== 1 ? "" : "s"} attention of{" "}
        {total} contacts
      </div>
    </div>
  );
}
