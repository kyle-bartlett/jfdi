"use client";

interface Props {
  unread: number;
  actionNeeded: number;
}

export function EmailWidget({ unread, actionNeeded }: Props) {
  return (
    <div className="widget">
      <h2 className="widget-title">Email</h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm">Unread</span>
          <span className="badge badge-primary">{unread}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Action Needed</span>
          <span className="badge badge-warning">{actionNeeded}</span>
        </div>
      </div>
    </div>
  );
}
