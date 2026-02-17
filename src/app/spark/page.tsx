"use client";

import { useEffect, useState, useCallback } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { TagInput } from "@/components/ui/tag-input";
import { SearchInput } from "@/components/ui/search-input";
import { useToast } from "@/components/ui/toast";

interface SparkEntry {
  id: string;
  content: string;
  tags: string | null;
  connections: string | null;
  created_at: string;
}

export default function SparkPage() {
  const [entries, setEntries] = useState<SparkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  // Quick entry
  const [newSpark, setNewSpark] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);

  // Delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);

  const { toast } = useToast();

  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/spark");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEntries(data);
    } catch {
      toast("Failed to load sparks", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

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

  const parseConnections = (conn: string | null): string[] => {
    if (!conn) return [];
    try {
      return JSON.parse(conn);
    } catch {
      return [];
    }
  };

  // All unique tags
  const allTags = Array.from(
    new Set(entries.flatMap((e) => parseTags(e.tags)))
  ).sort();

  // Filter
  let filtered = entries;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.content.toLowerCase().includes(q) ||
        parseTags(e.tags).some((t) => t.includes(q))
    );
  }
  if (tagFilter) {
    filtered = filtered.filter((e) => parseTags(e.tags).includes(tagFilter));
  }

  // Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpark.trim()) return;
    try {
      const res = await fetch("/api/spark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newSpark,
          tags: newTags.length > 0 ? newTags : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      setNewSpark("");
      setNewTags([]);
      toast("Spark captured");
      await loadEntries();
    } catch {
      toast("Failed to capture spark", "error");
    }
  };

  // Edit
  const startEdit = (entry: SparkEntry) => {
    setEditingId(entry.id);
    setEditContent(entry.content);
    setEditTags(parseTags(entry.tags));
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const res = await fetch(`/api/spark?id=${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent,
          tags: editTags,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditingId(null);
      toast("Spark updated");
      await loadEntries();
    } catch {
      toast("Failed to update spark", "error");
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!confirmTarget) return;
    try {
      await fetch(`/api/spark?id=${confirmTarget}`, { method: "DELETE" });
      setConfirmTarget(null);
      toast("Spark deleted");
      await loadEntries();
    } catch {
      toast("Failed to delete spark", "error");
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Spark File</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {entries.length} ideas captured
        </p>
      </div>

      {/* Quick Entry */}
      <form onSubmit={handleCreate} className="card mb-6 space-y-3">
        <textarea
          className="input"
          placeholder="What's on your mind? Capture it..."
          value={newSpark}
          onChange={(e) => setNewSpark(e.target.value)}
          rows={3}
          required
        />
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <TagInput
              value={newTags}
              onChange={setNewTags}
              placeholder="Tags (optional)"
            />
          </div>
          <button type="submit" className="btn btn-primary whitespace-nowrap">
            Spark It
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search sparks..."
          className="max-w-xs"
        />
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
        <LoadingSkeleton count={5} height="h-24" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="💡"
          title={search || tagFilter ? "No sparks match" : "No sparks yet"}
          description={
            search || tagFilter
              ? "Try adjusting your search or filters"
              : "Capture your first idea above"
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => {
            const tags = parseTags(entry.tags);
            const connections = parseConnections(entry.connections);
            const isEditing = editingId === entry.id;

            return (
              <div key={entry.id} className="card group">
                <div className="flex justify-between items-start">
                  {isEditing ? (
                    <div className="flex-1 space-y-3">
                      <textarea
                        className="input w-full"
                        rows={3}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        autoFocus
                      />
                      <TagInput
                        value={editTags}
                        onChange={setEditTags}
                        placeholder="Tags"
                      />
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="btn btn-primary text-xs">
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="btn btn-secondary text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p
                        className="text-sm whitespace-pre-wrap flex-1 cursor-pointer hover:text-primary"
                        onClick={() => startEdit(entry)}
                        title="Click to edit"
                      >
                        {entry.content}
                      </p>
                      <button
                        onClick={() => {
                          setConfirmTarget(entry.id);
                          setConfirmOpen(true);
                        }}
                        className="text-xs text-muted-foreground hover:text-destructive ml-2 opacity-0 group-hover:opacity-100"
                      >
                        &times;
                      </button>
                    </>
                  )}
                </div>
                {!isEditing && (
                  <>
                    {tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="badge badge-secondary text-[10px] cursor-pointer"
                            onClick={() => setTagFilter(tag)}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {connections.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {connections.map((conn) => (
                          <span
                            key={conn}
                            className="badge badge-accent text-[10px]"
                          >
                            {conn}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground mt-2">
                      {formatDate(entry.created_at)}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm delete */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
        onConfirm={handleDelete}
        title="Delete Spark"
        message="This will permanently delete this spark."
      />
    </div>
  );
}
