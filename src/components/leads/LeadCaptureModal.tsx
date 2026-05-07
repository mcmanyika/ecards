"use client";

import { LeadCaptureForm } from "@/components/leads/LeadCaptureForm";

export function LeadCaptureModal({
  open,
  conversationId,
  onClose,
  onSubmitted,
}: {
  open: boolean;
  conversationId?: string;
  onClose: () => void;
  onSubmitted?: (qualified: boolean) => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm dark:bg-black/65"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-modal-title"
    >
      <div className="relative w-full max-w-lg">
        <LeadCaptureForm
          key={conversationId ?? "anon"}
          conversationId={conversationId}
          onClose={onClose}
          onSubmitted={onSubmitted}
        />
      </div>
    </div>
  );
}
