import { assertAdmin } from "@/lib/admin-session";
import { inferContactFromMessages } from "@/lib/extract-contact";
import { getDb } from "@/lib/firebase/admin";
import type { DocumentData } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function conversationSortMs(data: DocumentData): number {
  const updatedAt = data.updatedAt as { toMillis?: () => number } | undefined;
  const createdAt = data.createdAt as { toMillis?: () => number } | undefined;
  return Math.max(updatedAt?.toMillis?.() ?? 0, createdAt?.toMillis?.() ?? 0);
}

export async function GET() {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const snap = await getDb().collection("conversations").limit(100).get();

    const conversations = snap.docs
      .map((d) => {
        const data = d.data();
        const messages = Array.isArray(data.messages) ? data.messages : [];

        const rawContact = data.contact;
        let name = "";
        let email = "";
        let phone = "";
        if (rawContact && typeof rawContact === "object") {
          const c = rawContact as Record<string, unknown>;
          if (typeof c.name === "string") name = c.name;
          if (typeof c.email === "string") email = c.email;
          if (typeof c.phone === "string") phone = c.phone;
        }

        const inferred = inferContactFromMessages(
          messages.map((m: unknown) => {
            const x = m as { role?: string; content?: unknown };
            return { role: x.role, content: x.content };
          }),
        );
        if (!name.trim() && inferred.name?.trim()) name = inferred.name.trim();
        if (!email.trim() && inferred.email?.trim()) email = inferred.email.trim();
        if (!phone.trim() && inferred.phone?.trim()) phone = inferred.phone.trim();

        return {
          sortMs: conversationSortMs(data),
          row: {
            id: d.id,
            name,
            email,
            phone,
            createdAt:
              data.createdAt?.toDate?.()?.toISOString?.() ?? null,
            updatedAt:
              data.updatedAt?.toDate?.()?.toISOString?.() ?? null,
          },
        };
      })
      .sort((a, b) => b.sortMs - a.sortMs)
      .slice(0, 50)
      .map((x) => x.row);

    return NextResponse.json({ conversations });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load conversations." },
      { status: 500 },
    );
  }
}
