import {
  ADMIN_SESSION_COOKIE,
  parseAllowedAdminEmails,
} from "@/lib/admin-firebase-session";
import { getAdminAuth, getDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SESSION_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000;

const MISSING_ALLOWLIST_MSG =
  "ALLOWED_ADMIN_EMAILS is not set on this server. Add it to your environment (comma-separated emails, e.g. admin@yourdomain.com), redeploy or restart, then register or sign in again. For local dev, put it in .env.local.";

export async function POST(req: Request) {
  try {
    const allowed = parseAllowedAdminEmails();

    const body = (await req.json()) as { idToken?: string };
    const idToken = typeof body.idToken === "string" ? body.idToken.trim() : "";
    if (!idToken) {
      return NextResponse.json({ error: "idToken is required." }, { status: 400 });
    }

    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const emailLower = decoded.email?.trim().toLowerCase();
    if (!emailLower || !decoded.email) {
      return NextResponse.json(
        { error: "Signed-in account must have an email address." },
        { status: 403 },
      );
    }

    const db = getDb();
    const adminRef = db.collection("admins").doc(decoded.uid);
    const existing = await adminRef.get();

    if (!existing.exists) {
      if (allowed.size === 0) {
        return NextResponse.json({ error: MISSING_ALLOWLIST_MSG }, { status: 500 });
      }
      if (!allowed.has(emailLower)) {
        return NextResponse.json(
          {
            error:
              "This email is not on the admin allowlist. Add it to ALLOWED_ADMIN_EMAILS, restart the server, then try again.",
          },
          { status: 403 },
        );
      }
      await adminRef.set({
        email: decoded.email,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
    });
    return res;
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : "Session login failed.";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
