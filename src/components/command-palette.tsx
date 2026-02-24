"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  type: "page" | "reminder" | "project" | "goal" | "relationship" | "meeting";
  title: string;
  subtitle?: string;
  icon: string;
  href: string;
  priority?: string;
}

const PAGES: SearchResult[] = [
  { id: "page-dashboard", type: "page", title: "Dashboard", icon: "📊", href: "/" },
  { id: "page-reminders", type: "page", title: "Reminders", icon: "🔔", href: "/reminders" },
  { id: "page-projects", type: "page", title: "Projects", icon: "📁", href: "/projects" },
  { id: "page-relationships", type: "page", title: "Relationships", icon: "👥", href: "/relationships" },
  { id: "page-meetings", type: "page", title: "Meetings", icon: "📅", href: "/meetings" },
  { id: "page-knowledge", type: "page", title: "Knowledge", icon: "🧠", href: "/knowledge" },
  { id: "page-spark", type: "page", title: "Spark", icon: "⚡", href: "/spark" },
  { id: "page-goals", type: "page", title: "Goals", icon: "🎯", href: "/goals" },
  { id: "page-chat", type: "page", title: "Chat", icon: "💬", href: "/chat" },
  { id: "page-ops", type: "page", title: "Ops Center", icon: "🏠", href: "/ops" },
  { id: "page-action-queue", type: "page", title: "Action Queue", icon: "📥", href: "/action-queue" },
  { id: "page-automations", type: "page", title: "Automations", icon: "🤖", href: "/automations" },
];

// Quick-create command prefixes
const CREATE_COMMANDS: Record<
  string,
  { label: string; icon: string; endpoint: string; bodyKey: string; successMsg: string }
> = {
  "/task": {
    label: "New Task",
    icon: "✏️",
    endpoint: "/api/tasks",
    bodyKey: "title",
    successMsg: "Task created",
  },
  "/reminder": {
    label: "New Reminder",
    icon: "🔔",
    endpoint: "/api/reminders",
    bodyKey: "title",
    successMsg: "Reminder created",
  },
  "/note": {
    label: "Quick Note",
    icon: "📝",
    endpoint: "/api/knowledge",
    bodyKey: "title",
    successMsg: "Note saved",
  },
};

function detectCreateCommand(q: string): { cmd: (typeof CREATE_COMMANDS)[string]; text: string } | null {
  const lower = q.toLowerCase();
  for (const [prefix, cmd] of Object.entries(CREATE_COMMANDS)) {
    if (lower.startsWith(prefix + " ") && q.length > prefix.length + 1) {
      return { cmd, text: q.slice(prefix.length + 1).trim() };
    }
  }
  return null;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // ⌘K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(PAGES);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Search when query changes
  useEffect(() => {
    if (!open) return;

    const q = query.trim().toLowerCase();
    if (!q) {
      setResults(PAGES);
      setSelectedIndex(0);
      return;
    }

    // Show create command hints when user types "/" alone
    if (q === "/") {
      const cmdResults: SearchResult[] = Object.entries(CREATE_COMMANDS).map(([prefix, cmd]) => ({
        id: `cmd-${prefix}`,
        type: "page" as const,
        title: `${prefix} [text]`,
        subtitle: cmd.label,
        icon: cmd.icon,
        href: "#",
      }));
      setResults(cmdResults);
      setSelectedIndex(0);
      return;
    }

    // If a create command is active, don't search — just show the create UI
    if (detectCreateCommand(query)) {
      setResults([]);
      setLoading(false);
      return;
    }

    // Filter pages first
    const pageResults = PAGES.filter(
      (p) => p.title.toLowerCase().includes(q)
    );

    // Then search entities via API
    setLoading(true);
    const controller = new AbortController();

    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data: SearchResult[] = await res.json();
          setResults([...pageResults, ...data]);
        } else {
          setResults(pageResults);
        }
      } catch {
        // Aborted or failed — just show page results
        if (!controller.signal.aborted) {
          setResults(pageResults);
        }
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement;
      if (selected) {
        selected.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
  }, []);

  const navigate = useCallback(
    (result: SearchResult) => {
      close();
      router.push(result.href);
    },
    [close, router]
  );

  const handleQuickCreate = useCallback(async () => {
    const match = detectCreateCommand(query);
    if (!match || !match.text) return;
    setCreating(true);
    try {
      const body: Record<string, string> = { [match.cmd.bodyKey]: match.text };
      // Add sensible defaults
      if (match.cmd.endpoint === "/api/tasks") {
        body.priority = "medium";
        body.status = "todo";
      } else if (match.cmd.endpoint === "/api/reminders") {
        body.priority = "medium";
        body.category = "personal";
      }
      const res = await fetch(match.cmd.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create");
      close();
      // Brief visual feedback via the query itself
      setQuery(`✓ ${match.cmd.successMsg}`);
      setTimeout(close, 600);
    } catch {
      setQuery(`✗ Failed to create`);
      setTimeout(() => setQuery(query), 1500);
    } finally {
      setCreating(false);
    }
  }, [query, close]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        // Check if it's a quick-create command first
        if (detectCreateCommand(query)) {
          handleQuickCreate();
        } else if (results[selectedIndex]) {
          navigate(results[selectedIndex]);
        }
        break;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "page":
        return null;
      case "reminder":
        return "badge-warning";
      case "project":
        return "badge-primary";
      case "goal":
        return "badge-accent";
      case "relationship":
        return "badge-muted";
      case "meeting":
        return "badge-primary";
      default:
        return "badge-muted";
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
        onClick={close}
      />

      {/* Palette */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[101]">
        <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <span className="text-muted-foreground text-sm">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, reminders, projects, goals..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {loading && (
              <span className="text-xs text-muted-foreground animate-pulse">
                ...
              </span>
            )}
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded">
              ESC
            </kbd>
          </div>

          {/* Quick-create preview */}
          {(() => {
            const match = detectCreateCommand(query);
            if (!match) return null;
            return (
              <div className="px-4 py-3 border-b border-border bg-primary/5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{match.cmd.icon}</span>
                  <span className="text-xs font-medium text-primary">{match.cmd.label}</span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="text-sm font-medium truncate">{match.text}</span>
                  <span className="ml-auto">
                    {creating ? (
                      <span className="text-xs text-muted-foreground animate-pulse">Creating...</span>
                    ) : (
                      <kbd className="text-[10px] text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded">↵ Create</kbd>
                    )}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Results */}
          <div ref={listRef} className="max-h-72 overflow-y-auto py-1">
            {results.length === 0 && !detectCreateCommand(query) ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No results found
              </div>
            ) : results.length === 0 ? null : (
              results.map((result, i) => {
                const badge = getTypeBadge(result.type);
                return (
                  <button
                    key={result.id}
                    onClick={() => navigate(result)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      i === selectedIndex
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="text-base flex-shrink-0">{result.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-[11px] text-muted-foreground/70 truncate">
                          {result.subtitle}
                        </div>
                      )}
                    </div>
                    {badge && (
                      <span className={`badge text-[10px] flex-shrink-0 ${badge}`}>
                        {result.type}
                      </span>
                    )}
                    {result.priority && (
                      <span
                        className={`badge text-[10px] flex-shrink-0 ${
                          result.priority === "high"
                            ? "badge-danger"
                            : result.priority === "medium"
                              ? "badge-warning"
                              : "badge-muted"
                        }`}
                      >
                        {result.priority}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[10px] text-muted-foreground/50 flex-wrap">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>ESC Close</span>
            <span className="border-l border-border/50 pl-4">/task · /reminder · /note to quick-create</span>
          </div>
        </div>
      </div>
    </>
  );
}
