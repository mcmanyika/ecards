"use client";

import { Button } from "@/components/ui/Button";
import type { LeadPayload } from "@/types";
import { useState } from "react";

const STEPS = [
  { key: "name" as const, label: "Your name", type: "text", placeholder: "Jane Doe" },
  { key: "email" as const, label: "Work email", type: "email", placeholder: "you@company.com" },
  { key: "phone" as const, label: "Phone", type: "tel", placeholder: "+1 (555) 123-4567" },
  { key: "serviceNeeded" as const, label: "Service needed", type: "text", placeholder: "e.g. strategy workshop, implementation, audit" },
  { key: "budget" as const, label: "Budget (USD)", type: "text", placeholder: "e.g. 5000 or 10k–15k" },
  { key: "preferredAppointmentDate" as const, label: "Preferred appointment", type: "date", placeholder: "" },
];

const initial: LeadPayload = {
  conversationId: undefined,
  name: "",
  email: "",
  phone: "",
  serviceNeeded: "",
  budget: "",
  preferredAppointmentDate: "",
};

export function LeadCaptureForm({
  conversationId,
  onClose,
  onSubmitted,
}: {
  conversationId?: string;
  onClose: () => void;
  onSubmitted?: (qualified: boolean) => void;
}) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<LeadPayload>({
    ...initial,
    conversationId,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = STEPS[step]!;
  const progress = ((step + 1) / STEPS.length) * 100;

  async function submitFinal() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          conversationId: conversationId ?? values.conversationId,
        }),
      });
      const data = (await res.json()) as {
        qualified?: boolean;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not submit.");
      onSubmitted?.(Boolean(data.qualified));
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    const v = values[current.key]?.trim?.() ?? "";
    if (!v) {
      setError(`Please enter ${current.label.toLowerCase()}.`);
      return;
    }
    setError(null);
    if (step >= STEPS.length - 1) {
      void submitFinal();
      return;
    }
    setStep((s) => s + 1);
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-zinc-900">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3
            id="lead-modal-title"
            className="text-xl font-semibold text-zinc-900 dark:text-white"
          >
            Book a consultation
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Step {step + 1} of {STEPS.length} · qualified leads notify our team by email
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="mb-6 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {current.label}
        <input
          type={current.type}
          autoFocus
          className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-[15px] text-zinc-900 placeholder:text-zinc-500 focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/25 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600 dark:focus:border-violet-500/50"
          placeholder={current.placeholder}
          value={values[current.key]}
          onChange={(e) =>
            setValues((prev) => ({ ...prev, [current.key]: e.target.value }))
          }
        />
      </label>

      {error && (
        <p className="mt-3 text-sm text-rose-700 dark:text-rose-300">{error}</p>
      )}

      <div className="mt-8 flex flex-wrap justify-between gap-3">
        <Button variant="ghost" type="button" onClick={back} disabled={step === 0 || submitting}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={next} disabled={submitting}>
            {step >= STEPS.length - 1 ? (submitting ? "Sending…" : "Submit") : "Continue"}
          </Button>
        </div>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
        Qualified leads meet validation rules (complete profile, valid email, phone with at least 10 digits,
        numeric budget of at least $250). Configure Resend + NOTIFY_EMAIL to receive alerts.
      </p>
    </div>
  );
}
