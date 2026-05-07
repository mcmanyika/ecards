import { assertAdmin } from "@/lib/admin-session";
import { getDb } from "@/lib/firebase/admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const snap = await getDb().collection("leads").limit(150).get();

    const leads = snap.docs
      .map((d) => {
        const data = d.data();
        const createdAt = data.createdAt as { toMillis?: () => number } | undefined;
        return {
          sortMs: createdAt?.toMillis?.() ?? 0,
          row: {
            id: d.id,
            ...data,
            createdAt:
              data.createdAt?.toDate?.()?.toISOString?.() ?? null,
          },
        };
      })
      .sort((a, b) => b.sortMs - a.sortMs)
      .slice(0, 100)
      .map((x) => x.row);

    return NextResponse.json({ leads });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load leads." },
      { status: 500 },
    );
  }
}
