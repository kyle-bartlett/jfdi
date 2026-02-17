"use client";

interface LarkMessages {
  total: number;
  today: number;
  recent: Array<{ sender: string; text: string; timestamp: string }>;
}

interface Props {
  messages: LarkMessages;
}

export function LarkWidget({ messages }: Props) {
  return (
    <div className="widget">
      <h2 className="widget-title">Lark Messages</h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm">Today</span>
          <span className="badge badge-primary">{messages.today}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">Total</span>
          <span className="badge badge-muted">{messages.total}</span>
        </div>
      </div>
      {messages.recent.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          {messages.recent.slice(0, 3).map((msg, i) => (
            <div key={i} className="text-xs text-muted-foreground">
              <span className="text-foreground">{msg.sender}:</span> {msg.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
