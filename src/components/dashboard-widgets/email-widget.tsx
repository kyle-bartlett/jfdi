"use client";

interface AccountStats {
  email: string;
  unread: number;
  actionNeeded: number;
}

interface Props {
  unread: number;
  actionNeeded: number;
  accounts?: AccountStats[];
}

function gmailUrl(email: string) {
  return `https://mail.google.com/mail/u/?authuser=${encodeURIComponent(email)}`;
}

export function EmailWidget({ unread, actionNeeded, accounts }: Props) {
  return (
    <div className="widget">
      <h2 className="widget-title">Email</h2>
      {accounts && accounts.length > 0 ? (
        <div className="space-y-3">
          {accounts.map((acct) => (
            <a
              key={acct.email}
              href={gmailUrl(acct.email)}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="text-xs text-muted-foreground group-hover:text-primary truncate mb-1">
                {acct.email}
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="badge badge-primary">{acct.unread}</span>
                  <span className="text-xs text-muted-foreground">unread</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="badge badge-warning">{acct.actionNeeded}</span>
                  <span className="text-xs text-muted-foreground">action</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
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
      )}
      <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
        {unread} total unread across {accounts?.length || 0} account{(accounts?.length || 0) !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
