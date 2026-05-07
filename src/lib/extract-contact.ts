import { isValidEmail } from "@/lib/email";

export type ContactFields = {
  name?: string;
  email?: string;
  phone?: string;
};

export type ChatMsgLike = {
  role?: string;
  content?: unknown;
};

function clipNameCandidate(raw: string): string {
  let n = raw.trim().replace(/\s+/g, " ");
  n = n.replace(/\*\*$/, "").replace(/^\*\*/, "").trim();
  const stop = n.search(/[.,!?]/);
  if (stop >= 2) n = n.slice(0, stop).trim();
  if (n.length > 80) n = n.slice(0, 80).trim();
  return n;
}

function isPlausiblePersonName(n: string): boolean {
  if (n.length < 2 || n.length > 80) return false;
  if (/@/.test(n)) return false;
  if (/^\d+$/.test(n.replace(/[\s().-]/g, ""))) return false;
  return /[A-Za-z]/.test(n);
}

/**
 * Pull a display name from a single message (user phrasing or assistant echo).
 */
export function extractNameFromText(text: string): string | undefined {
  const t = text.trim();
  if (!t) return undefined;

  const patterns: RegExp[] = [
    /(?:my name is|my name's|i'?m|i am|call me|this is|name is|it's)\s+([A-Za-z][A-Za-z\s.'-]{0,58})(?=\s*[.,!?*\n]|$)/i,
    /\*\*Name:\*\*\s*([^*\n]+)/i,
    /(?:^|[\n\r])[\t ]*[-*][\t ]+(?:\*\*)?Name(?:\*\*)?\s*:\s*(.+)/im,
    /(?:^|[\n\r])[\t ]*(?:\*\*)?Name(?:\*\*)?\s*:\s*(.+)/im,
  ];

  for (const re of patterns) {
    const m = t.match(re);
    if (!m?.[1]) continue;
    const n = clipNameCandidate(m[1]);
    if (isPlausiblePersonName(n)) return n;
  }

  return undefined;
}

export function extractContactFromUserMessage(text: string): Partial<ContactFields> {
  const out: Partial<ContactFields> = {};
  const t = text.trim();
  if (!t) return out;

  const emailMatch = t.match(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
  );
  if (emailMatch && isValidEmail(emailMatch[0])) {
    out.email = emailMatch[0].trim().toLowerCase();
  }

  const phone = extractPhone(t);
  if (phone) out.phone = phone;

  const name = extractNameFromText(t);
  if (name) out.name = name;

  return out;
}

/**
 * Best-effort contact fields from full thread (fills gaps when stored `contact` is incomplete).
 */
export function inferContactFromMessages(
  messages: ChatMsgLike[],
): Partial<ContactFields> {
  const inferred: Partial<ContactFields> = {};

  const userChunks: string[] = [];
  const assistantChunks: string[] = [];

  for (const m of messages) {
    const content = typeof m.content === "string" ? m.content : "";
    if (!content.trim()) continue;
    if (m.role === "assistant") assistantChunks.push(content);
    else userChunks.push(content);
  }

  for (const chunk of userChunks) {
    const part = extractContactFromUserMessage(chunk);
    if (part.email && !inferred.email) inferred.email = part.email;
    if (part.phone && !inferred.phone) inferred.phone = part.phone;
    if (part.name && !inferred.name) inferred.name = part.name;
  }

  if (!inferred.name) {
    for (const chunk of [...userChunks, ...assistantChunks]) {
      const n = extractNameFromText(chunk);
      if (n) {
        inferred.name = n;
        break;
      }
    }
  }

  return inferred;
}

function extractPhone(text: string): string | undefined {
  for (const m of text.matchAll(/\+?\d[\d\s().-]{8,}\d/g)) {
    const digits = m[0].replace(/\D/g, "");
    if (digits.length >= 10 && digits.length <= 15) {
      return m[0].replace(/\s+/g, " ").trim();
    }
  }

  const short = text.match(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/);
  if (short) {
    const digits = short[0].replace(/\D/g, "");
    if (digits.length === 10) return short[0].trim();
  }

  return undefined;
}
