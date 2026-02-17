"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { TagInput } from "@/components/ui/tag-input";
import { SearchInput } from "@/components/ui/search-input";
import { useToast } from "@/components/ui/toast";

interface Relationship {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: string;
  priority: string;
  last_contact: string | null;
  contact_frequency_days: number;
  notes: string | null;
  notes_path: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

type SortBy = "last_contact" | "priority" | "name" | "attention";
type TypeFilter = "all" | "close" | "peripheral" | "casual" | "personal" | "professional";

const TYPE_OPTIONS = [
  { value: "close", label: "Close" },
  { value: "peripheral", label: "Peripheral" },
  { value: "casual", label: "Casual" },
  { value: "personal", label: "Personal" },
  { value: "professional", label: "Professional" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
] as const;

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  type: "casual",
  priority: "medium",
  contact_frequency_days: 30,
  tags: [] as string[],
};

export default function RelationshipsPage() {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("attention");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Relationship | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);

  // Contact note modal
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactTarget, setContactTarget] = useState<string | null>(null);
  const [contactType, setContactType] = useState("contact");
  const [contactNote, setContactNote] = useState("");

  const { toast } = useToast();

  const loadRelationships = useCallback(async () => {
    try {
      const res = await fetch("/api/relationships");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRelationships(data);
    } catch {
      toast("Failed to load contacts", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRelationships();
  }, [loadRelationships]);

  const parseTags = (tags: string | null): string[] => {
    if (!tags) return [];
    try {
      return JSON.parse(tags);
    } catch {
      return [];
    }
  };

  const needsAttention = (r: Relationship) => {
    if (!r.last_contact) return true;
    const daysSince = Math.floor(
      (Date.now() - new Date(r.last_contact).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSince > r.contact_frequency_days;
  };

  const daysSince = (dateStr: string) => {
    return Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const days = daysSince(dateStr);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  };

  // Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (!res.ok) throw new Error("Failed to create");
      setCreateForm(EMPTY_FORM);
      setShowCreateForm(false);
      toast("Contact added");
      await loadRelationships();
    } catch {
      toast("Failed to add contact", "error");
    }
  };

  // Edit
  const openEditModal = (r: Relationship) => {
    setEditTarget(r);
    setEditForm({
      name: r.name,
      email: r.email || "",
      phone: r.phone || "",
      type: r.type,
      priority: r.priority,
      contact_frequency_days: r.contact_frequency_days,
      tags: parseTags(r.tags),
    });
    setEditModalOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    try {
      const res = await fetch(`/api/relationships?id=${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditModalOpen(false);
      setEditTarget(null);
      toast("Contact updated");
      await loadRelationships();
    } catch {
      toast("Failed to update contact", "error");
    }
  };

  // Record contact with interaction log
  const openContactModal = (id: string) => {
    setContactTarget(id);
    setContactType("contact");
    setContactNote("");
    setContactModalOpen(true);
  };

  const handleRecordContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactTarget) return;
    try {
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relationship_id: contactTarget,
          type: contactType,
          notes: contactNote || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to record");
      setContactModalOpen(false);
      toast("Contact recorded");
      await loadRelationships();
    } catch {
      toast("Failed to record contact", "error");
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!confirmTarget) return;
    try {
      const res = await fetch(`/api/relationships?id=${confirmTarget}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setConfirmTarget(null);
      toast("Contact deleted");
      await loadRelationships();
    } catch {
      toast("Failed to delete contact", "error");
    }
  };

  // Filter and sort
  let filtered =
    typeFilter === "all"
      ? relationships
      : relationships.filter((r) => r.type === typeFilter);

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.phone?.includes(q) ||
        parseTags(r.tags).some((t) => t.includes(q))
    );
  }

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "priority") {
      const order = { high: 0, medium: 1, low: 2 };
      return (
        (order[a.priority as keyof typeof order] ?? 1) -
        (order[b.priority as keyof typeof order] ?? 1)
      );
    }
    if (sortBy === "attention") {
      const aNeeds = needsAttention(a);
      const bNeeds = needsAttention(b);
      if (aNeeds && !bNeeds) return -1;
      if (!aNeeds && bNeeds) return 1;
      if (!a.last_contact && !b.last_contact) return 0;
      if (!a.last_contact) return -1;
      if (!b.last_contact) return 1;
      return (
        new Date(a.last_contact).getTime() - new Date(b.last_contact).getTime()
      );
    }
    // last_contact
    if (!a.last_contact && !b.last_contact) return 0;
    if (!a.last_contact) return -1;
    if (!b.last_contact) return 1;
    return (
      new Date(a.last_contact).getTime() - new Date(b.last_contact).getTime()
    );
  });

  const attentionCount = relationships.filter(needsAttention).length;

  const renderForm = (
    form: typeof EMPTY_FORM,
    setForm: (f: typeof EMPTY_FORM) => void,
    onSubmit: (e: React.FormEvent) => void,
    submitLabel: string,
    onCancel: () => void
  ) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField label="Name" required>
        <input
          className="input"
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField label="Email">
          <input
            className="input"
            type="email"
            placeholder="email@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </FormField>
        <FormField label="Phone">
          <input
            className="input"
            type="tel"
            placeholder="+1 234 567 8900"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <FormField label="Type">
          <select
            className="input"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Priority">
          <select
            className="input"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Contact frequency (days)">
          <input
            className="input"
            type="number"
            min={1}
            value={form.contact_frequency_days}
            onChange={(e) =>
              setForm({
                ...form,
                contact_frequency_days: parseInt(e.target.value) || 30,
              })
            }
          />
        </FormField>
      </div>

      <FormField label="Tags">
        <TagInput
          value={form.tags}
          onChange={(tags) => setForm({ ...form, tags })}
          placeholder="Add tags (press Enter)"
        />
      </FormField>

      <div className="flex gap-2 pt-2">
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Relationships</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {relationships.length} contacts
            {attentionCount > 0 && (
              <span className="text-warning ml-2">
                {attentionCount} need{attentionCount === 1 ? "s" : ""} attention
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary"
        >
          + New Contact
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="card mb-6">
          <h3 className="text-sm font-semibold mb-4">Add Contact</h3>
          {renderForm(
            createForm,
            setCreateForm,
            handleCreate,
            "Add Contact",
            () => {
              setShowCreateForm(false);
              setCreateForm(EMPTY_FORM);
            }
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search contacts..."
          className="max-w-xs"
        />
        <select
          className="input max-w-[150px]"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
        >
          <option value="all">All Types</option>
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          className="input max-w-[170px]"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
        >
          <option value="attention">Needs Attention</option>
          <option value="last_contact">Last Contact</option>
          <option value="priority">Priority</option>
          <option value="name">Name</option>
        </select>
      </div>

      {/* Contact list */}
      {loading ? (
        <LoadingSkeleton count={6} height="h-20" />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No contacts found"
          description={
            search || typeFilter !== "all"
              ? "Try adjusting your filters"
              : "Add your first contact to start managing relationships"
          }
          action={
            !search && typeFilter === "all"
              ? { label: "Add Contact", onClick: () => setShowCreateForm(true) }
              : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {sorted.map((r) => {
            const attention = needsAttention(r);
            const tags = parseTags(r.tags);
            return (
              <div
                key={r.id}
                className={`card flex items-start gap-3 ${attention ? "border-warning" : ""}`}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {r.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Link
                      href={`/relationships/${r.id}`}
                      className="font-medium text-sm hover:text-primary hover:underline truncate"
                    >
                      {r.name}
                    </Link>
                    <span className={`badge text-[10px] ${getTypeBadge(r.type)}`}>
                      {r.type}
                    </span>
                    {r.priority === "high" && (
                      <span className="badge badge-warning text-[10px]">High</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.email && <span>{r.email}</span>}
                    {r.email && r.phone && <span> &middot; </span>}
                    {r.phone && <span>{r.phone}</span>}
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {attention && (
                    <span className="badge badge-warning text-[10px]">
                      Overdue
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(r.last_contact)}
                  </span>
                  <button
                    onClick={() => openContactModal(r.id)}
                    className="btn btn-secondary text-xs py-1 px-2"
                    title="Record contact"
                  >
                    Contacted
                  </button>
                  <button
                    onClick={() => openEditModal(r)}
                    className="text-xs text-muted-foreground hover:text-primary px-1"
                    title="Edit"
                  >
                    &#9998;
                  </button>
                  <button
                    onClick={() => {
                      setConfirmTarget(r.id);
                      setConfirmOpen(true);
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive px-1"
                    title="Delete"
                  >
                    &times;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit modal */}
      <Modal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditTarget(null);
        }}
        title="Edit Contact"
      >
        {renderForm(
          editForm,
          setEditForm,
          handleEdit,
          "Save Changes",
          () => {
            setEditModalOpen(false);
            setEditTarget(null);
          }
        )}
      </Modal>

      {/* Record contact modal */}
      <Modal
        open={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        title="Record Contact"
        size="sm"
      >
        <form onSubmit={handleRecordContact} className="space-y-4">
          <FormField label="Type">
            <select
              className="input"
              value={contactType}
              onChange={(e) => setContactType(e.target.value)}
            >
              <option value="contact">General Contact</option>
              <option value="meeting">Meeting</option>
              <option value="email">Email</option>
              <option value="call">Phone Call</option>
            </select>
          </FormField>
          <FormField label="Notes (optional)">
            <textarea
              className="input"
              rows={3}
              placeholder="What did you discuss?"
              value={contactNote}
              onChange={(e) => setContactNote(e.target.value)}
            />
          </FormField>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn btn-primary">
              Record
            </button>
            <button
              type="button"
              onClick={() => setContactModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
        onConfirm={handleDelete}
        title="Delete Contact"
        message="This will permanently delete this contact and cannot be undone."
      />
    </div>
  );
}

function getTypeBadge(type: string) {
  switch (type) {
    case "close":
      return "badge-accent";
    case "peripheral":
      return "badge-primary";
    case "casual":
      return "badge-muted";
    case "personal":
      return "badge-secondary";
    case "professional":
      return "badge-primary";
    default:
      return "badge-muted";
  }
}
