"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

interface Meeting {
  id: string;
  title: string;
  date: string;
  location: string | null;
  attendee_ids: string | null;
  calendar_event_id: string | null;
  agenda: string | null;
  prep_notes: string | null;
  debrief_notes: string | null;
  action_items: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Relationship {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: string;
  last_contact: string | null;
}

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [attendees, setAttendees] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);

  // Prep/debrief states
  const [generatingPrep, setGeneratingPrep] = useState(false);
  const [processingDebrief, setProcessingDebrief] = useState(false);
  const [braindump, setBraindump] = useState("");
  const [showDebriefForm, setShowDebriefForm] = useState(false);

  // Agenda editing
  const [editingAgenda, setEditingAgenda] = useState(false);
  const [agendaValue, setAgendaValue] = useState("");

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const meetRes = await fetch(`/api/meetings?id=${id}`);
      if (!meetRes.ok) throw new Error("Not found");
      const meetData: Meeting = await meetRes.json();
      setMeeting(meetData);

      // Load attendees
      if (meetData.attendee_ids) {
        try {
          const ids: string[] = JSON.parse(meetData.attendee_ids);
          if (ids.length > 0) {
            const relRes = await fetch("/api/relationships");
            const allRels: Relationship[] = await relRes.json();
            setAttendees(allRels.filter((r) => ids.includes(r.id)));
          }
        } catch {
          // Invalid JSON
        }
      }
    } catch {
      toast("Failed to load meeting", "error");
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
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

  // Generate AI prep
  const handleGeneratePrep = async () => {
    setGeneratingPrep(true);
    try {
      const res = await fetch(`/api/meetings/${id}/prep`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate prep");
      }
      toast("Meeting prep generated");
      await loadData();
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Failed to generate prep",
        "error"
      );
    } finally {
      setGeneratingPrep(false);
    }
  };

  // Process debrief
  const handleProcessDebrief = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!braindump.trim()) return;
    setProcessingDebrief(true);
    try {
      const res = await fetch(`/api/meetings/${id}/debrief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ braindump }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to process debrief");
      }
      const data = await res.json();
      setBraindump("");
      setShowDebriefForm(false);
      const reminderCount = data.created_reminders?.length || 0;
      toast(
        `Debrief processed${reminderCount > 0 ? `, ${reminderCount} reminder${reminderCount > 1 ? "s" : ""} created` : ""}`
      );
      await loadData();
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Failed to process debrief",
        "error"
      );
    } finally {
      setProcessingDebrief(false);
    }
  };

  // Save agenda
  const saveAgenda = async () => {
    try {
      const res = await fetch(`/api/meetings?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agenda: agendaValue || null }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setEditingAgenda(false);
      toast("Agenda saved");
      await loadData();
    } catch {
      toast("Failed to save agenda", "error");
    }
  };

  // Delete meeting
  const handleDelete = async () => {
    try {
      await fetch(`/api/meetings?id=${id}`, { method: "DELETE" });
      toast("Meeting deleted");
      router.push("/meetings");
    } catch {
      toast("Failed to delete meeting", "error");
    }
  };

  // Parse action items
  const parseActionItems = (
    items: string | null
  ): Array<{ title: string; assignee?: string; due_date?: string | null }> => {
    if (!items) return [];
    try {
      return JSON.parse(items);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <div className="card animate-pulse h-8 w-48 mb-2" />
          <div className="card animate-pulse h-4 w-32" />
        </div>
        <LoadingSkeleton count={3} height="h-32" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <EmptyState
        icon="❌"
        title="Meeting not found"
        description="This meeting may have been deleted"
        action={{
          label: "Back to Meetings",
          onClick: () => router.push("/meetings"),
        }}
      />
    );
  }

  const actionItems = parseActionItems(meeting.action_items);
  const isUpcoming = meeting.status === "upcoming";

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/meetings"
            className="text-muted-foreground hover:text-foreground text-sm mb-2 inline-block"
          >
            &larr; Meetings
          </Link>
          <h1 className="text-2xl font-bold">{meeting.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span>{formatDate(meeting.date)}</span>
            {meeting.location && (
              <>
                <span>&middot;</span>
                <span>{meeting.location}</span>
              </>
            )}
            <span
              className={`badge text-xs ${isUpcoming ? "badge-primary" : "badge-muted"}`}
            >
              {meeting.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {isUpcoming && (
            <button
              onClick={handleGeneratePrep}
              disabled={generatingPrep}
              className="btn btn-primary text-sm"
            >
              {generatingPrep ? "Generating..." : "Generate Prep"}
            </button>
          )}
          {!showDebriefForm && (
            <button
              onClick={() => setShowDebriefForm(true)}
              className="btn btn-secondary text-sm"
            >
              Process Debrief
            </button>
          )}
          <button
            onClick={() => setDeleteOpen(true)}
            className="btn btn-secondary text-sm text-destructive"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agenda */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Agenda</h3>
              {editingAgenda ? (
                <div className="flex gap-2">
                  <button
                    onClick={saveAgenda}
                    className="text-xs text-primary hover:underline"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingAgenda(false)}
                    className="text-xs text-muted-foreground"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAgendaValue(meeting.agenda || "");
                    setEditingAgenda(true);
                  }}
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  {meeting.agenda ? "Edit" : "Add Agenda"}
                </button>
              )}
            </div>
            {editingAgenda ? (
              <textarea
                className="input w-full"
                rows={6}
                value={agendaValue}
                onChange={(e) => setAgendaValue(e.target.value)}
                placeholder="Write your agenda (Markdown supported)..."
                autoFocus
              />
            ) : meeting.agenda ? (
              <MarkdownRenderer content={meeting.agenda} />
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No agenda set
              </p>
            )}
          </div>

          {/* Prep Notes */}
          {meeting.prep_notes && (
            <div className="card">
              <h3 className="text-sm font-semibold mb-3">
                AI Meeting Prep
              </h3>
              <MarkdownRenderer content={meeting.prep_notes} />
            </div>
          )}

          {/* Debrief Form */}
          {showDebriefForm && (
            <div className="card">
              <h3 className="text-sm font-semibold mb-3">Meeting Debrief</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Brain dump everything from the meeting. Claude will organize it
                into key decisions, action items, and follow-ups.
              </p>
              <form onSubmit={handleProcessDebrief} className="space-y-3">
                <textarea
                  className="input w-full"
                  rows={8}
                  value={braindump}
                  onChange={(e) => setBraindump(e.target.value)}
                  placeholder="What happened? Key points, decisions, action items, things to follow up on..."
                  required
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={processingDebrief}
                    className="btn btn-primary"
                  >
                    {processingDebrief ? "Processing..." : "Process Debrief"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDebriefForm(false);
                      setBraindump("");
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Debrief Notes */}
          {meeting.debrief_notes && (
            <div className="card">
              <h3 className="text-sm font-semibold mb-3">
                Meeting Debrief Notes
              </h3>
              <MarkdownRenderer content={meeting.debrief_notes} />
            </div>
          )}

          {/* Action Items */}
          {actionItems.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold mb-3">
                Action Items ({actionItems.length})
              </h3>
              <div className="space-y-2">
                {actionItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm"
                  >
                    <span className="text-muted-foreground mt-0.5">
                      &#9744;
                    </span>
                    <div className="flex-1">
                      <span>{item.title}</span>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {item.assignee && (
                          <span>Assigned: {item.assignee}</span>
                        )}
                        {item.assignee && item.due_date && (
                          <span> &middot; </span>
                        )}
                        {item.due_date && <span>Due: {item.due_date}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Attendees */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">
              Attendees ({attendees.length})
            </h3>
            {attendees.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No attendees linked
              </p>
            ) : (
              <div className="space-y-3">
                {attendees.map((a) => {
                  const lastDays = daysSince(a.last_contact);
                  return (
                    <div key={a.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {a.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/relationships/${a.id}`}
                          className="text-sm font-medium hover:text-primary hover:underline truncate block"
                        >
                          {a.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {a.type} &middot;{" "}
                          {lastDays !== null
                            ? `${lastDays}d ago`
                            : "Never contacted"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Meeting Info */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="capitalize">{meeting.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>
                  {new Date(meeting.created_at).toLocaleDateString()}
                </span>
              </div>
              {meeting.calendar_event_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Calendar</span>
                  <span className="text-xs">Linked</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Meeting"
        message="This will permanently delete this meeting and all prep/debrief notes."
      />
    </div>
  );
}
