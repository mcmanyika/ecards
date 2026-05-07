import { isValidEmail } from "@/lib/email";
import type { LeadPayload } from "@/types";

const DIGITS_ONLY = /\D/g;

const MIN_PHONE_DIGITS = 10;

export function isQualifiedLead(payload: LeadPayload): boolean {
  const digits = payload.phone.replace(DIGITS_ONLY, "").length;
  if (
    !payload.name.trim() ||
    !isValidEmail(payload.email) ||
    digits < MIN_PHONE_DIGITS ||
    !payload.serviceNeeded.trim() ||
    !payload.budget.trim() ||
    !payload.preferredAppointmentDate.trim()
  ) {
    return false;
  }
  const n = Number(String(payload.budget).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n < 250) {
    return false;
  }
  return true;
}
