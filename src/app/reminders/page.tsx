"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useToast } from "@/components/ui/toast";

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  priority: string;
  category: string;
  snoozed_until: string | null;
  created_at: string;
  updated_at: string;
}

type FilterTab = "all" | "overdue" | "today" | "next3" | "thisWeek" | "later" | "completed";

const CATEGORIES = ["work", "personal", "follow-up", "errands", "learning"] as const;
const PRIORITIES = ["high", "medium", "low"] as const;

const CATEGORY_ICONS: Record<string, string> = {
  work: "💼",
  personal: "🏠",
  "follow-up": "📞",
  errands: "🛒",
  learning: "📚",
};

const emptyForm = {
  title: "",
  description: "",
  due_date: "",
  priority: "medium",
  category: "personal",
};

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Reminder | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [snoozeOpenId, setSnoozeOpenId] = useState<string | null>(null);
  const snoozeRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const loadReminders = useCallback(async () => {
    try {
      const r = await fetch("/api/reminders");
      const data = await r.json();
      setReminders(data);
    } catch {
      toast("Failed to load reminders", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadReminders(); }, [loadReminders]);

  // Close snooze dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (snoozeRef.current && !snoozeRef.current.contains(e.target as Node)) {
        setSnoozeOpenId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const createReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setFormData(emptyForm);
      setShowForm(false);
      toast("Reminder created");
      loadReminders();
    } catch {
      toast("Failed to create reminder", "error");
    }
  };

  const updateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReminder) return;
    try {
      await fetch(`/api/reminders?id=${editingReminder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setEditingReminder(null);
      toast("Reminder updated");
      loadReminders();
    } catch {
      toast("Failed to update reminder", "error");
    }
  };

  const completeReminder = async (id: string) => {
    try {
      await fetch(`/api/reminders?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      loadReminders();
    } catch {
      toast("Failed to complete reminder", "error");
    }
  };

  const snoozeReminder = async (id: string, snoozedUntil: Date) => {
    try {
      await fetch(`/api/reminders?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "snoozed", snoozed_until: snoozedUntil.toISOString() }),
      });
      setSnoozeOpenId(null);
      toast(`Snoozed until ${formatRelativeTime(snoozedUntil.toISOString())}`);
      loadReminders();
    } catch {
      toast("Failed to snooze reminder", "error");
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      await fetch(`/api/reminders?id=${id}`, { method: "DELETE" });
      toast("Reminder deleted");
      loadReminders();
    } catch {
      toast("Failed to delete reminder", "error");
    }
  };

  const batchComplete = async () => {
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/reminders?id=${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "completed" }),
          })
        )
      );
      setSelectedIds(new Set());
      toast(`${selectedIds.size} reminders completed`);
      loadReminders();
    } catch {
      toast("Failed to batch complete", "error");
    }
  };

  const batchDelete = async () => {
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/reminders?id=${id}`, { method: "DELETE" })
        )
      );
      setSelectedIds(new Set());
      toast(`${selectedIds.size} reminders deleted`);
      loadReminders();
    } catch {
      toast("Failed to batch delete", "error");
    }
  };

  const openEdit = (reminder: Reminder) => {
    setFormData({
      title: reminder.title,
      description: reminder.description || "",
      due_date: reminder.due_date ? reminder.due_date.slice(0, 16) : "",
      priority: reminder.priority,
      category: reminder.category,
    });
    setEditingReminder(reminder);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredReminders = filterReminders(reminders, activeTab);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: reminders.filter((r) => r.status !== "completed").length },
    { key: "overdue", label: "Overdue", count: filterReminders(reminders, "overdue").length },
    { key: "today", label: "Today", count: filterReminders(reminders, "today").length },
    { key: "next3", label: "Next 3 Days", count: filterReminders(reminders, "next3").length },
    { key: "thisWeek", label: "This Week", count: filterReminders(reminders, "thisWeek").length },
    { key: "later", label: "Later", count: filterReminders(reminders, "later").length },
    { key: "completed", label: "Completed", count: filterReminders(reminders, "completed").length },
  ];

  const getSnoozeOptions = () => {
    const now = new Date();
    const laterToday = new Date(now);
    laterToday.setHours(18, 0, 0, 0);
    if (laterToday <= now) laterToday.setDate(laterToday.getDate() + 1);

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const nextMonday = new Date(now);
    nextMonday.setDate(nextMonday.getDate() + ((8 - nextMonday.getDay()) % 7 || 7));
    nextMonday.setHours(9, 0, 0, 0);

    return [
      { label: "1 Hour", date: new Date(now.getTime() + 60 * 60 * 1000) },
      { label: "Later Today (6 PM)", date: laterToday },
      { label: "Tomorrow (9 AM)", date: tomorrow },
      { label: "Next Week (Mon 9 AM)", date: nextMonday },
    ];
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reminders</h1>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <>
              <button onClick={batchComplete} className="btn btn-secondary text-sm">
                Complete ({selectedIds.size})
              </button>
              <button onClick={batchDelete} className="btn btn-danger text-sm">
                Delete ({selectedIds.size})
              </button>
            </>
          )}
          <button onClick={() => { setFormData(emptyForm); setShowForm(true); }} className="btn btn-primary">
            + New Reminder
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 text-xs opacity-75">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Reminder List */}
      {loading ? (
        <LoadingSkeleton count={5} />
      ) : filteredReminders.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="No reminders here"
          description={activeTab === "all" ? "Create your first reminder to get started." : `No reminders in the "${activeTab}" category.`}
          action={activeTab === "all" ? { label: "+ New Reminder", onClick: () => setShowForm(true) } : undefined}
        />
      ) : (
        <div className="space-y-2">
          {filteredReminders.map((reminder) => (
            <div key={reminder.id} className="card flex items-center gap-3">
              {/* Batch select checkbox */}
              {reminder.status !== "completed" && (
                <input
                  type="checkbox"
                  checked={selectedIds.has(reminder.id)}
                  onChange={() => toggleSelect(reminder.id)}
                  className="w-4 h-4 rounded border-border accent-primary flex-shrink-0"
                />
              )}
              {/* Complete circle */}
              <button
                onClick={() => completeReminder(reminder.id)}
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${
                  reminder.status === "completed"
                    ? "bg-accent border-accent"
                    : "border-border hover:border-primary"
                }`}
                aria-label="Complete"
              />
              {/* Content */}
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => openEdit(reminder)}
              >
                <div className={`text-sm font-medium ${reminder.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                  {reminder.title}
                </div>
                {reminder.description && (
                  <div className="text-xs text-muted-foreground truncate">{reminder.description}</div>
                )}
              </div>
              {/* Meta */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {reminder.due_date && (
                  <span className={`text-xs ${isOverdue(reminder.due_date) && reminder.status !== "completed" ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                    {formatRelativeTime(reminder.due_date)}
                  </span>
                )}
                <span className="text-base" title={reminder.category}>
                  {CATEGORY_ICONS[reminder.category] || "📌"}
                </span>
                <span className={`badge ${getPriorityBadge(reminder.priority)}`}>
                  {reminder.priority}
                </span>
                {/* Snooze dropdown */}
                {reminder.status !== "completed" && (
                  <div className="dropdown" ref={snoozeOpenId === reminder.id ? snoozeRef : undefined}>
                    <button
                      onClick={() => setSnoozeOpenId(snoozeOpenId === reminder.id ? null : reminder.id)}
                      className="text-xs text-muted-foreground hover:text-foreground px-1"
                      title="Snooze"
                    >
                      ⏰
                    </button>
                    {snoozeOpenId === reminder.id && (
                      <div className="dropdown-menu">
                        {getSnoozeOptions().map((opt) => (
                          <button
                            key={opt.label}
                            className="dropdown-item"
                            onClick={() => snoozeReminder(reminder.id, opt.date)}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={() => setDeleteTarget(reminder)}
                  className="text-xs text-muted-foreground hover:text-destructive px-1"
                  aria-label="Delete"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Reminder">
        <form onSubmit={createReminder} className="space-y-4">
          <FormField label="Title" required>
            <input
              className="input"
              placeholder="What do you need to remember?"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              autoFocus
            />
          </FormField>
          <FormField label="Description">
            <textarea
              className="input"
              placeholder="Additional details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </FormField>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Due Date">
              <input
                type="datetime-local"
                className="input"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </FormField>
            <FormField label="Priority">
              <select
                className="input"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Category">
              <select
                className="input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Create</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editingReminder} onClose={() => setEditingReminder(null)} title="Edit Reminder">
        <form onSubmit={updateReminder} className="space-y-4">
          <FormField label="Title" required>
            <input
              className="input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              autoFocus
            />
          </FormField>
          <FormField label="Description">
            <textarea
              className="input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </FormField>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Due Date">
              <input
                type="datetime-local"
                className="input"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </FormField>
            <FormField label="Priority">
              <select
                className="input"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Category">
              <select
                className="input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditingReminder(null)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteReminder(deleteTarget.id)}
        title="Delete Reminder"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
      />
    </div>
  );
}

// --- Helpers ---

function filterReminders(reminders: Reminder[], tab: FilterTab): Reminder[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const in3Days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
  const endOfWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  switch (tab) {
    case "all":
      return reminders.filter((r) => r.status !== "completed");
    case "overdue":
      return reminders.filter((r) => r.status !== "completed" && r.due_date && new Date(r.due_date) < now);
    case "today":
      return reminders.filter((r) => {
        if (r.status === "completed" || !r.due_date) return false;
        const d = new Date(r.due_date);
        return d >= today && d < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      });
    case "next3":
      return reminders.filter((r) => {
        if (r.status === "completed" || !r.due_date) return false;
        const d = new Date(r.due_date);
        return d >= today && d < in3Days;
      });
    case "thisWeek":
      return reminders.filter((r) => {
        if (r.status === "completed" || !r.due_date) return false;
        const d = new Date(r.due_date);
        return d >= today && d < endOfWeek;
      });
    case "later":
      return reminders.filter((r) => {
        if (r.status === "completed") return false;
        return !r.due_date || new Date(r.due_date) >= endOfWeek;
      });
    case "completed":
      return reminders.filter((r) => r.status === "completed");
  }
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);
  const isPast = diffMs < 0;

  if (absDiffMs < 60 * 1000) return "just now";
  if (absDiffMs < 60 * 60 * 1000) {
    const mins = Math.floor(absDiffMs / (60 * 1000));
    return isPast ? `${mins}m ago` : `in ${mins}m`;
  }
  if (absDiffMs < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(absDiffMs / (60 * 60 * 1000));
    return isPast ? `${hours}h ago` : `in ${hours}h`;
  }
  if (absDiffMs < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(absDiffMs / (24 * 60 * 60 * 1000));
    return isPast ? `${days}d ago` : `in ${days}d`;
  }
  return date.toLocaleDateString();
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "high": return "badge-danger";
    case "medium": return "badge-warning";
    case "low": return "badge-muted";
    default: return "badge-muted";
  }
}
