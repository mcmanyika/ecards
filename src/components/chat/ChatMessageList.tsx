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
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-1 py-2">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm ${
              m.role === "user"
                ? "bg-violet-600 text-white"
                : "bg-zinc-100 text-zinc-900 ring-1 ring-zinc-200 dark:bg-zinc-800/90 dark:text-zinc-100 dark:ring-white/10"
            }`}
          >
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        </div>
      ))}
      {loading && (
        <div className="flex justify-start">
          <div className="rounded-2xl bg-zinc-100 px-4 py-3 ring-1 ring-zinc-200 dark:bg-zinc-800/90 dark:ring-white/10">
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400" />
              </span>
              Thinking…
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
