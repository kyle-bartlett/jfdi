"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { TagInput } from "@/components/ui/tag-input";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
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

interface Interaction {
  id: string;
  relationship_id: string;
  type: string;
  notes: string | null;
  created_at: string;
}

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

const INTERACTION_ICONS: Record<string, string> = {
  contact: "💬",
  meeting: "🤝",
  email: "📧",
  call: "📞",
};

export default function RelationshipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();

  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Notes editing
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");

  // Tags editing
  const [editingTags, setEditingTags] = useState(false);
  const [tagsValue, setTagsValue] = useState<string[]>([]);

  // Contact modal
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactType, setContactType] = useState("contact");
  const [contactNote, setContactNote] = useState("");

  // Delete interaction
  const [deleteInteractionOpen, setDeleteInteractionOpen] = useState(false);
  const [deleteInteractionTarget, setDeleteInteractionTarget] = useState<string | null>(null);

  // Delete contact
  const [deleteContactOpen, setDeleteContactOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [relRes, intRes] = await Promise.all([
        fetch(`/api/relationships?id=${id}`),
        fetch(`/api/interactions?relationship_id=${id}`),
      ]);
      if (!relRes.ok) throw new Error("Not found");
      const relData = await relRes.json();
      const intData = await intRes.json();
      setRelationship(relData);
      setInteractions(intData);
    } catch {
      toast("Failed to load contact", "error");
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const parseTags = (tags: string | null): string[] => {
    if (!tags) return [];
    try {
      return JSON.parse(tags);
    } catch {
      return [];
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const daysSince = (dateStr: string | null) => {
    if (!dateStr) return null;
    return Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const needsAttention = () => {
    if (!relationship) return false;
    if (!relationship.last_contact) return true;
    const days = daysSince(relationship.last_contact);
    return days !== null && days > relationship.contact_frequency_days;
  };

  // Inline field editing
  const startEditField = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const saveField = async (field: string) => {
    if (!relationship) return;
    try {
      const res = await fetch(`/api/relationships?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: editValue }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditingField(null);
      toast("Updated");
      await loadData();
    } catch {
      toast("Failed to update", "error");
    }
  };

  const saveSelect = async (field: string, value: string) => {
    try {
      const res = await fetch(`/api/relationships?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast("Updated");
      await loadData();
    } catch {
      toast("Failed to update", "error");
    }
  };

  // Notes editing
  const startEditNotes = () => {
    setNotesValue(relationship?.notes || "");
    setEditingNotes(true);
  };

  const saveNotes = async () => {
    try {
      const res = await fetch(`/api/relationships?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesValue || null }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditingNotes(false);
      toast("Notes saved");
      await loadData();
    } catch {
      toast("Failed to save notes", "error");
    }
  };

  // Tags editing
  const startEditTags = () => {
    setTagsValue(parseTags(relationship?.tags ?? null));
    setEditingTags(true);
  };

  const saveTags = async () => {
    try {
      const res = await fetch(`/api/relationships?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: tagsValue }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditingTags(false);
      toast("Tags saved");
      await loadData();
    } catch {
      toast("Failed to save tags", "error");
    }
  };

  // Record contact
  const handleRecordContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          relationship_id: id,
          type: contactType,
          notes: contactNote || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to record");
      setContactModalOpen(false);
      setContactType("contact");
      setContactNote("");
      toast("Contact recorded");
      await loadData();
    } catch {
      toast("Failed to record contact", "error");
    }
  };

  // Delete interaction
  const handleDeleteInteraction = async () => {
    if (!deleteInteractionTarget) return;
    try {
      const res = await fetch(
        `/api/interactions?id=${deleteInteractionTarget}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete");
      setDeleteInteractionTarget(null);
      toast("Interaction removed");
      await loadData();
    } catch {
      toast("Failed to delete interaction", "error");
    }
  };

  // Delete contact
  const handleDeleteContact = async () => {
    try {
      const res = await fetch(`/api/relationships?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast("Contact deleted");
      router.push("/relationships");
    } catch {
      toast("Failed to delete contact", "error");
    }
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <div className="card animate-pulse h-8 w-48 mb-2" />
          <div className="card animate-pulse h-4 w-32" />
        </div>
        <LoadingSkeleton count={3} height="h-24" />
      </div>
    );
  }

  if (!relationship) {
    return (
      <EmptyState
        icon="❌"
        title="Contact not found"
        description="This contact may have been deleted"
        action={{ label: "Back to Contacts", onClick: () => router.push("/relationships") }}
      />
    );
  }

  const tags = parseTags(relationship.tags);
  const lastContactDays = daysSince(relationship.last_contact);
  const attention = needsAttention();

  const renderEditableField = (
    field: string,
    label: string,
    currentValue: string | null,
    type: "text" | "email" | "tel" | "number" = "text"
  ) => (
    <div className="flex items-center justify-between py-2 border-b border-border">
      <span className="text-sm text-muted-foreground">{label}</span>
      {editingField === field ? (
        <div className="flex items-center gap-2">
          <input
            className="input text-sm py-1 px-2 w-48"
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveField(field);
              if (e.key === "Escape") setEditingField(null);
            }}
            autoFocus
          />
          <button
            onClick={() => saveField(field)}
            className="text-xs text-primary hover:underline"
          >
            Save
          </button>
          <button
            onClick={() => setEditingField(null)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      ) : (
        <span
          className="text-sm cursor-pointer hover:text-primary"
          onClick={() => startEditField(field, currentValue || "")}
          title="Click to edit"
        >
          {currentValue || <span className="text-muted-foreground italic">Not set</span>}
        </span>
      )}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/relationships"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            &larr; Contacts
          </Link>
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold flex-shrink-0">
            {relationship.name.charAt(0).toUpperCase()}
          </div>
          <div>
            {editingField === "name" ? (
              <div className="flex items-center gap-2">
                <input
                  className="input text-lg font-bold py-1 px-2"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveField("name");
                    if (e.key === "Escape") setEditingField(null);
                  }}
                  autoFocus
                />
                <button
                  onClick={() => saveField("name")}
                  className="text-xs text-primary"
                >
                  Save
                </button>
              </div>
            ) : (
              <h1
                className="text-2xl font-bold cursor-pointer hover:text-primary"
                onClick={() => startEditField("name", relationship.name)}
                title="Click to edit"
              >
                {relationship.name}
              </h1>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge text-xs ${getTypeBadge(relationship.type)}`}>
                {relationship.type}
              </span>
              {relationship.priority === "high" && (
                <span className="badge badge-warning text-xs">High Priority</span>
              )}
              {attention && (
                <span className="badge badge-warning text-xs">Needs Attention</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setContactType("contact");
              setContactNote("");
              setContactModalOpen(true);
            }}
            className="btn btn-primary text-sm"
          >
            Record Contact
          </button>
          <button
            onClick={() => setDeleteContactOpen(true)}
            className="btn btn-secondary text-sm text-destructive"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Contact info + Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact info */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Contact Information</h3>
            {renderEditableField("email", "Email", relationship.email, "email")}
            {renderEditableField("phone", "Phone", relationship.phone, "tel")}
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Type</span>
              <select
                className="input text-sm py-1 px-2 w-48"
                value={relationship.type}
                onChange={(e) => saveSelect("type", e.target.value)}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Priority</span>
              <select
                className="input text-sm py-1 px-2 w-48"
                value={relationship.priority}
                onChange={(e) => saveSelect("priority", e.target.value)}
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {renderEditableField(
              "contact_frequency_days",
              "Contact every (days)",
              String(relationship.contact_frequency_days),
              "number"
            )}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Last Contact</span>
              <span className="text-sm">
                {relationship.last_contact
                  ? `${formatDate(relationship.last_contact)} (${lastContactDays}d ago)`
                  : "Never"}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Notes</h3>
              {editingNotes ? (
                <div className="flex gap-2">
                  <button onClick={saveNotes} className="text-xs text-primary hover:underline">
                    Save
                  </button>
                  <button
                    onClick={() => setEditingNotes(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={startEditNotes}
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  {relationship.notes ? "Edit" : "Add Notes"}
                </button>
              )}
            </div>
            {editingNotes ? (
              <textarea
                className="input w-full"
                rows={12}
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Write notes about this person (supports Markdown)..."
                autoFocus
              />
            ) : relationship.notes ? (
              <MarkdownRenderer content={relationship.notes} />
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No notes yet. Click &quot;Add Notes&quot; to start writing.
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Tags</h3>
              {editingTags ? (
                <div className="flex gap-2">
                  <button onClick={saveTags} className="text-xs text-primary hover:underline">
                    Save
                  </button>
                  <button
                    onClick={() => setEditingTags(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={startEditTags}
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  {tags.length > 0 ? "Edit Tags" : "Add Tags"}
                </button>
              )}
            </div>
            {editingTags ? (
              <TagInput
                value={tagsValue}
                onChange={setTagsValue}
                placeholder="Add tags (press Enter)"
              />
            ) : tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="badge badge-primary">
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No tags</p>
            )}
          </div>
        </div>

        {/* Right column — Interaction history */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Overview</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Interactions</span>
                <span className="font-medium">{interactions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Added</span>
                <span>{formatDate(relationship.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{formatDate(relationship.updated_at)}</span>
              </div>
            </div>
          </div>

          {/* Interaction timeline */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Contact History</h3>
              <button
                onClick={() => {
                  setContactType("contact");
                  setContactNote("");
                  setContactModalOpen(true);
                }}
                className="text-xs text-primary hover:underline"
              >
                + Add
              </button>
            </div>
            {interactions.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-4">
                No interactions recorded yet
              </p>
            ) : (
              <div className="space-y-3">
                {[...interactions].reverse().map((int) => (
                  <div key={int.id} className="flex gap-3 group">
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {INTERACTION_ICONS[int.type] || "💬"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium capitalize">
                          {int.type}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDateTime(int.created_at)}
                        </span>
                        <button
                          onClick={() => {
                            setDeleteInteractionTarget(int.id);
                            setDeleteInteractionOpen(true);
                          }}
                          className="text-[10px] text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 ml-auto"
                        >
                          &times;
                        </button>
                      </div>
                      {int.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {int.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

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

      {/* Confirm delete interaction */}
      <ConfirmDialog
        open={deleteInteractionOpen}
        onClose={() => {
          setDeleteInteractionOpen(false);
          setDeleteInteractionTarget(null);
        }}
        onConfirm={handleDeleteInteraction}
        title="Delete Interaction"
        message="Remove this interaction from the history?"
      />

      {/* Confirm delete contact */}
      <ConfirmDialog
        open={deleteContactOpen}
        onClose={() => setDeleteContactOpen(false)}
        onConfirm={handleDeleteContact}
        title="Delete Contact"
        message="This will permanently delete this contact and all interaction history."
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
