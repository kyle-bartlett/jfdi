"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<string[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Load sessions list
  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/claude/stream");
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch {
      // Sessions not available
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load session history
  const loadSession = async (sid: string) => {
    try {
      const res = await fetch(`/api/claude/stream?sessionId=${sid}`);
      const data = await res.json();
      const hist = (data.messages || [])
        .filter((m: { role: string }) => m.role !== "system")
        .map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: new Date().toISOString(),
        }));
      setMessages(hist);
      setSessionId(sid);
      setShowSessions(false);
      setUsage(null);
    } catch {
      toast("Failed to load session", "error");
    }
  };

  // Delete session
  const deleteSession = async (sid: string) => {
    try {
      await fetch(`/api/claude/stream?sessionId=${sid}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s !== sid));
      if (sessionId === sid) {
        setSessionId(null);
        setMessages([]);
      }
    } catch {
      toast("Failed to delete session", "error");
    }
  };

  // Send message with streaming
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setStreaming(true);
    setStreamingContent("");

    try {
      const res = await fetch("/api/claude/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId: sessionId || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send message");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(trimmed.slice(6));

            if (data.type === "session") {
              setSessionId(data.session_id);
            } else if (data.type === "chunk") {
              accumulated += data.content;
              setStreamingContent(accumulated);
            } else if (data.type === "usage") {
              setUsage(data.usage);
            } else if (data.type === "done") {
              // Final message
              const assistantMessage: Message = {
                role: "assistant",
                content: data.full_content || accumulated,
                timestamp: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, assistantMessage]);
              setStreamingContent("");
              setStreaming(false);
            } else if (data.type === "error") {
              throw new Error(data.error);
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== "Unexpected end of JSON input") {
              throw parseErr;
            }
          }
        }
      }

      // Refresh sessions list
      await loadSessions();
    } catch (error) {
      setStreamingContent("");
      setStreaming(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: error instanceof Error
            ? `Error: ${error.message}`
            : "Error: Could not reach Claude.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const newSession = () => {
    setSessionId(null);
    setMessages([]);
    setUsage(null);
    setStreamingContent("");
    inputRef.current?.focus();
  };

  const handleClearAll = async () => {
    for (const sid of sessions) {
      await fetch(`/api/claude/stream?sessionId=${sid}`, { method: "DELETE" });
    }
    setSessions([]);
    setSessionId(null);
    setMessages([]);
    setUsage(null);
    toast("All sessions cleared");
  };

  // Handle Cmd+Enter to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      const form = e.currentTarget.closest("form");
      if (form) form.requestSubmit();
    }
  };

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Session sidebar */}
      {showSessions && (
        <div className="w-64 border-r border-border flex flex-col mr-4 flex-shrink-0">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-semibold">Sessions</span>
            <div className="flex gap-1">
              {sessions.length > 0 && (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowSessions(false)}
                className="text-xs text-muted-foreground hover:text-foreground ml-2"
              >
                &times;
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3 italic">
                No sessions yet
              </p>
            ) : (
              sessions.map((sid) => (
                <div
                  key={sid}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted group ${
                    sessionId === sid ? "bg-muted" : ""
                  }`}
                  onClick={() => loadSession(sid)}
                >
                  <span className="text-xs font-mono truncate flex-1">
                    {sid.slice(0, 12)}...
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(sid);
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                  >
                    &times;
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSessions(!showSessions)}
              className="btn btn-secondary text-xs py-1.5 px-2"
              title="Sessions"
            >
              &#9776;
            </button>
            <div>
              <h1 className="text-2xl font-bold">Chat</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="badge badge-primary text-[10px]">
                  Opus 4.6
                </span>
                {sessionId && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {sessionId.slice(0, 8)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {usage && (
              <span className="text-[10px] text-muted-foreground">
                {usage.prompt_tokens}+{usage.completion_tokens} tokens
              </span>
            )}
            <button onClick={newSession} className="btn btn-secondary text-sm">
              New Session
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.length === 0 && !streaming && (
            <div className="text-center text-muted-foreground py-20">
              <p className="text-3xl mb-3">JFDI</p>
              <p className="text-sm mb-1">
                Powered by Claude Opus 4.6
              </p>
              <p className="text-xs mt-4 max-w-md mx-auto">
                Ask about your schedule, create reminders, get meeting prep, or
                brainstorm ideas.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {[
                  "What's on my schedule today?",
                  "Create a reminder for tomorrow at 9am",
                  "Help me prep for my next meeting",
                  "What tasks are overdue?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="text-sm">
                    <MarkdownRenderer content={msg.content} />
                  </div>
                ) : (
                  <div className="text-sm whitespace-pre-wrap">
                    {msg.content}
                  </div>
                )}
                <div
                  className={`text-[10px] mt-1.5 ${
                    msg.role === "user"
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {/* Streaming response */}
          {streaming && streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-card border border-border">
                <div className="text-sm">
                  <MarkdownRenderer content={streamingContent} />
                </div>
                <div className="text-[10px] mt-1.5 text-muted-foreground">
                  Streaming...
                </div>
              </div>
            </div>
          )}

          {/* Loading dots (before first chunk arrives) */}
          {loading && !streamingContent && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-lg p-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <span
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <span
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="flex gap-2 flex-shrink-0">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              className="input w-full resize-none"
              placeholder="Type a message... (Cmd+Enter to send)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              rows={Math.min(input.split("\n").length, 5)}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn btn-primary self-end"
          >
            {loading ? "..." : "Send"}
          </button>
        </form>
      </div>

      {/* Confirm clear all */}
      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={handleClearAll}
        title="Clear All Sessions"
        message="This will permanently delete all chat history."
      />
    </div>
  );
}
