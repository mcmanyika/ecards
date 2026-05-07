import { getAdminSessionWithOrg } from "@/lib/admin-org";
import {
  emptyEmployeeLanding,
  mergeLandingFromFirestore,
  sanitizeSlug,
} from "@/lib/landing-config";
import { getDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const COLLECTION = "landing_pages";

function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function GET() {
  const ctx = await getAdminSessionWithOrg();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const db = getDb();
    const snap = await db
      .collection(COLLECTION)
      .where("organizationId", "==", ctx.organizationId)
      .get();

    const rows = snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      const slug = d.id;
      const merged = mergeLandingFromFirestore(slug, data);
      return {
        slug,
        displayName: merged.displayName,
        published: merged.published,
        headline: merged.headline,
      };
    });

    rows.sort((a, b) => a.displayName.localeCompare(b.displayName));

    return NextResponse.json({ profiles: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to list employee profiles." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const ctx = await getAdminSessionWithOrg();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      displayName?: string;
      slug?: string;
    };
    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim() : "";
    const preferred =
      typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";

    const db = getDb();
    const baseSlug =
      sanitizeSlug(preferred) ||
      sanitizeSlug(slugifyName(displayName || "team-member")) ||
      "team-member";

    for (let i = 0; i < 16; i++) {
      const candidate =
        i === 0 ? baseSlug : `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
      const slug =
        sanitizeSlug(candidate) ||
        `member-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
      const ref = db.collection(COLLECTION).doc(slug);
      const existing = await ref.get();
      if (!existing.exists) {
        const cfg = emptyEmployeeLanding(slug, displayName);
        await ref.set({
          ...cfg,
          organizationId: ctx.organizationId,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        const merged = mergeLandingFromFirestore(
          slug,
          (await ref.get()).data() as Record<string, unknown>,
        );
        return NextResponse.json({ ok: true, slug, config: merged });
      }
    }

    return NextResponse.json(
      { error: "Could not allocate a unique URL slug." },
      { status: 409 },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to create profile." },
      { status: 500 },
    );
  }
}
