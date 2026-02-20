"use client";

import { useEffect, useState, useCallback } from "react";
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
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [inlineTaskForm, setInlineTaskForm] = useState<string | null>(null);
  const [inlineTaskTitle, setInlineTaskTitle] = useState("");
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

  const updateTaskStatus = async (taskId: string, status: string, projectId?: string) => {
    try {
      await fetch(`/api/tasks?id=${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (selectedProject) loadProjectTasks(selectedProject);
      // Also refresh inline-expanded project tasks
      if (projectId && expandedProjects.has(projectId)) {
        const res = await fetch(`/api/tasks?project_id=${projectId}`);
        const tasks = await res.json();
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? { ...p, tasks } : p))
        );
      }
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

  const toggleExpand = async (project: Project) => {
    const next = new Set(expandedProjects);
    if (next.has(project.id)) {
      next.delete(project.id);
    } else {
      next.add(project.id);
      // Load tasks if not already loaded
      if (!project.tasks) {
        try {
          const res = await fetch(`/api/tasks?project_id=${project.id}`);
          const tasks = await res.json();
          setProjects((prev) =>
            prev.map((p) => (p.id === project.id ? { ...p, tasks } : p))
          );
        } catch {
          toast("Failed to load tasks", "error");
        }
      }
    }
    setExpandedProjects(next);
  };

  const createInlineTask = async (projectId: string) => {
    if (!inlineTaskTitle.trim()) return;
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: inlineTaskTitle.trim(), project_id: projectId, status: "todo", priority: "medium" }),
      });
      setInlineTaskTitle("");
      setInlineTaskForm(null);
      toast("Task added");
      // Reload tasks for this project
      const res = await fetch(`/api/tasks?project_id=${projectId}`);
      const tasks = await res.json();
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, tasks } : p))
      );
      loadProjects();
    } catch {
      toast("Failed to add task", "error");
    }
  };

  const filtered = spaceFilter === "all" ? projects : projects.filter((p) => p.space === spaceFilter);

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

      {/* Space Filter */}
      <div className="flex gap-1 mb-4">
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

      {/* Ground Level - Selected Project Tasks */}
      {viewLevel === "now" && selectedProject && (
        <div>
          <button onClick={() => { setViewLevel("projects"); setSelectedProject(null); }} className="text-sm text-primary mb-3 hover:underline">
            &larr; Back to Projects
          </button>
          <div className="card mb-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{selectedProject.name}</h2>
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

          <div className="space-y-2">
            {(selectedProject.tasks || []).map((task) => (
              <div key={task.id} className="card flex items-center gap-3">
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
                    {items.map((project) => {
                      const isExpanded = expandedProjects.has(project.id);
                      return (
                      <div key={project.id} className="card">
                        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(project)}>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className={`text-xs text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} style={{ display: "inline-block" }}>▶</span>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium">{project.name}</h3>
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
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="badge badge-primary">{project.space === "bartlett-labs" ? "BL" : project.space.slice(0, 3)}</span>
                            <span className={`badge ${getPriorityBadge(project.priority)}`}>{project.priority}</span>
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 bg-secondary rounded-full h-1.5">
                                <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground w-8">{project.progress}%</span>
                            </div>
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
                        {/* Inline Task List */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-border">
                            {project.tasks && project.tasks.length > 0 ? (
                              <div className="space-y-1.5">
                                {project.tasks.map((task) => (
                                  <div key={task.id} className="flex items-center gap-2 pl-5 group">
                                    <button
                                      onClick={() => updateTaskStatus(task.id, task.status === "done" ? "todo" : "done", project.id)}
                                      className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px] transition-colors ${
                                        task.status === "done"
                                          ? "bg-primary border-primary text-primary-foreground"
                                          : task.status === "in-progress"
                                          ? "border-primary bg-primary/10"
                                          : "border-muted-foreground/40 hover:border-primary"
                                      }`}
                                      aria-label={task.status === "done" ? "Mark undone" : "Mark done"}
                                    >
                                      {task.status === "done" && "✓"}
                                    </button>
                                    <span className={`text-sm flex-1 ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                                      {task.title}
                                    </span>
                                    {task.status !== "done" && task.status !== "todo" && (
                                      <span className="text-[10px] text-primary/70 font-medium uppercase">{task.status}</span>
                                    )}
                                    <span className={`text-[10px] ${task.priority === "high" ? "text-red-500" : task.priority === "medium" ? "text-amber-500" : "text-muted-foreground"}`}>
                                      {task.priority === "high" ? "!" : task.priority === "medium" ? "–" : ""}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground pl-5">No tasks yet</p>
                            )}
                            {/* Inline quick-add task */}
                            {inlineTaskForm === project.id ? (
                              <div className="flex items-center gap-2 pl-5 mt-2">
                                <input
                                  className="input text-sm py-1 flex-1"
                                  placeholder="Task title..."
                                  value={inlineTaskTitle}
                                  onChange={(e) => setInlineTaskTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") createInlineTask(project.id);
                                    if (e.key === "Escape") { setInlineTaskForm(null); setInlineTaskTitle(""); }
                                  }}
                                  autoFocus
                                />
                                <button onClick={() => createInlineTask(project.id)} className="text-xs text-primary hover:underline">Add</button>
                                <button onClick={() => { setInlineTaskForm(null); setInlineTaskTitle(""); }} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); setInlineTaskForm(project.id); setInlineTaskTitle(""); }}
                                className="text-xs text-muted-foreground hover:text-primary pl-5 mt-2"
                              >
                                + Add task
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      );
                    })}
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
                      <span className="text-sm truncate flex-1">{p.name}</span>
                      <div className="flex items-center gap-1.5 ml-2">
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
