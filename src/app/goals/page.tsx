"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Modal } from "@/components/ui/modal";
import { FormField } from "@/components/ui/form-field";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  target_percentage: number;
  current_percentage: number;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
  updated_at: string;
}

const categories = ["all", "work", "personal", "health", "learning"] as const;

const categoryColor: Record<string, string> = {
  work: "badge-primary",
  personal: "badge-secondary",
  health: "badge-accent",
  learning: "badge-warning",
};

const categoryIcon: Record<string, string> = {
  work: "briefcase",
  personal: "user",
  health: "heart",
  learning: "book-open",
};

const defaultForm = {
  title: "",
  description: "",
  category: "personal",
  target_percentage: 100,
  current_percentage: 0,
  period_start: "",
  period_end: "",
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const { toast } = useToast();

  const loadGoals = useCallback(async () => {
    try {
      const res = await fetch("/api/goals");
      const json = await res.json();
      setGoals(json);
    } catch {
      toast("Failed to load goals", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const payload = {
      ...form,
      period_start: form.period_start || null,
      period_end: form.period_end || null,
    };

    try {
      if (editingId) {
        await fetch(`/api/goals?id=${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        toast("Goal updated");
      } else {
        await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        toast("Goal created");
      }
      resetForm();
      await loadGoals();
    } catch {
      toast("Failed to save goal", "error");
    }
  };

  const startEdit = (g: Goal) => {
    setForm({
      title: g.title,
      description: g.description || "",
      category: g.category,
      target_percentage: g.target_percentage,
      current_percentage: g.current_percentage,
      period_start: g.period_start || "",
      period_end: g.period_end || "",
    });
    setEditingId(g.id);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/goals?id=${deleteTarget.id}`, { method: "DELETE" });
      toast("Goal deleted");
      await loadGoals();
    } catch {
      toast("Failed to delete goal", "error");
    }
    setDeleteTarget(null);
  };

  const updateProgress = async (id: string, current_percentage: number) => {
    try {
      await fetch(`/api/goals?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_percentage }),
      });
      toast(`Progress updated to ${current_percentage}%`);
      await loadGoals();
    } catch {
      toast("Failed to update progress", "error");
    }
  };

  const filtered = filter === "all" ? goals : goals.filter((g) => g.category === filter);

  const stats = {
    total: goals.length,
    onTrack: goals.filter((g) => {
      const pct = g.target_percentage > 0 ? (g.current_percentage / g.target_percentage) * 100 : 0;
      return pct >= 50;
    }).length,
    completed: goals.filter((g) => g.current_percentage >= g.target_percentage).length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Goals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.onTrack} of {stats.total} on track
            {stats.completed > 0 && ` \u00B7 ${stats.completed} completed`}
          </p>
        </div>
        <button
          onClick={() => {
            setForm(defaultForm);
            setEditingId(null);
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          New Goal
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              filter === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Goals List */}
      {loading ? (
        <LoadingSkeleton count={4} height="h-28" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={filter !== "all" ? categoryIcon[filter] || "target" : "target"}
          title={filter !== "all" ? `No ${filter} goals yet` : "No goals yet"}
          description="Set goals to track your progress across different areas of your life."
          action={{
            label: "Create a Goal",
            onClick: () => {
              setForm({ ...defaultForm, category: filter !== "all" ? filter : "personal" });
              setEditingId(null);
              setShowModal(true);
            },
          }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((g) => {
            const pct =
              g.target_percentage > 0
                ? Math.round((g.current_percentage / g.target_percentage) * 100)
                : 0;
            return (
              <div key={g.id} className="card">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{g.title}</h3>
                      <span className={`badge ${categoryColor[g.category] || "badge-muted"}`}>
                        {g.category}
                      </span>
                    </div>
                    {g.description && (
                      <p className="text-sm text-muted-foreground">{g.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <button
                      onClick={() => startEdit(g)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: g.id, title: g.title })}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>
                      {g.current_percentage}% of {g.target_percentage}%
                    </span>
                    <span
                      className={
                        pct >= 75
                          ? "text-accent"
                          : pct >= 40
                            ? "text-warning"
                            : "text-destructive"
                      }
                    >
                      {pct}% complete
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct >= 75
                          ? "bg-accent"
                          : pct >= 40
                            ? "bg-warning"
                            : "bg-destructive"
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Quick progress buttons */}
                <div className="flex gap-2 mt-3">
                  {[10, 25, 50, 75, 100].map((val) => (
                    <button
                      key={val}
                      onClick={() => updateProgress(g.id, val)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        g.current_percentage === val
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>

                {/* Period */}
                {(g.period_start || g.period_end) && (
                  <div className="text-xs text-muted-foreground mt-2">
                    {g.period_start && `From ${g.period_start}`}{" "}
                    {g.period_end && `to ${g.period_end}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={resetForm}
        title={editingId ? "Edit Goal" : "New Goal"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Title" required>
            <input
              className="input"
              placeholder="Goal title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              autoFocus
            />
          </FormField>

          <FormField label="Description">
            <textarea
              className="input"
              placeholder="What does achieving this goal look like?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
          </FormField>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <FormField label="Category">
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="health">Health</option>
                <option value="learning">Learning</option>
              </select>
            </FormField>

            <FormField label="Target %">
              <input
                type="number"
                className="input"
                value={form.target_percentage}
                onChange={(e) =>
                  setForm({ ...form, target_percentage: Number(e.target.value) })
                }
                min={1}
                max={100}
              />
            </FormField>

            <FormField label="Current %">
              <input
                type="number"
                className="input"
                value={form.current_percentage}
                onChange={(e) =>
                  setForm({ ...form, current_percentage: Number(e.target.value) })
                }
                min={0}
                max={100}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Start Date">
              <input
                type="date"
                className="input"
                value={form.period_start}
                onChange={(e) => setForm({ ...form, period_start: e.target.value })}
              />
            </FormField>

            <FormField label="End Date">
              <input
                type="date"
                className="input"
                value={form.period_end}
                onChange={(e) => setForm({ ...form, period_end: e.target.value })}
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={resetForm} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingId ? "Update" : "Create"} Goal
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Goal"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
      />
    </div>
  );
}
