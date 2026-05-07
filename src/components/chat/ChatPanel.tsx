"use client";

import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import { LeadCaptureModal } from "@/components/leads/LeadCaptureModal";
import { Button } from "@/components/ui/Button";
import type { ChatMessage } from "@/types";
import { useCallback, useState } from "react";

const MENU_OPTIONS = [
  "Tell me about LoadMaster features",
  "What services do you offer?",
  "Show pricing and engagement options",
] as const;

export function ChatPanel({
  sheetEmbed = false,
}: {
  /** Shorter fixed height for bottom-sheet / mobile embeds. */
  sheetEmbed?: boolean;
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
      className={`flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/90 shadow-xl shadow-zinc-400/15 backdrop-blur dark:border-white/10 dark:bg-zinc-900/40 dark:shadow-2xl dark:shadow-zinc-950/35 ${
        sheetEmbed
          ? "h-[min(520px,72vh)] max-h-[78vh]"
          : "h-[min(720px,calc(100vh-12rem))]"
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-white/10">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
            Message Partson
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            LoadMaster, SaaS, data & full-stack—or leave your{" "}
            <strong className="font-medium">name</strong>,{" "}
            <strong className="font-medium">email</strong>,{" "}
            <strong className="font-medium">phone</strong> on this thread. Use{" "}
            <strong className="font-medium">Get a quote</strong> for budget &
            scheduling.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => setLeadOpen(true)}
          className="text-xs"
        >
          Get a quote
        </Button>
      </header>

      {toast && (
        <div className="mx-5 mt-3 rounded-xl border border-emerald-500/35 bg-emerald-50 px-4 py-2 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/50 dark:text-emerald-100">
          {toast}
        </div>
      )}

      {messages.length === 0 && !loading && (
        <div className="mx-5 mt-4 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-950 dark:border-violet-500/20 dark:bg-violet-950/30 dark:text-violet-100/90">
          <p className="font-semibold">Menu</p>
          <p className="mt-1">
            Pick one to start quickly, or type your own question.
          </p>
          <div className="mt-3 grid gap-2">
            {MENU_OPTIONS.map((label) => (
              <button
                key={label}
                type="button"
                className="rounded-xl border border-violet-300/70 bg-white px-3 py-2 text-left text-sm text-violet-950 transition hover:bg-violet-100 dark:border-violet-400/30 dark:bg-zinc-900/70 dark:text-violet-100 dark:hover:bg-violet-900/35"
                onClick={() => void send(label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mx-5 mt-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-100">
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
              ? "Thanks — you’re on our radar. A teammate will reach out shortly."
              : "Thanks — we saved your details. Our team may still follow up manually.",
          );
          window.setTimeout(() => setToast(null), 6000);
        }}
      />
    </div>
  );
}
