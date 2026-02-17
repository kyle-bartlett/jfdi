"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

type PanelMode = "closed" | "bubble" | "window" | "sidebar";

export default function ChatPanel() {
  const [mode, setMode] = useState<PanelMode>("bubble");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname();

  // Don't show on chat page (full chat is there)
  const isOnChatPage = pathname === "/chat";

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Focus input when panel opens
  useEffect(() => {
    if (mode === "window" || mode === "sidebar") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [mode]);

  // Keyboard shortcut: Cmd+K to toggle panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setMode((prev) => {
          if (prev === "bubble" || prev === "closed") return "window";
          return "bubble";
        });
      }
      if (e.key === "Escape" && (mode === "window" || mode === "sidebar")) {
        setMode("bubble");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode]);

  // Send message with streaming
  const sendMessage = useCallback(
    async (e: React.FormEvent) => {
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
          throw new Error(err.error || "Failed");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No stream");

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
              } else if (data.type === "done") {
                setMessages((prev) => [
                  ...prev,
                  {
                    role: "assistant",
                    content: data.full_content || accumulated,
                    timestamp: new Date().toISOString(),
                  },
                ]);
                setStreamingContent("");
                setStreaming(false);
                // Mark unread if panel is collapsed
                if (mode === "bubble") setHasUnread(true);
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            } catch (parseErr) {
              if (
                parseErr instanceof Error &&
                parseErr.message !== "Unexpected end of JSON input"
              ) {
                throw parseErr;
              }
            }
          }
        }
      } catch (error) {
        setStreamingContent("");
        setStreaming(false);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              error instanceof Error
                ? `Error: ${error.message}`
                : "Error: Could not reach Claude.",
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, sessionId, mode]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest("form");
      if (form) form.requestSubmit();
    }
  };

  const newSession = () => {
    setSessionId(null);
    setMessages([]);
    setStreamingContent("");
  };

  // Don't render anything on chat page
  if (isOnChatPage) return null;

  // Bubble mode
  if (mode === "bubble") {
    return (
      <button
        className="chat-bubble"
        onClick={() => {
          setMode("window");
          setHasUnread(false);
        }}
        title="Chat with Claude (Cmd+K)"
      >
        <span className="text-lg">&#x1F4AC;</span>
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full" />
        )}
      </button>
    );
  }

  // Chat content (shared between window and sidebar modes)
  const chatContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Claude</span>
          <span className="badge badge-primary text-[9px]">Opus 4.6</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={newSession}
            className="text-xs text-muted-foreground hover:text-foreground px-1"
            title="New session"
          >
            +
          </button>
          {mode === "window" ? (
            <button
              onClick={() => setMode("sidebar")}
              className="text-xs text-muted-foreground hover:text-foreground px-1"
              title="Expand to sidebar"
            >
              &#8614;
            </button>
          ) : (
            <button
              onClick={() => setMode("window")}
              className="text-xs text-muted-foreground hover:text-foreground px-1"
              title="Collapse to window"
            >
              &#8612;
            </button>
          )}
          <button
            onClick={() => setMode("bubble")}
            className="text-xs text-muted-foreground hover:text-foreground px-1"
            title="Minimize"
          >
            &minus;
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && !streaming && (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">Ask Claude anything</p>
            <p className="text-[10px] mt-1">Cmd+K to toggle</p>
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
              className={`max-w-[85%] rounded-lg px-3 py-2 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="text-xs">
                  <MarkdownRenderer content={msg.content} />
                </div>
              ) : (
                <p className="text-xs whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {streaming && streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg px-3 py-2 bg-muted">
              <div className="text-xs">
                <MarkdownRenderer content={streamingContent} />
              </div>
            </div>
          </div>
        )}

        {loading && !streamingContent && (
          <div className="flex justify-start">
            <div className="rounded-lg px-3 py-2 bg-muted">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                <span
                  className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 border-t border-border flex-shrink-0">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            className="input flex-1 text-xs resize-none"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={1}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn btn-primary text-xs py-1 px-3 self-end"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </form>
    </>
  );

  // Window mode
  if (mode === "window") {
    return <div className="chat-window">{chatContent}</div>;
  }

  // Sidebar mode
  return (
    <>
      <div className="chat-sidebar">{chatContent}</div>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 z-50 bg-black/20 lg:hidden"
        onClick={() => setMode("bubble")}
      />
    </>
  );
}
