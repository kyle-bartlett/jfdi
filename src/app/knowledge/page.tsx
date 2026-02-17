"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSkeletonGrid } from "@/components/ui/loading-skeleton";
import { TagInput } from "@/components/ui/tag-input";
import { SearchInput } from "@/components/ui/search-input";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { useToast } from "@/components/ui/toast";

interface KnowledgeEntry {
  id: string;
  title: string;
  source_url: string | null;
  content_path: string | null;
  content: string | null;
  tags: string | null;
  related_people: string | null;
  created_at: string;
}

type ViewMode = "grid" | "list";

const EMPTY_FORM = {
  title: "",
  source_url: "",
  content: "",
  tags: [] as string[],
};

export default function KnowledgePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<KnowledgeEntry | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  // Delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);

  const { toast } = useToast();

  const loadEntries = useCallback(async () => {
    try {
      const url = search
        ? `/api/knowledge?search=${encodeURIComponent(search)}`
        : "/api/knowledge";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEntries(data);
    } catch {
      toast("Failed to load knowledge entries", "error");
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const parseTags = (tags: string | null): string[] => {
    if (!tags) return [];
    try {
      return JSON.parse(tags);
    } catch {
      return [];
    }
  };

  // All unique tags across entries
  const allTags = Array.from(
    new Set(entries.flatMap((e) => parseTags(e.tags)))
  ).sort();

  // Filter by tag
  let filtered = entries;
  if (tagFilter) {
    filtered = filtered.filter((e) => parseTags(e.tags).includes(tagFilter));
  }

  // Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (!res.ok) throw new Error("Failed to create");
      setCreateForm(EMPTY_FORM);
      setShowCreateForm(false);
      toast("Entry added");
      await loadEntries();
    } catch {
      toast("Failed to create entry", "error");
    }
  };

  // Edit
  const openEditModal = (entry: KnowledgeEntry) => {
    setEditTarget(entry);
    setEditForm({
      title: entry.title,
      source_url: entry.source_url || "",
      content: entry.content || "",
      tags: parseTags(entry.tags),
    });
    setEditModalOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    try {
      const res = await fetch(`/api/knowledge?id=${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditModalOpen(false);
      setEditTarget(null);
      toast("Entry updated");
      await loadEntries();
    } catch {
      toast("Failed to update entry", "error");
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!confirmTarget) return;
    try {
      await fetch(`/api/knowledge?id=${confirmTarget}`, { method: "DELETE" });
      setConfirmTarget(null);
      toast("Entry deleted");
      await loadEntries();
    } catch {
      toast("Failed to delete entry", "error");
    }
  };

  const renderForm = (
    form: typeof EMPTY_FORM,
    setForm: (f: typeof EMPTY_FORM) => void,
    onSubmit: (e: React.FormEvent) => void,
    submitLabel: string,
    onCancel: () => void
  ) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField label="Title" required>
        <input
          className="input"
          placeholder="Entry title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
      </FormField>
      <FormField label="Source URL">
        <input
          className="input"
          type="url"
          placeholder="https://..."
          value={form.source_url}
          onChange={(e) => setForm({ ...form, source_url: e.target.value })}
        />
      </FormField>
      <FormField label="Content">
        <textarea
          className="input"
          rows={6}
          placeholder="Notes, highlights, key takeaways (Markdown supported)..."
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
        />
      </FormField>
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
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {entries.length} entries
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary"
        >
          + New Entry
        </button>
      </div>

      {showCreateForm && (
        <div className="card mb-6">
          <h3 className="text-sm font-semibold mb-4">Add Entry</h3>
          {renderForm(createForm, setCreateForm, handleCreate, "Save Entry", () => {
            setShowCreateForm(false);
            setCreateForm(EMPTY_FORM);
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search title & content..."
          className="max-w-xs"
        />
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-2 py-1.5 rounded text-sm ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-2 py-1.5 rounded text-sm ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            List
          </button>
        </div>
      </div>

      {/* Tag pills */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setTagFilter(null)}
            className={`text-xs px-2 py-1 rounded-full ${!tagFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"}`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className={`text-xs px-2 py-1 rounded-full ${tagFilter === tag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Entries */}
      {loading ? (
        <LoadingSkeletonGrid count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📚"
          title="No entries found"
          description={
            search || tagFilter
              ? "Try adjusting your search or filters"
              : "Start building your knowledge base"
          }
          action={
            !search && !tagFilter
              ? { label: "Add Entry", onClick: () => setShowCreateForm(true) }
              : undefined
          }
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((entry) => {
            const tags = parseTags(entry.tags);
            const expanded = expandedId === entry.id;
            return (
              <div key={entry.id} className="card">
                <div className="flex items-start justify-between mb-1">
                  <h3
                    className="font-medium text-sm cursor-pointer hover:text-primary"
                    onClick={() => openEditModal(entry)}
                  >
                    {entry.title}
                  </h3>
                  <button
                    onClick={() => {
                      setConfirmTarget(entry.id);
                      setConfirmOpen(true);
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive ml-2"
                  >
                    &times;
                  </button>
                </div>
                {entry.source_url && (
                  <a
                    href={entry.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline block truncate mb-1"
                  >
                    {entry.source_url}
                  </a>
                )}
                {entry.content && (
                  <div className="mt-2">
                    {expanded ? (
                      <div>
                        <MarkdownRenderer content={entry.content} />
                        <button
                          onClick={() => setExpandedId(null)}
                          className="text-xs text-primary hover:underline mt-2"
                        >
                          Collapse
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {entry.content}
                        </p>
                        <button
                          onClick={() => setExpandedId(entry.id)}
                          className="text-xs text-primary hover:underline mt-1"
                        >
                          Read more
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="badge badge-primary text-[10px] cursor-pointer"
                        onClick={() => setTagFilter(tag)}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground mt-2">
                  {new Date(entry.created_at).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => {
            const tags = parseTags(entry.tags);
            return (
              <div key={entry.id} className="card flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-medium text-sm cursor-pointer hover:text-primary"
                    onClick={() => openEditModal(entry)}
                  >
                    {entry.title}
                  </h3>
                  {entry.source_url && (
                    <a
                      href={entry.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      {entry.source_url}
                    </a>
                  )}
                  {entry.content && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {entry.content}
                    </p>
                  )}
                  {tags.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="badge badge-primary text-[10px] cursor-pointer"
                          onClick={() => setTagFilter(tag)}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => {
                      setConfirmTarget(entry.id);
                      setConfirmOpen(true);
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive"
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
        title="Edit Entry"
        size="lg"
      >
        {renderForm(editForm, setEditForm, handleEdit, "Save Changes", () => {
          setEditModalOpen(false);
          setEditTarget(null);
        })}
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
        onConfirm={handleDelete}
        title="Delete Entry"
        message="This will permanently delete this knowledge entry."
      />
    </div>
  );
}
