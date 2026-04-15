import React, { useRef, useEffect, useState } from "react";
import { Send, Loader2, MessageSquare, AlertCircle, Trash2, Info } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { useRAGPipeline } from "../hooks/useRAGPipeline";
import type { ChatMessage, RAGStatus, RetrievedChunk } from "../types/rag";
import { cn } from "../lib/utils";

// ── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, message }: { status: RAGStatus; message: string }) {
  const config: Record<RAGStatus, { color: string; icon: React.ReactNode }> = {
    idle: { color: "bg-zinc-700", icon: null },
    "loading-model": { color: "bg-amber-900/60", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    indexing: { color: "bg-blue-900/60", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    ready: { color: "bg-emerald-900/60", icon: <div className="h-2 w-2 rounded-full bg-emerald-400" /> },
    searching: { color: "bg-purple-900/60", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    synthesizing: { color: "bg-indigo-900/60", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    error: { color: "bg-red-900/60", icon: <AlertCircle className="h-3 w-3" /> },
  };

  const { color, icon } = config[status];

  return (
    <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs", color)}>
      {icon}
      <span className="max-w-[200px] truncate">{message}</span>
    </div>
  );
}

// ── Chat Message Bubble ──────────────────────────────────────────────────────

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-secondary text-secondary-foreground rounded-bl-md",
        )}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
      </div>
    </div>
  );
}

// ── Retrieved Context Drawer ─────────────────────────────────────────────────

function ContextDrawer({ chunks }: { chunks: RetrievedChunk[] }) {
  const [open, setOpen] = useState(false);

  if (chunks.length === 0) return null;

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Info className="h-3 w-3" />
        {open ? "Hide" : "Show"} retrieved context ({chunks.length} chunks)
      </button>
      {open && (
        <div className="space-y-2 px-4 pb-3">
          {chunks.map((chunk, i) => (
            <div key={i} className="rounded-md border border-border bg-zinc-900/50 p-2.5 text-xs">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium text-muted-foreground">{chunk.section}</span>
                <span className="text-muted-foreground">
                  {(chunk.score * 100).toFixed(0)}% match
                </span>
              </div>
              <p className="whitespace-pre-wrap text-zinc-400 line-clamp-4">{chunk.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Loading Overlay ──────────────────────────────────────────────────────────

function LoadingOverlay({ status, message }: { status: RAGStatus; message: string }) {
  if (status !== "loading-model" && status !== "indexing") return null;

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="max-w-[280px] text-center text-sm text-muted-foreground">{message}</p>
      <p className="text-xs text-zinc-500">
        {status === "loading-model"
          ? "Downloading ~30 MB model (first run only)..."
          : "Generating embeddings for property data..."}
      </p>
    </div>
  );
}

// ── Main Panel ───────────────────────────────────────────────────────────────

export function PropertyQnAPanel() {
  const {
    status,
    statusMessage,
    messages,
    lastRetrievedChunks,
    sendMessage,
    resetChat,
    isReady,
    isBusy,
  } = useRAGPipeline();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  // Focus input when ready
  useEffect(() => {
    if (isReady && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isReady]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !isReady) return;
    setInput("");
    sendMessage(trimmed);
  };

  return (
    <div className="relative flex h-[600px] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Property Q&A</h2>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} message={statusMessage} />
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={resetChat} title="Clear chat">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      <LoadingOverlay status={status} message={statusMessage} />

      {/* Messages area */}
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="flex flex-col gap-3 p-4">
          {messages.length === 0 && isReady && (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <MessageSquare className="h-10 w-10 opacity-40" />
              <p className="text-sm">Ask me anything about this property!</p>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                {[
                  "How many bedrooms?",
                  "What's the HOA fee?",
                  "Tell me about amenities",
                  "Pet policy?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="rounded-full border border-border px-3 py-1 text-xs hover:bg-secondary transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatBubble key={i} message={msg} />
          ))}

          {isBusy && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {status === "searching" ? "Searching property specs..." : "Generating answer..."}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Context drawer */}
      <ContextDrawer chunks={lastRetrievedChunks} />

      {/* Input area */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-3">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isReady ? "Ask about this property..." : "Loading..."}
          disabled={!isReady && !isBusy}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!isReady || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {/* Error state */}
      {status === "error" && (
        <div className="border-t border-red-900/50 bg-red-950/30 px-4 py-2 text-xs text-red-300">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3" />
            {statusMessage}
          </div>
        </div>
      )}
    </div>
  );
}
