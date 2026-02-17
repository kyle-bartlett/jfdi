"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/reminders", label: "Reminders", icon: "🔔" },
  { href: "/projects", label: "Projects", icon: "📁" },
  { href: "/relationships", label: "Relationships", icon: "👥" },
  { href: "/meetings", label: "Meetings", icon: "📅" },
  { href: "/knowledge", label: "Knowledge", icon: "🧠" },
  { href: "/spark", label: "Spark", icon: "⚡" },
  { href: "/goals", label: "Goals", icon: "🎯" },
  { href: "/chat", label: "Chat", icon: "💬", shortcut: "⌘K" },
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
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 lg:px-4 py-2.5 mx-1 lg:mx-2 rounded-lg transition-colors text-sm ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="hidden lg:inline flex-1">{item.label}</span>
              {"shortcut" in item && item.shortcut && (
                <span className="hidden lg:inline text-[10px] text-muted-foreground/60">
                  {item.shortcut}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 lg:p-3 border-t border-border">
        <div className="hidden lg:block mb-2">
          <ThemeToggle />
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
