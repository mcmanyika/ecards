"use client";

import type { ChatMessage } from "@/types";

export function ChatMessageList({
  messages,
  loading,
}: {
  messages: ChatMessage[];
  loading: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
              m.role === "user"
                ? "rounded-br-md bg-zinc-900 text-white shadow-sm shadow-zinc-900/15 dark:bg-white dark:text-zinc-950 dark:shadow-white/10"
                : "rounded-bl-md border border-zinc-200/80 bg-white/90 text-zinc-900 dark:border-white/8 dark:bg-zinc-900/70 dark:text-zinc-100"
            }`}
          >
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        </div>
      ))}
      {loading && (
        <div className="flex justify-start">
          <div className="rounded-2xl rounded-bl-md border border-zinc-200/80 bg-white/90 px-4 py-3 dark:border-white/8 dark:bg-zinc-900/70">
            <div className="flex items-center gap-2.5 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
              </span>
              Thinking…
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
