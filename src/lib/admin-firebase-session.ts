import { getAdminAuth, getDb } from "@/lib/firebase/admin";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "fb_admin_session";

export const LEGACY_ADMIN_COOKIE = "admin_session";

export function parseAllowedAdminEmails(): Set<string> {
  const raw = process.env.ALLOWED_ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function verifyAdminSession(): Promise<{
  uid: string;
  email: string | undefined;
} | null> {
  const store = await cookies();
  const session = store.get(ADMIN_SESSION_COOKIE)?.value;
  const legacySession = store.get(LEGACY_ADMIN_COOKIE)?.value;

  if (legacySession) {
    const expected = process.env.ADMIN_SESSION_TOKEN?.trim();
    if (expected && legacySession === expected) {
      return { uid: "legacy-admin", email: undefined };
    }
  }

  if (!session) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(session, true);
    const adminSnap = await getDb().collection("admins").doc(decoded.uid).get();
    if (!adminSnap.exists) return null;
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}
