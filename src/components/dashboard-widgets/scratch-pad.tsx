"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface ScratchNote {
  id: string;
  text: string;
  createdAt: string;
  pinned: boolean;
  color: string;
}

const COLORS = [
  { name: "default", bg: "bg-card", border: "border-border" },
  { name: "blue", bg: "bg-primary/5", border: "border-primary/20" },
  { name: "green", bg: "bg-accent/5", border: "border-accent/20" },
  { name: "amber", bg: "bg-warning/5", border: "border-warning/20" },
  { name: "red", bg: "bg-destructive/5", border: "border-destructive/20" },
];

const STORAGE_KEY = "jfdi-scratch-notes";

function loadNotes(): ScratchNote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: ScratchNote[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ScratchPad() {
  const [notes, setNotes] = useState<ScratchNote[]>([]);
  const [newText, setNewText] = useState("");
  const [expanded, setExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [selectedColor, setSelectedColor] = useState("default");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [clearAnimation, setClearAnimation] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (notes.length > 0 || localStorage.getItem(STORAGE_KEY)) {
      saveNotes(notes);
    }
  }, [notes]);

  // Focus edit textarea
  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
      editRef.current.selectionStart = editRef.current.value.length;
    }
  }, [editingId]);

  // Close color picker on outside click
  useEffect(() => {
    if (!showColorPicker) return;
    const handler = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showColorPicker]);

  const addNote = useCallback(() => {
    const text = newText.trim();
    if (!text) return;
    const note: ScratchNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text,
      createdAt: new Date().toISOString(),
      pinned: false,
      color: selectedColor,
    };
    setNotes((prev) => [note, ...prev]);
    setNewText("");
    setSelectedColor("default");
    inputRef.current?.focus();
  }, [newText, selectedColor]);

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const togglePin = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
    );
  };

  const startEdit = (note: ScratchNote) => {
    setEditingId(note.id);
    setEditText(note.text);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const text = editText.trim();
    if (!text) {
      deleteNote(editingId);
    } else {
      setNotes((prev) =>
        prev.map((n) => (n.id === editingId ? { ...n, text } : n))
      );
    }
    setEditingId(null);
    setEditText("");
  };

  const clearAll = () => {
    if (notes.filter((n) => !n.pinned).length === 0) return;
    setClearAnimation(true);
    setTimeout(() => {
      setNotes((prev) => prev.filter((n) => n.pinned));
      setClearAnimation(false);
    }, 400);
  };

  // Sort: pinned first, then by date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getColorStyle = (colorName: string) =>
    COLORS.find((c) => c.name === colorName) || COLORS[0];

  const unpinnedCount = notes.filter((n) => !n.pinned).length;

  return (
    <div className="widget">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 hover:text-foreground transition-colors"
        >
          <h2 className="widget-title mb-0">📝 Scratch Pad</h2>
          <span className="text-xs text-muted-foreground/60">
            {expanded ? "▾" : "▸"}
          </span>
        </button>
        <div className="flex items-center gap-2">
          {notes.length > 0 && (
            <span className="text-[10px] text-muted-foreground/60">
              {notes.length} note{notes.length !== 1 ? "s" : ""}
            </span>
          )}
          {unpinnedCount > 0 && (
            <button
              onClick={clearAll}
              className="text-[10px] text-destructive/60 hover:text-destructive transition-colors"
              title="Clear unpinned notes"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className={`space-y-3 ${clearAnimation ? "animate-fade-out" : ""}`}>
          {/* Input area */}
          <div className="relative">
            <textarea
              ref={inputRef}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  addNote();
                }
              }}
              placeholder="Jot something down... (⌘+Enter to save)"
              className="w-full text-sm bg-secondary/50 border border-border rounded-lg px-3 py-2 pr-20 placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 resize-none min-h-[60px] transition-colors"
              rows={2}
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              {/* Color picker */}
              <div ref={colorRef} className="relative">
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className={`w-5 h-5 rounded-full border-2 transition-all hover:scale-110 ${
                    getColorStyle(selectedColor).bg
                  } ${getColorStyle(selectedColor).border}`}
                  title="Note color"
                />
                {showColorPicker && (
                  <div className="absolute bottom-7 right-0 bg-popover border border-border rounded-lg shadow-lg p-2 flex gap-1.5 z-10">
                    {COLORS.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => {
                          setSelectedColor(c.name);
                          setShowColorPicker(false);
                        }}
                        className={`w-5 h-5 rounded-full border-2 transition-all hover:scale-110 ${c.bg} ${c.border} ${
                          selectedColor === c.name ? "ring-2 ring-ring ring-offset-1 ring-offset-background" : ""
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={addNote}
                disabled={!newText.trim()}
                className="text-xs font-medium text-primary hover:text-primary/80 disabled:text-muted-foreground/30 transition-colors px-2 py-1 rounded hover:bg-primary/10"
              >
                Save
              </button>
            </div>
          </div>

          {/* Notes list */}
          {sortedNotes.length > 0 && (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {sortedNotes.map((note) => {
                const colorStyle = getColorStyle(note.color);
                const isEditing = editingId === note.id;

                return (
                  <div
                    key={note.id}
                    className={`group relative rounded-lg border p-3 transition-all ${colorStyle.bg} ${colorStyle.border} ${
                      note.pinned ? "ring-1 ring-warning/20" : ""
                    } ${clearAnimation && !note.pinned ? "opacity-0 scale-95 translate-y-2" : ""}`}
                    style={{
                      transition: clearAnimation ? "all 0.3s ease-out" : undefined,
                      transitionDelay: clearAnimation
                        ? `${sortedNotes.indexOf(note) * 50}ms`
                        : undefined,
                    }}
                  >
                    {isEditing ? (
                      <textarea
                        ref={editRef}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            saveEdit();
                          }
                          if (e.key === "Escape") {
                            setEditingId(null);
                            setEditText("");
                          }
                        }}
                        onBlur={saveEdit}
                        className="w-full text-sm bg-transparent border-none focus:outline-none resize-none min-h-[40px]"
                        rows={2}
                      />
                    ) : (
                      <div
                        className="text-sm text-foreground whitespace-pre-wrap cursor-pointer"
                        onClick={() => startEdit(note)}
                      >
                        {note.text}
                      </div>
                    )}

                    {/* Metadata + actions */}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-muted-foreground/50">
                        {timeAgo(note.createdAt)}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(note.id);
                          }}
                          className={`w-5 h-5 rounded flex items-center justify-center text-[11px] transition-colors ${
                            note.pinned
                              ? "text-warning"
                              : "text-muted-foreground/40 hover:text-warning"
                          }`}
                          title={note.pinned ? "Unpin" : "Pin"}
                        >
                          📌
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNote(note.id);
                          }}
                          className="w-5 h-5 rounded flex items-center justify-center text-[11px] text-muted-foreground/40 hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty state */}
          {sortedNotes.length === 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground/40">
              <p>No notes yet. Start typing above!</p>
              <p className="text-[10px] mt-1">Notes persist across sessions</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
