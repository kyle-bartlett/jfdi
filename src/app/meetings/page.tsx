"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { SearchInput } from "@/components/ui/search-input";
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

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  source?: string;
  account?: string;
  attendees: Array<{ email?: string; name: string }>;
}

interface Relationship {
  id: string;
  name: string;
  email: string | null;
}

const EMPTY_FORM = {
  title: "",
  date: "",
  location: "",
  attendee_ids: [] as string[],
  agenda: "",
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [contacts, setContacts] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");
  const [search, setSearch] = useState("");

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Meeting | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  // Delete confirm
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);

  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      const [meetRes, calRes, relRes] = await Promise.all([
        fetch("/api/meetings").then((r) => r.json()),
        fetch("/api/calendar")
          .then((r) => r.json())
          .catch(() => []),
        fetch("/api/relationships").then((r) => r.json()),
      ]);
      setMeetings(meetRes);
      setCalendarEvents(Array.isArray(calRes) ? calRes : []);
      setContacts(relRes);
    } catch {
      toast("Failed to load meetings", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const parseAttendees = (ids: string | null): string[] => {
    if (!ids) return [];
    try {
      return JSON.parse(ids);
    } catch {
      return [];
    }
  };

  const getContactName = (id: string) => {
    return contacts.find((c) => c.id === id)?.name || "Unknown";
  };

  const formatMeetingDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  // Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (!res.ok) throw new Error("Failed to create");
      setCreateForm(EMPTY_FORM);
      setShowCreateForm(false);
      toast("Meeting created");
      await loadData();
    } catch {
      toast("Failed to create meeting", "error");
    }
  };

  // Edit
  const openEditModal = (m: Meeting) => {
    setEditTarget(m);
    setEditForm({
      title: m.title,
      date: m.date,
      location: m.location || "",
      attendee_ids: parseAttendees(m.attendee_ids),
      agenda: m.agenda || "",
    });
    setEditModalOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    try {
      const res = await fetch(`/api/meetings?id=${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditModalOpen(false);
      setEditTarget(null);
      toast("Meeting updated");
      await loadData();
    } catch {
      toast("Failed to update meeting", "error");
    }
  };

  // Complete
  const completeMeeting = async (id: string) => {
    try {
      await fetch(`/api/meetings?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      toast("Meeting completed");
      await loadData();
    } catch {
      toast("Failed to complete meeting", "error");
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!confirmTarget) return;
    try {
      await fetch(`/api/meetings?id=${confirmTarget}`, { method: "DELETE" });
      setConfirmTarget(null);
      toast("Meeting deleted");
      await loadData();
    } catch {
      toast("Failed to delete meeting", "error");
    }
  };

  // Attendee toggle
  const toggleAttendee = (
    form: typeof EMPTY_FORM,
    setForm: (f: typeof EMPTY_FORM) => void,
    contactId: string
  ) => {
    const current = form.attendee_ids;
    const updated = current.includes(contactId)
      ? current.filter((id) => id !== contactId)
      : [...current, contactId];
    setForm({ ...form, attendee_ids: updated });
  };

  // Filter
  let filtered = meetings.filter((m) => m.status === activeTab);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.location?.toLowerCase().includes(q)
    );
  }

  // Sort: upcoming by date asc, completed by date desc
  const sorted = [...filtered].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return activeTab === "upcoming" ? dateA - dateB : dateB - dateA;
  });

  const upcomingCount = meetings.filter((m) => m.status === "upcoming").length;
  const completedCount = meetings.filter((m) => m.status === "completed").length;

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
          placeholder="Meeting title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <FormField label="Date & Time" required>
          <input
            type="datetime-local"
            className="input"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
        </FormField>
        <FormField label="Location">
          <input
            className="input"
            placeholder="Room, address, or link"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </FormField>
      </div>

      <FormField label="Attendees">
        <div className="max-h-32 overflow-y-auto border border-border rounded-md p-2 space-y-1">
          {contacts.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No contacts. Add contacts in Relationships first.
            </p>
          ) : (
            contacts.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted rounded px-1"
              >
                <input
                  type="checkbox"
                  checked={form.attendee_ids.includes(c.id)}
                  onChange={() => toggleAttendee(form, setForm, c.id)}
                  className="accent-primary"
                />
                <span>{c.name}</span>
                {c.email && (
                  <span className="text-xs text-muted-foreground">{c.email}</span>
                )}
              </label>
            ))
          )}
        </div>
      </FormField>

      <FormField label="Agenda">
        <textarea
          className="input"
          rows={3}
          placeholder="Meeting agenda (Markdown supported)"
          value={form.agenda}
          onChange={(e) => setForm({ ...form, agenda: e.target.value })}
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
          <h1 className="text-2xl font-bold">Meetings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {upcomingCount} upcoming, {completedCount} completed
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary"
        >
          + New Meeting
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="card mb-6">
          <h3 className="text-sm font-semibold mb-4">New Meeting</h3>
          {renderForm(createForm, setCreateForm, handleCreate, "Create Meeting", () => {
            setShowCreateForm(false);
            setCreateForm(EMPTY_FORM);
          })}
        </div>
      )}

      {/* Calendar Events */}
      {calendarEvents.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase mb-2">
            From Calendar
          </h2>
          <div className="space-y-2">
            {calendarEvents.slice(0, 10).map((event) => (
              <div
                key={event.id}
                className="card flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-sm">{event.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(event.start).toLocaleString()} -{" "}
                    {new Date(event.end).toLocaleTimeString()}
                  </div>
                  {event.attendees.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {event.attendees
                        .map((a) => a.name || a.email)
                        .join(", ")}
                    </div>
                  )}
                </div>
                <span
                  className={`badge ${event.source === "lark" ? "badge-primary" : "badge-accent"}`}
                >
                  {event.source === "lark" ? "Lark" : "Google"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-3 py-1.5 rounded-lg text-sm ${activeTab === "upcoming" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            Upcoming ({upcomingCount})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-3 py-1.5 rounded-lg text-sm ${activeTab === "completed" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            Completed ({completedCount})
          </button>
        </div>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search meetings..."
          className="max-w-xs"
        />
      </div>

      {/* Meetings List */}
      {loading ? (
        <LoadingSkeleton count={4} height="h-20" />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon="📅"
          title={`No ${activeTab} meetings`}
          description={
            activeTab === "upcoming"
              ? "Create a meeting to start preparing"
              : "Completed meetings will appear here"
          }
          action={
            activeTab === "upcoming"
              ? {
                  label: "Create Meeting",
                  onClick: () => setShowCreateForm(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {sorted.map((meeting) => {
            const attendeeIds = parseAttendees(meeting.attendee_ids);
            const hasPrep = !!meeting.prep_notes;
            const hasDebrief = !!meeting.debrief_notes;
            const today = isToday(meeting.date);

            return (
              <div
                key={meeting.id}
                className={`card flex items-start gap-3 ${today ? "border-primary" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Link
                      href={`/meetings/${meeting.id}`}
                      className="font-medium text-sm hover:text-primary hover:underline truncate"
                    >
                      {meeting.title}
                    </Link>
                    {today && (
                      <span className="badge badge-primary text-[10px]">
                        Today
                      </span>
                    )}
                    {hasPrep && (
                      <span className="text-[10px] text-muted-foreground">
                        Prep
                      </span>
                    )}
                    {hasDebrief && (
                      <span className="text-[10px] text-muted-foreground">
                        Debrief
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatMeetingDate(meeting.date)}
                    {meeting.location && (
                      <span> &middot; {meeting.location}</span>
                    )}
                  </div>
                  {attendeeIds.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {attendeeIds.map(getContactName).join(", ")}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {meeting.status === "upcoming" && (
                    <button
                      onClick={() => completeMeeting(meeting.id)}
                      className="btn btn-secondary text-xs py-1 px-2"
                    >
                      Complete
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(meeting)}
                    className="text-xs text-muted-foreground hover:text-primary px-1"
                    title="Edit"
                  >
                    &#9998;
                  </button>
                  <button
                    onClick={() => {
                      setConfirmTarget(meeting.id);
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
        title="Edit Meeting"
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
        title="Delete Meeting"
        message="This will permanently delete this meeting and all associated notes."
      />
    </div>
  );
}
