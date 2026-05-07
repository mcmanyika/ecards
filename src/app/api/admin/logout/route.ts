import {
  ADMIN_SESSION_COOKIE,
  LEGACY_ADMIN_COOKIE,
} from "@/lib/admin-firebase-session";
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const clear = {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
  res.cookies.set(ADMIN_SESSION_COOKIE, "", clear);
  res.cookies.set(LEGACY_ADMIN_COOKIE, "", clear);
  return res;
}
