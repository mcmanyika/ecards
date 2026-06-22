"use client";

import { Button } from "@/components/ui/Button";
import {
  SERVICE_PACKAGES,
  getServicePackage,
  serviceNeededLabel,
} from "@/lib/service-packages";
import type { LeadPayload } from "@/types";
import { useState } from "react";

const CONTACT_STEPS = [
  { key: "name" as const, label: "Your name", type: "text" as const, placeholder: "Jane Doe" },
  { key: "email" as const, label: "Work email", type: "email" as const, placeholder: "you@company.com" },
  { key: "phone" as const, label: "Phone", type: "tel" as const, placeholder: "+1 (555) 123-4567" },
];

const TAIL_STEPS = [
  { key: "budget" as const, label: "Budget (USD)", type: "text" as const, placeholder: "e.g. 5000 or 10k–15k" },
  { key: "preferredAppointmentDate" as const, label: "Preferred appointment", type: "date" as const, placeholder: "" },
];

const STEP_COUNT = CONTACT_STEPS.length + 1 + TAIL_STEPS.length;

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
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [customService, setCustomService] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const packageStepIndex = CONTACT_STEPS.length;
  const isPackageStep = step === packageStepIndex;
  const progress = ((step + 1) / STEP_COUNT) * 100;

  function tailStepIndex(): number {
    return step - packageStepIndex - 1;
  }

  function currentTailStep() {
    return TAIL_STEPS[tailStepIndex()]!;
  }

  async function submitFinal(payload: LeadPayload) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          conversationId: conversationId ?? payload.conversationId,
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

  function resolveServiceNeeded(): string {
    if (selectedPackageId === "other") {
      return customService.trim();
    }
    const pkg = selectedPackageId ? getServicePackage(selectedPackageId) : null;
    return pkg ? serviceNeededLabel(pkg) : values.serviceNeeded.trim();
  }

  function next() {
    setError(null);

    if (step < CONTACT_STEPS.length) {
      const contactStep = CONTACT_STEPS[step]!;
      const v = values[contactStep.key]?.trim?.() ?? "";
      if (!v) {
        setError(`Please enter ${contactStep.label.toLowerCase()}.`);
        return;
      }
      setStep((s) => s + 1);
      return;
    }

    if (isPackageStep) {
      const service = resolveServiceNeeded();
      if (!service) {
        setError("Please select a package or describe what you need.");
        return;
      }
      const pkg =
        selectedPackageId && selectedPackageId !== "other"
          ? getServicePackage(selectedPackageId)
          : null;
      setValues((prev) => ({
        ...prev,
        serviceNeeded: service,
        budget:
          !prev.budget.trim() && pkg?.minBudgetHint
            ? String(pkg.minBudgetHint)
            : prev.budget,
      }));
      setStep((s) => s + 1);
      return;
    }

    const tail = currentTailStep();
    const v = values[tail.key]?.trim?.() ?? "";
    if (!v) {
      setError(`Please enter ${tail.label.toLowerCase()}.`);
      return;
    }
    if (step >= STEP_COUNT - 1) {
      void submitFinal(values);
      return;
    }
    setStep((s) => s + 1);
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  function selectPackage(id: string) {
    setSelectedPackageId(id);
    setError(null);
    if (id !== "other") {
      const pkg = getServicePackage(id);
      if (pkg) {
        setValues((prev) => ({
          ...prev,
          serviceNeeded: serviceNeededLabel(pkg),
          budget: prev.budget.trim()
            ? prev.budget
            : pkg.minBudgetHint
              ? String(pkg.minBudgetHint)
              : prev.budget,
        }));
      }
    }
  }

  const contactStep = step < CONTACT_STEPS.length ? CONTACT_STEPS[step] : null;
  const tailStep = step > packageStepIndex ? currentTailStep() : null;

  return (
    <div className="glass-card rounded-[1.75rem] p-6 shadow-2xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3
            id="lead-modal-title"
            className="text-xl font-semibold text-zinc-900 dark:text-white"
          >
            Book a consultation
          </h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Step {step + 1} of {STEP_COUNT} · qualified leads email Partson
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
          className="h-full rounded-full bg-zinc-900 transition-[width] duration-300 dark:bg-zinc-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {contactStep && (
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {contactStep.label}
          <input
            type={contactStep.type}
            autoFocus
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-[15px] text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-500/60 focus:outline-none focus:ring-2 focus:ring-zinc-500/25 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600 dark:focus:border-zinc-400/50"
            placeholder={contactStep.placeholder}
            value={values[contactStep.key]}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, [contactStep.key]: e.target.value }))
            }
          />
        </label>
      )}

      {isPackageStep && (
        <fieldset>
          <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Which package fits best?
          </legend>
          <div className="mt-3 grid gap-2">
            {SERVICE_PACKAGES.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => selectPackage(pkg.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  selectedPackageId === pkg.id
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                    : "border-zinc-200/90 bg-white/80 text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50 dark:border-white/8 dark:bg-zinc-900/50 dark:text-zinc-100 dark:hover:border-white/12 dark:hover:bg-zinc-900"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium">{pkg.name}</span>
                  <span
                    className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide ${
                      selectedPackageId === pkg.id
                        ? "text-zinc-300 dark:text-zinc-500"
                        : "text-zinc-500"
                    }`}
                  >
                    {pkg.startingAt}
                  </span>
                </div>
                <span
                  className={`mt-0.5 block text-xs ${
                    selectedPackageId === pkg.id
                      ? "text-zinc-300 dark:text-zinc-500"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {pkg.tagline}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => selectPackage("other")}
              className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                selectedPackageId === "other"
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                  : "border-zinc-200/90 bg-white/80 text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50 dark:border-white/8 dark:bg-zinc-900/50 dark:text-zinc-100 dark:hover:border-white/12 dark:hover:bg-zinc-900"
              }`}
            >
              <span className="font-medium">Something else</span>
              <span
                className={`mt-0.5 block text-xs ${
                  selectedPackageId === "other"
                    ? "text-zinc-300 dark:text-zinc-500"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                Describe your project
              </span>
            </button>
          </div>
          {selectedPackageId === "other" && (
            <input
              type="text"
              autoFocus
              className="mt-3 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-[15px] text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-500/60 focus:outline-none focus:ring-2 focus:ring-zinc-500/25 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600"
              placeholder="e.g. API integration, admin dashboard, mobile-friendly portal"
              value={customService}
              onChange={(e) => setCustomService(e.target.value)}
            />
          )}
        </fieldset>
      )}

      {tailStep && (
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {tailStep.label}
          <input
            type={tailStep.type}
            autoFocus
            className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-[15px] text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-500/60 focus:outline-none focus:ring-2 focus:ring-zinc-500/25 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600 dark:focus:border-zinc-400/50"
            placeholder={tailStep.placeholder}
            value={values[tailStep.key]}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, [tailStep.key]: e.target.value }))
            }
          />
        </label>
      )}

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
            {step >= STEP_COUNT - 1 ? (submitting ? "Sending…" : "Submit") : "Continue"}
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
