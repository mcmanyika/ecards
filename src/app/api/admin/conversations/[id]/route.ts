import { assertAdmin } from "@/lib/admin-session";
import { inferContactFromMessages } from "@/lib/extract-contact";
import { getDb } from "@/lib/firebase/admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await ctx.params;
  try {
    const doc = await getDb().collection("conversations").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const data = doc.data()!;
    const messages = Array.isArray(data.messages) ? data.messages : [];

    const normalized = messages.map(
      (
        m: { role?: string; content?: string; createdAt?: { toDate?: () => Date } },
        idx: number,
      ) => ({
        id: String(idx),
        role: m.role,
        content: m.content ?? "",
        createdAt: m.createdAt?.toDate?.()?.toISOString?.() ?? null,
      }),
    );

    const stored =
      data.contact && typeof data.contact === "object"
        ? ({ ...(data.contact as Record<string, string>) })
        : ({} as Record<string, string>);

    const inferred = inferContactFromMessages(
      messages.map((m: unknown) => {
        const x = m as { role?: string; content?: unknown };
        return { role: x.role, content: x.content };
      }),
    );
    for (const key of ["name", "email", "phone"] as const) {
      const v = inferred[key];
      if (typeof v === "string" && v.trim() && !stored[key]?.trim()) {
        stored[key] = v.trim();
      }
    }

    const contact =
      stored.name?.trim() || stored.email?.trim() || stored.phone?.trim()
        ? stored
        : null;

    return NextResponse.json({
      id: doc.id,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? null,
      contact,
      contactCapturedAt:
        data.contactCapturedAt?.toDate?.()?.toISOString?.() ?? null,
      messages: normalized,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load conversation." },
      { status: 500 },
    );
  }
}
