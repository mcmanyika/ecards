import {
  ADMIN_SESSION_COOKIE,
  LEGACY_ADMIN_COOKIE,
  parseAllowedAdminEmails,
  verifyAdminSession,
} from "@/lib/admin-firebase-session";

export {
  ADMIN_SESSION_COOKIE,
  LEGACY_ADMIN_COOKIE,
  parseAllowedAdminEmails,
  verifyAdminSession,
};

export async function assertAdmin(): Promise<boolean> {
  const session = await verifyAdminSession();
  return session !== null;
}
