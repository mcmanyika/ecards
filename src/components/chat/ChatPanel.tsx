"use client";

import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { LeadCaptureModal } from "@/components/leads/LeadCaptureModal";
import { Button } from "@/components/ui/Button";
import type { ChatMessage } from "@/types";
import { useCallback, useState } from "react";

const MENU_OPTIONS = [
  "Help me choose the right package",
  "What services do you offer?",
  "Show pricing and engagement options",
] as const;

function ChevronIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-zinc-400 transition group-hover:translate-x-0.5 dark:text-zinc-500"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function ChatPanel({
  sheetEmbed = false,
  centered = false,
}: {
  /** Shorter fixed height for bottom-sheet / mobile embeds. */
  sheetEmbed?: boolean;
  /** Centered hero layout on the home page. */
  centered?: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [leadOpen, setLeadOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: text }),
      });
      const data = (await res.json()) as {
        reply?: string;
        conversationId?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Request failed.");
      }

      setConversationId(data.conversationId);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply ?? "",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      setInput(text);
    } finally {
      setLoading(false);
    }
  }, [conversationId, input, loading]);

  return (
    <div
      className={`glass-card flex flex-col overflow-hidden rounded-[1.75rem] ${
        sheetEmbed
          ? "h-[min(520px,72vh)] max-h-[78vh]"
          : centered
            ? "h-[min(560px,calc(100svh-16rem))]"
            : "h-[min(720px,calc(100vh-6rem))]"
      }`}
    >
      <header className="border-b border-zinc-200/80 px-5 py-4 dark:border-white/8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white">
                Message Partson
              </h2>
            </div>
            <p className="mt-1.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
              Ask about packages, pricing, or leave your contact details here.
            </p>
          </div>
          <div className="flex shrink-0 items-center">
            <Button
              variant="primary"
              onClick={() => setLeadOpen(true)}
              className="h-9 px-4 text-xs"
            >
              Get a quote
            </Button>
          </div>
        </div>
      </header>

      {toast && (
        <div className="mx-4 mt-3 rounded-2xl border border-emerald-500/25 bg-emerald-50/90 px-4 py-2.5 text-sm text-emerald-900 backdrop-blur dark:border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-100">
          {toast}
        </div>
      )}

      {messages.length === 0 && !loading && (
        <div className="mx-4 mt-4 space-y-2">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Quick start
          </p>
          <div className="grid gap-2">
            {MENU_OPTIONS.map((label) => (
              <button
                key={label}
                type="button"
                className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-zinc-200/90 bg-white/80 px-4 py-3 text-left text-sm text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-white/8 dark:bg-zinc-900/50 dark:text-zinc-100 dark:hover:border-white/12 dark:hover:bg-zinc-900"
                onClick={() => void send(label)}
              >
                <span>{label}</span>
                <ChevronIcon />
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mx-4 mt-3 rounded-2xl border border-rose-300/80 bg-rose-50/90 px-4 py-2.5 text-sm text-rose-900 dark:border-rose-500/25 dark:bg-rose-950/40 dark:text-rose-100">
          {error}
        </div>
      )}

      <ChatMessageList messages={messages} loading={loading} />

      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={send}
        disabled={loading}
      />

      <LeadCaptureModal
        open={leadOpen}
        conversationId={conversationId}
        onClose={() => setLeadOpen(false)}
        onSubmitted={(qualified) => {
          setToast(
            qualified
              ? "Thanks — you're on the list. Partson will reach out shortly."
              : "Thanks — your details are saved. Follow-up may still happen manually.",
          );
          window.setTimeout(() => setToast(null), 6000);
        }}
      />
    </div>
  );
}
