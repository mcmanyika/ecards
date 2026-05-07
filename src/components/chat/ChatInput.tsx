"use client";

import { Button } from "@/components/ui/Button";
import type { FormEvent } from "react";

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-zinc-200 bg-zinc-50/95 p-3 backdrop-blur dark:border-white/10 dark:bg-zinc-950/80"
    >
      <div className="flex gap-2">
        <textarea
          rows={1}
          placeholder="Ask anything…"
          className="max-h-40 min-h-[48px] flex-1 resize-none rounded-xl border border-zinc-300 bg-white px-3 py-3 text-[15px] text-zinc-900 placeholder:text-zinc-500 focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/25 dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-100 dark:focus:border-violet-500/50 dark:focus:ring-violet-500/20"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button
          type="submit"
          variant="primary"
          disabled={disabled || !value.trim()}
          className="shrink-0 self-end px-5"
        >
          Send
        </Button>
      </div>
    </form>
  );
}
