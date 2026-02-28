"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

// Go-to shortcut keys (press 'g' then this key to navigate)
const GO_TO_KEYS: Record<string, string> = {
  "/": "d",
  "/reminders": "r",
  "/projects": "p",
  "/relationships": "l",
  "/meetings": "m",
  "/knowledge": "k",
  "/spark": "s",
  "/goals": "g",
  "/weekly-review": "w",
  "/chat": "c",
  "/ops": "o",
  "/action-queue": "a",
  "/automations": "u",
};

const sections = [
  {
    label: "JFDI",
    items: [
      { href: "/", label: "Dashboard", icon: "📊" },
      { href: "/reminders", label: "Reminders", icon: "🔔" },
      { href: "/projects", label: "Projects", icon: "📁" },
      { href: "/relationships", label: "Relationships", icon: "👥" },
      { href: "/meetings", label: "Meetings", icon: "📅" },
      { href: "/knowledge", label: "Knowledge", icon: "🧠" },
      { href: "/spark", label: "Spark", icon: "⚡" },
      { href: "/goals", label: "Goals", icon: "🎯" },
      { href: "/weekly-review", label: "Weekly Review", icon: "📈" },
      { href: "/chat", label: "Chat", icon: "💬" },
    ],
  },
  {
    label: "OPS",
    items: [
      { href: "/ops", label: "Ops Center", icon: "🏠" },
      { href: "/action-queue", label: "Action Queue", icon: "📥" },
      { href: "/automations", label: "Automations", icon: "🤖" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-16 lg:w-56 flex flex-col border-r border-border bg-secondary z-50">
      {/* Logo */}
      <div className="p-3 lg:p-4 border-b border-border">
        <h1 className="text-lg font-bold hidden lg:block">JFDI</h1>
        <span className="text-lg font-bold lg:hidden text-center block">J</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label}>
            {/* Section label */}
            <div className="px-3 lg:px-4 pt-3 pb-1">
              <span className="hidden lg:block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {section.label}
              </span>
              <span className="lg:hidden text-[8px] font-bold uppercase text-muted-foreground/40 text-center block">
                {section.label}
              </span>
            </div>

            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              const goKey = GO_TO_KEYS[item.href];

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={goKey ? `g → ${goKey}` : undefined}
                  className={`group/nav flex items-center gap-3 px-3 lg:px-4 py-2.5 mx-1 lg:mx-2 rounded-lg transition-colors text-sm ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="hidden lg:inline flex-1">{item.label}</span>
                  {goKey && (
                    <kbd className={`hidden lg:inline-flex opacity-0 group-hover/nav:opacity-100 transition-opacity text-[9px] font-mono px-1 py-0.5 rounded min-w-[16px] text-center ${
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground/70"
                        : "bg-muted text-muted-foreground/50"
                    }`}>
                      {goKey}
                    </kbd>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 lg:p-3 border-t border-border">
        <div className="hidden lg:block mb-2">
          <ThemeToggle />
        </div>
        <button
          onClick={() => {
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true })
            );
          }}
          className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mb-1"
        >
          <span>🔍</span>
          <span className="hidden lg:inline flex-1 text-left">Search</span>
          <kbd className="hidden lg:inline text-[10px] text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded">
            ⌘K
          </kbd>
        </button>
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-[10px] text-muted-foreground/40">
          <kbd className="text-[10px] text-muted-foreground/50 bg-muted px-1 py-0.5 rounded">g</kbd>
          <span>then key to navigate</span>
        </div>
        <Link
          href="/api/auth/google"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <span>🔗</span>
          <span className="hidden lg:inline">Connect Google</span>
        </Link>
      </div>
    </aside>
  );
}
