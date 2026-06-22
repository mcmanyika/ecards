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
      className="border-t border-zinc-200/80 p-4 dark:border-white/8"
    >
      <div className="flex items-end gap-2 rounded-2xl border border-zinc-200/90 bg-zinc-50/90 p-1.5 shadow-inner shadow-zinc-900/5 dark:border-white/10 dark:bg-zinc-950/60 dark:shadow-black/20">
        <textarea
          rows={1}
          placeholder="Ask about packages, pricing, or your project…"
          className="max-h-36 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] text-zinc-900 placeholder:text-zinc-500 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-600"
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
          className="h-10 shrink-0 px-5"
        >
          Send
        </Button>
      </div>
    </form>
  );
}
