"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { TagInput } from "@/components/ui/tag-input";
import { useToast } from "@/components/ui/toast";

interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  priority: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  space: string;
  status: string;
  priority: string;
  progress: number;
  tags: string | null;
  created_at: string;
  updated_at: string;
  tasks?: Task[];
  // Task summary counts (from API join)
  task_total?: number;
  task_done?: number;
  task_in_progress?: number;
  task_overdue?: number;
}

type ViewLevel = "life" | "projects" | "now";
type SpaceFilter = "all" | "anker" | "personal" | "bartlett-labs";

const SPACES = ["anker", "personal", "bartlett-labs"] as const;
const STATUSES = ["active-focus", "on-deck", "growing", "on-hold", "completed"] as const;
const PRIORITIES = ["high", "medium", "low"] as const;

const emptyProjectForm = {
  name: "",
  description: "",
  space: "personal",
  status: "active-focus",
  priority: "medium",
  tags: [] as string[],
};

const emptyTaskForm = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  due_date: "",
};

const STATUS_LABELS: Record<string, { label: string; icon: string }> = {
  "active-focus": { label: "Active Focus", icon: "🔥" },
  "on-deck": { label: "On Deck", icon: "📋" },
  "growing": { label: "Growing", icon: "🌱" },
  "on-hold": { label: "On Hold", icon: "⏸" },
  "completed": { label: "Completed", icon: "✅" },
};

// Project switcher — jump between projects at ground level without going back
function ProjectSwitcher({
  projects,
  currentId,
  onSwitch,
  externalOpen,
  onOpenChange,
}: {
  projects: Project[];
  currentId: string;
  onSwitch: (project: Project) => void;
  externalOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (v: boolean) => {
    setInternalOpen(v);
    onOpenChange?.(v);
  };
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external open trigger
  useEffect(() => {
    if (externalOpen !== undefined) setInternalOpen(externalOpen);
  }, [externalOpen]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setFilter(""); }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const others = projects
    .filter((p) => p.id !== currentId && p.status !== "completed")
    .filter((p) => !filter || p.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-muted-foreground/60 hover:text-primary transition-colors ml-1.5"
        title="Switch project (Tab)"
      >
        ⇆
      </button>
      {open && (
        <div className="absolute left-0 top-6 z-50 bg-popover border border-border rounded-md shadow-lg min-w-[220px] max-w-[300px]">
          <div className="px-2 pt-2 pb-1">
            <input
              ref={inputRef}
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter projects..."
              className="w-full text-xs bg-muted/50 border border-border rounded px-2 py-1.5 placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
              onKeyDown={(e) => {
                if (e.key === "Enter" && others.length > 0) {
                  onSwitch(others[0]);
                  setOpen(false);
                  setFilter("");
                }
                if (e.key === "Escape") { setOpen(false); setFilter(""); }
              }}
            />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {others.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground/60">No other projects</div>
            ) : (
              others.map((p) => {
                const statusCfg = STATUS_LABELS[p.status] || { icon: "📁" };
                return (
                  <button
                    key={p.id}
                    onClick={() => { onSwitch(p); setOpen(false); setFilter(""); }}
                    className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-muted transition-colors"
                  >
                    <span>{statusCfg.icon}</span>
                    <span className="truncate flex-1">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground/50">{p.progress}%</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Inline status selector — change project status without opening edit modal
function InlineStatusSelect({
  projectId,
  currentStatus,
  onChanged,
}: {
  projectId: string;
  currentStatus: string;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const changeStatus = async (newStatus: string) => {
    if (newStatus === currentStatus) { setOpen(false); return; }
    setUpdating(true);
    try {
      await fetch(`/api/projects?id=${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setOpen(false);
      onChanged();
    } finally {
      setUpdating(false);
    }
  };

  const current = STATUS_LABELS[currentStatus] || { label: currentStatus, icon: "📁" };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors flex items-center gap-1 ${
          updating
            ? "opacity-50 cursor-wait border-border text-muted-foreground"
            : open
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary hover:text-primary"
        }`}
        title={`Status: ${current.label} — click to change`}
        disabled={updating}
      >
        <span>{current.icon}</span>
        <span className="hidden sm:inline">{current.label}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-50 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[140px]">
          {STATUSES.map((s) => {
            const cfg = STATUS_LABELS[s] || { label: s, icon: "📁" };
            const isCurrent = s === currentStatus;
            return (
              <button
                key={s}
                onClick={(e) => { e.stopPropagation(); changeStatus(s); }}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors ${
                  isCurrent
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted text-foreground"
                }`}
              >
                <span>{cfg.icon}</span>
                <span>{cfg.label}</span>
                {isCurrent && <span className="ml-auto text-[10px]">•</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Inline quick-add component for 10K ft view
function InlineTaskAdd({ projectId, onAdded }: { projectId: string; onAdded: () => void }) {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = async () => {
    const t = title.trim();
    if (!t) return;
    setSubmitting(true);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, project_id: projectId, priority: "medium", status: "todo" }),
      });
      setTitle("");
      onAdded();
      inputRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        type="text"
        className="flex-1 text-xs bg-muted/50 border border-border rounded-md px-2.5 py-1.5 placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
        placeholder="Add task and press Enter..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            setTitle("");
          }
        }}
        disabled={submitting}
      />
      {submitting && <span className="text-[10px] text-muted-foreground animate-pulse">...</span>}
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewLevel, setViewLevel] = useState<ViewLevel>("projects");
  const [spaceFilter, setSpaceFilter] = useState<SpaceFilter>("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<Task | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");
  const [formData, setFormData] = useState(emptyProjectForm);
  const [taskFormData, setTaskFormData] = useState(emptyTaskForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [inlineAddProjectId, setInlineAddProjectId] = useState<string | null>(null);
  const [focusedTaskIndex, setFocusedTaskIndex] = useState<number>(-1);
  const [projectSwitcherOpen, setProjectSwitcherOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const taskListRef = useRef<HTMLDivElement>(null);
  const switcherRef = useRef<{ open: () => void }>(null);
  const { toast } = useToast();

  const loadProjects = useCallback(async () => {
    try {
      const r = await fetch("/api/projects");
      const data = await r.json();
      setProjects(data);
    } catch {
      toast("Failed to load projects", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  // Keyboard shortcut: "/" to focus search, Escape to clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        if (e.key === "Escape" && e.target === searchInputRef.current) {
          setSearchQuery("");
          searchInputRef.current?.blur();
        }
        return;
      }
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Task status cycle order
  const TASK_STATUS_CYCLE = ["todo", "in-progress", "done"] as const;

  // Reset focused task when leaving ground view or changing project
  useEffect(() => {
    setFocusedTaskIndex(-1);
  }, [viewLevel, selectedProject?.id]);

  // Keyboard shortcuts for Ground-level task navigation
  useEffect(() => {
    if (viewLevel !== "now" || !selectedProject?.tasks) return;

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement).isContentEditable) return;
      if (showTaskForm || editingTaskId || deleteTaskTarget) return;

      const tasks = selectedProject.tasks || [];
      if (tasks.length === 0 && e.key !== "a" && e.key !== "?") return;

      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          setFocusedTaskIndex((prev) => {
            const next = Math.min(prev + 1, tasks.length - 1);
            scrollTaskIntoView(next);
            return next;
          });
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          setFocusedTaskIndex((prev) => {
            const next = Math.max(prev - 1, 0);
            scrollTaskIntoView(next);
            return next;
          });
          break;
        case "c": // Cycle task status: todo → in-progress → done → todo
          if (focusedTaskIndex >= 0 && focusedTaskIndex < tasks.length) {
            e.preventDefault();
            const task = tasks[focusedTaskIndex];
            const currentIdx = TASK_STATUS_CYCLE.indexOf(task.status as typeof TASK_STATUS_CYCLE[number]);
            const nextStatus = TASK_STATUS_CYCLE[(currentIdx + 1) % TASK_STATUS_CYCLE.length];
            updateTaskStatus(task.id, nextStatus);
            toast(`${nextStatus === "done" ? "✓" : nextStatus === "in-progress" ? "▶" : "○"} ${nextStatus.replace("-", " ")}`, "success");
          }
          break;
        case "e":
        case "Enter": // Edit focused task title
          if (focusedTaskIndex >= 0 && focusedTaskIndex < tasks.length) {
            e.preventDefault();
            const task = tasks[focusedTaskIndex];
            setEditingTaskId(task.id);
            setEditingTaskTitle(task.title);
          }
          break;
        case "d": // Delete focused task
          if (focusedTaskIndex >= 0 && focusedTaskIndex < tasks.length) {
            e.preventDefault();
            setDeleteTaskTarget(tasks[focusedTaskIndex]);
          }
          break;
        case "y": // Duplicate focused task
          if (focusedTaskIndex >= 0 && focusedTaskIndex < tasks.length) {
            e.preventDefault();
            const src = tasks[focusedTaskIndex];
            duplicateTask(src);
          }
          break;
        case "a": // Add new task
          e.preventDefault();
          setShowTaskForm(true);
          break;
        case "Escape":
          e.preventDefault();
          setFocusedTaskIndex(-1);
          break;
        case "Tab": // Open project switcher
          e.preventDefault();
          setProjectSwitcherOpen((prev) => !prev);
          break;
        case "?": // Show keyboard shortcut help
          e.preventDefault();
          toast("Keys: ↑↓/jk Navigate • c Cycle Status • e Edit • d Delete • y Duplicate • a Add Task • Tab Switch Project • Esc Clear");
          break;
      }
    };

    const scrollTaskIntoView = (index: number) => {
      if (taskListRef.current) {
        const items = taskListRef.current.querySelectorAll("[data-task-item]");
        items[index]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [viewLevel, selectedProject, focusedTaskIndex, showTaskForm, editingTaskId, deleteTaskTarget, toast]);

  const parseTags = (tagsStr: string | null): string[] => {
    if (!tagsStr) return [];
    try { return JSON.parse(tagsStr); } catch { return []; }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setFormData(emptyProjectForm);
      setShowCreateForm(false);
      toast("Project created");
      loadProjects();
    } catch {
      toast("Failed to create project", "error");
    }
  };

  const updateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    try {
      await fetch(`/api/projects?id=${editingProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setEditingProject(null);
      toast("Project updated");
      loadProjects();
    } catch {
      toast("Failed to update project", "error");
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
      toast("Project deleted");
      loadProjects();
      if (selectedProject?.id === id) {
        setSelectedProject(null);
        setViewLevel("projects");
      }
    } catch {
      toast("Failed to delete project", "error");
    }
  };

  const loadProjectTasks = async (project: Project) => {
    try {
      const res = await fetch(`/api/tasks?project_id=${project.id}`);
      const tasks = await res.json();
      setSelectedProject({ ...project, tasks });
      setViewLevel("now");
    } catch {
      toast("Failed to load tasks", "error");
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...taskFormData, project_id: selectedProject.id }),
      });
      setTaskFormData(emptyTaskForm);
      setShowTaskForm(false);
      toast("Task added");
      loadProjectTasks(selectedProject);
      loadProjects(); // Refresh progress
    } catch {
      toast("Failed to create task", "error");
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      await fetch(`/api/tasks?id=${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (selectedProject) loadProjectTasks(selectedProject);
      loadProjects(); // Refresh progress
    } catch {
      toast("Failed to update task", "error");
    }
  };

  const updateTaskTitle = async (taskId: string, title: string) => {
    try {
      await fetch(`/api/tasks?id=${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      setEditingTaskId(null);
      if (selectedProject) loadProjectTasks(selectedProject);
    } catch {
      toast("Failed to update task", "error");
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      toast("Task deleted");
      if (selectedProject) loadProjectTasks(selectedProject);
      loadProjects();
    } catch {
      toast("Failed to delete task", "error");
    }
  };

  const duplicateTask = async (task: Task) => {
    if (!selectedProject) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          description: task.description || null,
          project_id: selectedProject.id,
          priority: task.priority,
          status: "todo",
        }),
      });
      const created = await res.json();
      toast("Task duplicated");
      // Reload tasks, then focus the new task and open inline edit
      const tasksRes = await fetch(`/api/tasks?project_id=${selectedProject.id}`);
      const updatedTasks: Task[] = await tasksRes.json();
      setSelectedProject({ ...selectedProject, tasks: updatedTasks });
      const newIdx = updatedTasks.findIndex((t) => t.id === created.id);
      if (newIdx >= 0) {
        setFocusedTaskIndex(newIdx);
        setEditingTaskId(created.id);
        setEditingTaskTitle(created.title);
      }
      loadProjects(); // Refresh progress
    } catch {
      toast("Failed to duplicate task", "error");
    }
  };

  const openEditProject = (project: Project) => {
    setFormData({
      name: project.name,
      description: project.description || "",
      space: project.space,
      status: project.status,
      priority: project.priority,
      tags: parseTags(project.tags),
    });
    setEditingProject(project);
  };

  const filtered = projects.filter((p) => {
    if (spaceFilter !== "all" && p.space !== spaceFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = p.name.toLowerCase().includes(q);
      const descMatch = p.description?.toLowerCase().includes(q);
      const tagMatch = parseTags(p.tags).some((t) => t.toLowerCase().includes(q));
      if (!nameMatch && !descMatch && !tagMatch) return false;
    }
    return true;
  });

  const grouped = {
    "active-focus": filtered.filter((p) => p.status === "active-focus"),
    "on-deck": filtered.filter((p) => p.status === "on-deck"),
    "growing": filtered.filter((p) => p.status === "growing"),
    "on-hold": filtered.filter((p) => p.status === "on-hold"),
    "completed": filtered.filter((p) => p.status === "completed"),
  };

  const renderProjectForm = (onSubmit: (e: React.FormEvent) => void, submitLabel: string) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField label="Project Name" required>
        <input className="input" placeholder="Project name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required autoFocus />
      </FormField>
      <FormField label="Description">
        <textarea className="input" placeholder="What is this project about?" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
      </FormField>
      <div className="grid grid-cols-3 gap-3">
        <FormField label="Space">
          <select className="input" value={formData.space} onChange={(e) => setFormData({ ...formData, space: e.target.value })}>
            {SPACES.map((s) => (
              <option key={s} value={s}>{s === "bartlett-labs" ? "Bartlett Labs" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Status">
          <select className="input" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Priority">
          <select className="input" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </FormField>
      </div>
      <FormField label="Tags">
        <TagInput value={formData.tags} onChange={(tags) => setFormData({ ...formData, tags })} placeholder="Add tags..." />
      </FormField>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => { setShowCreateForm(false); setEditingProject(null); }} className="btn btn-secondary">Cancel</button>
        <button type="submit" className="btn btn-primary">{submitLabel}</button>
      </div>
    </form>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <div className="flex gap-2 mt-2">
            {(["life", "projects", "now"] as ViewLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setViewLevel(level)}
                className={`text-xs px-2 py-1 rounded ${
                  viewLevel === level ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {level === "life" ? "30K ft" : level === "projects" ? "10K ft" : "Ground"}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => { setFormData(emptyProjectForm); setShowCreateForm(true); }} className="btn btn-primary">
          + New Project
        </button>
      </div>

      {/* Space Filter + Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1">
          {(["all", ...SPACES] as SpaceFilter[]).map((space) => (
            <button
              key={space}
              onClick={() => setSpaceFilter(space)}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                spaceFilter === space ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {space === "all" ? "All" : space === "bartlett-labs" ? "Bartlett Labs" : space.charAt(0).toUpperCase() + space.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="input w-full pl-8 pr-8 py-1.5 text-sm"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">🔍</span>
          {searchQuery ? (
            <button
              onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
            >
              ✕
            </button>
          ) : (
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border font-mono">/</kbd>
          )}
        </div>
      </div>

      {/* Ground Level - Selected Project Tasks */}
      {viewLevel === "now" && selectedProject && (
        <div>
          <button onClick={() => { setViewLevel("projects"); setSelectedProject(null); }} className="text-sm text-primary mb-3 hover:underline">
            &larr; Back to Projects
          </button>
          <div className="card mb-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <h2 className="text-lg font-semibold">{selectedProject.name}</h2>
                  <ProjectSwitcher
                    projects={projects}
                    currentId={selectedProject.id}
                    onSwitch={loadProjectTasks}
                    externalOpen={projectSwitcherOpen}
                    onOpenChange={setProjectSwitcherOpen}
                  />
                </div>
                {selectedProject.description && <p className="text-sm text-muted-foreground mt-1">{selectedProject.description}</p>}
                {parseTags(selectedProject.tags).length > 0 && (
                  <div className="flex gap-1.5 mt-2">
                    {parseTags(selectedProject.tags).map((tag) => (
                      <span key={tag} className="badge badge-primary">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground mb-1">Progress</div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${selectedProject.progress}%` }} />
                    </div>
                    <span className="text-sm font-medium">{selectedProject.progress}%</span>
                  </div>
                </div>
                <button onClick={() => openEditProject(selectedProject)} className="btn btn-secondary text-xs">Edit</button>
              </div>
            </div>
            <div className="flex gap-3 mt-3 text-xs text-muted-foreground">
              <span>Created: {new Date(selectedProject.created_at).toLocaleDateString()}</span>
              <span>Updated: {new Date(selectedProject.updated_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Tasks ({selectedProject.tasks?.length || 0})
            </h3>
            <button onClick={() => setShowTaskForm(!showTaskForm)} className="btn btn-secondary text-xs">+ Add Task</button>
          </div>

          {showTaskForm && (
            <form onSubmit={createTask} className="card mb-4 space-y-2">
              <input className="input" placeholder="Task title" value={taskFormData.title} onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })} required autoFocus />
              <div className="flex gap-2">
                <select className="input" value={taskFormData.priority} onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}>
                  {PRIORITIES.map((p) => (<option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>))}
                </select>
                <input type="date" className="input" value={taskFormData.due_date} onChange={(e) => setTaskFormData({ ...taskFormData, due_date: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary text-xs">Add</button>
                <button type="button" onClick={() => setShowTaskForm(false)} className="btn btn-secondary text-xs">Cancel</button>
              </div>
            </form>
          )}

          <div className="space-y-2" ref={taskListRef}>
            {(selectedProject.tasks || []).map((task, taskIndex) => (
              <div
                key={task.id}
                data-task-item
                onClick={() => setFocusedTaskIndex(taskIndex)}
                className={`card flex items-center gap-3 transition-all group ${
                  focusedTaskIndex === taskIndex ? "ring-2 ring-primary/50 bg-primary/5" : ""
                }`}
              >
                <select
                  className="text-xs bg-transparent border border-border rounded px-1 py-0.5"
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                  <option value="blocked">Blocked</option>
                </select>
                {editingTaskId === task.id ? (
                  <input
                    className="input flex-1 text-sm py-0.5"
                    value={editingTaskTitle}
                    onChange={(e) => setEditingTaskTitle(e.target.value)}
                    onBlur={() => updateTaskTitle(task.id, editingTaskTitle)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") updateTaskTitle(task.id, editingTaskTitle);
                      if (e.key === "Escape") setEditingTaskId(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <span
                    className={`text-sm flex-1 cursor-pointer ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}
                    onClick={() => { setEditingTaskId(task.id); setEditingTaskTitle(task.title); }}
                  >
                    {task.title}
                  </span>
                )}
                <span className={`badge ${getPriorityBadge(task.priority)}`}>{task.priority}</span>
                {task.due_date && <span className="text-xs text-muted-foreground">{new Date(task.due_date).toLocaleDateString()}</span>}
                <button
                  onClick={(e) => { e.stopPropagation(); duplicateTask(task); }}
                  className="text-xs text-muted-foreground hover:text-primary px-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Duplicate task"
                  title="Duplicate task (y)"
                >
                  ⧉
                </button>
                <button
                  onClick={() => setDeleteTaskTarget(task)}
                  className="text-xs text-muted-foreground hover:text-destructive px-1"
                  aria-label="Delete task"
                >
                  &times;
                </button>
              </div>
            ))}
            {(!selectedProject.tasks || selectedProject.tasks.length === 0) && (
              <EmptyState icon="📋" title="No tasks yet" description="Add your first task to get started." action={{ label: "+ Add Task", onClick: () => setShowTaskForm(true) }} />
            )}
          </div>

          {/* Task keyboard shortcut hint */}
          <div className="mt-3 text-center">
            <span className="text-[10px] text-muted-foreground/40">
              <kbd className="px-1 py-0.5 rounded bg-muted text-muted-foreground/60 text-[9px]">Tab</kbd> switch project
              {selectedProject.tasks && selectedProject.tasks.length > 0 && (
                <> · <kbd className="px-1 py-0.5 rounded bg-muted text-muted-foreground/60 text-[9px]">?</kbd> all shortcuts</>
              )}
            </span>
          </div>
        </div>
      )}

      {/* 10K ft - Projects by Status */}
      {viewLevel === "projects" && (
        <div className="space-y-6">
          {loading ? (
            <LoadingSkeleton count={5} height="h-20" />
          ) : filtered.length === 0 ? (
            <EmptyState icon="📁" title="No projects" description="Create your first project to organize your work." action={{ label: "+ New Project", onClick: () => setShowCreateForm(true) }} />
          ) : (
            Object.entries(grouped).map(([status, items]) =>
              items.length > 0 && (
                <div key={status}>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">
                    {status.replace(/-/g, " ")} ({items.length})
                  </h3>
                  <div className="space-y-2">
                    {items.map((project) => (
                      <div key={project.id} className="card cursor-pointer" onClick={() => loadProjectTasks(project)}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{project.name}</h3>
                              {/* Inline task summary */}
                              {(project.task_total ?? 0) > 0 && (
                                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
                                  <span className={project.task_overdue ? "text-destructive font-medium" : ""}>
                                    {project.task_overdue ? `${project.task_overdue} overdue · ` : ""}
                                  </span>
                                  <span>
                                    {project.task_done}/{project.task_total} done
                                  </span>
                                  {(project.task_in_progress ?? 0) > 0 && (
                                    <span className="text-primary">
                                      · {project.task_in_progress} active
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                            {project.description && (
                              <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">{project.description}</p>
                            )}
                            {parseTags(project.tags).length > 0 && (
                              <div className="flex gap-1 mt-1.5">
                                {parseTags(project.tags).map((tag) => (
                                  <span key={tag} className="badge badge-muted text-xs">{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <InlineStatusSelect
                              projectId={project.id}
                              currentStatus={project.status}
                              onChanged={loadProjects}
                            />
                            <span className="badge badge-primary">{project.space === "bartlett-labs" ? "BL" : project.space.slice(0, 3)}</span>
                            <span className={`badge ${getPriorityBadge(project.priority)}`}>{project.priority}</span>
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 bg-secondary rounded-full h-1.5">
                                <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground w-8">{project.progress}%</span>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); setInlineAddProjectId(inlineAddProjectId === project.id ? null : project.id); }}
                              className={`w-5 h-5 rounded flex items-center justify-center text-xs transition-colors ${
                                inlineAddProjectId === project.id
                                  ? "text-primary bg-primary/10"
                                  : "text-muted-foreground hover:text-primary hover:bg-muted"
                              }`}
                              title="Quick add task"
                              aria-label="Quick add task"
                            >
                              +
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); openEditProject(project); }}
                              className="text-xs text-muted-foreground hover:text-foreground px-1"
                              aria-label="Edit project"
                            >
                              &#9998;
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(project); }}
                              className="text-xs text-muted-foreground hover:text-destructive px-1"
                              aria-label="Delete project"
                            >
                              &times;
                            </button>
                          </div>
                        </div>
                        {inlineAddProjectId === project.id && (
                          <InlineTaskAdd
                            projectId={project.id}
                            onAdded={() => {
                              toast("Task added");
                              loadProjects();
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )
          )}
        </div>
      )}

      {/* 30K ft - Life View */}
      {viewLevel === "life" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SPACES.map((space) => {
            const spaceProjects = projects.filter((p) => p.space === space);
            const active = spaceProjects.filter((p) => p.status === "active-focus");
            return (
              <div key={space} className="widget">
                <h2 className="widget-title">{space === "bartlett-labs" ? "Bartlett Labs" : space.charAt(0).toUpperCase() + space.slice(1)}</h2>
                <div className="text-2xl font-bold mb-1">{spaceProjects.length} projects</div>
                <div className="text-xs text-muted-foreground mb-3">{active.length} active</div>
                <div className="space-y-2">
                  {spaceProjects.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="text-sm truncate">{p.name}</span>
                        {(p.task_overdue ?? 0) > 0 && (
                          <span className="text-[9px] font-medium text-destructive bg-destructive/10 px-1 py-0.5 rounded-full flex-shrink-0">
                            {p.task_overdue}!
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                        {(p.task_total ?? 0) > 0 && (
                          <span className="text-[10px] text-muted-foreground/60">
                            {p.task_done}/{p.task_total}
                          </span>
                        )}
                        <div className="w-12 bg-secondary rounded-full h-1">
                          <div className="bg-primary h-1 rounded-full" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{p.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal open={showCreateForm} onClose={() => setShowCreateForm(false)} title="New Project" size="lg">
        {renderProjectForm(createProject, "Create")}
      </Modal>

      {/* Edit Project Modal */}
      <Modal open={!!editingProject} onClose={() => setEditingProject(null)} title="Edit Project" size="lg">
        {renderProjectForm(updateProject, "Save Changes")}
      </Modal>

      {/* Confirm Delete Project */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteProject(deleteTarget.id)}
        title="Delete Project"
        message={`Delete "${deleteTarget?.name}" and all its tasks? This cannot be undone.`}
      />

      {/* Confirm Delete Task */}
      <ConfirmDialog
        open={!!deleteTaskTarget}
        onClose={() => setDeleteTaskTarget(null)}
        onConfirm={() => deleteTaskTarget && deleteTask(deleteTaskTarget.id)}
        title="Delete Task"
        message={`Delete task "${deleteTaskTarget?.title}"?`}
      />
    </div>
  );
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "high": return "badge-danger";
    case "medium": return "badge-warning";
    case "low": return "badge-muted";
    default: return "badge-muted";
  }
}
