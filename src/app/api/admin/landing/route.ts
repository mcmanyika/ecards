import { assertAdmin } from "@/lib/admin-session";
import {
  DEFAULT_LANDING_SLUG,
  defaultLandingConfig,
  mergeLandingFromFirestore,
  normalizeLinkedInProfileUrl,
  normalizePrimaryCtaLabel,
  sanitizeSlug,
} from "@/lib/landing-config";
import { getDb } from "@/lib/firebase/admin";
import type {
  LandingGridLink,
  LandingPageConfig,
  LandingLinkAction,
} from "@/types/landing";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const COLLECTION = "landing_pages";

function parseBody(body: unknown): LandingPageConfig | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const slugRaw = typeof o.slug === "string" ? o.slug : DEFAULT_LANDING_SLUG;
  const slug = sanitizeSlug(slugRaw) ?? DEFAULT_LANDING_SLUG;

  let links: LandingGridLink[] = [];
  if (Array.isArray(o.links)) {
    for (const item of o.links) {
      if (!item || typeof item !== "object") continue;
      const x = item as Record<string, unknown>;
      const id =
        typeof x.id === "string" && x.id.trim()
          ? x.id.trim()
          : crypto.randomUUID();
      const label = typeof x.label === "string" ? x.label.trim() : "";
      const imageUrl = typeof x.imageUrl === "string" ? x.imageUrl.trim() : "";
      const action: LandingLinkAction = x.action === "chat" ? "chat" : "external";
      const href =
        typeof x.href === "string" ? x.href.trim() : "";
      if (!label) continue;
      links.push({
        id,
        label,
        imageUrl,
        action,
        href: action === "external" ? href : undefined,
      });
    }
  }

  const linkedinUrlNorm = normalizeLinkedInProfileUrl(
    typeof o.linkedinUrl === "string" ? o.linkedinUrl : "",
  );
  if (linkedinUrlNorm) {
    links = links.filter(
      (l) =>
        !(
          l.action === "external" &&
          l.href &&
          /linkedin\.com/i.test(l.href)
        ),
    );
  }

  const cfg: LandingPageConfig = {
    slug,
    published: Boolean(o.published),
    bannerUrl: typeof o.bannerUrl === "string" ? o.bannerUrl.trim() : "",
    avatarUrl: typeof o.avatarUrl === "string" ? o.avatarUrl.trim() : "",
    badgeUrl: typeof o.badgeUrl === "string" ? o.badgeUrl.trim() : "",
    displayName:
      typeof o.displayName === "string" && o.displayName.trim()
        ? o.displayName.trim()
        : defaultLandingConfig(slug).displayName,
    headline:
      typeof o.headline === "string" && o.headline.trim()
        ? o.headline.trim()
        : defaultLandingConfig(slug).headline,
    subheadline:
      typeof o.subheadline === "string" ? o.subheadline.trim() : "",
    location: typeof o.location === "string" ? o.location.trim() : "",
    bio: typeof o.bio === "string" ? o.bio.trim() : "",
    hashtags: typeof o.hashtags === "string" ? o.hashtags.trim() : "",
    primaryCtaLabel: normalizePrimaryCtaLabel(
      typeof o.primaryCtaLabel === "string" ? o.primaryCtaLabel : "",
      "Lets Talk",
    ),
    linkedinUrl: linkedinUrlNorm,
    links: links.slice(0, 24),
  };

  return cfg;
}

export async function GET(req: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const slugParam = searchParams.get("slug") ?? DEFAULT_LANDING_SLUG;
  const slug = sanitizeSlug(slugParam) ?? DEFAULT_LANDING_SLUG;

  try {
    const snap = await getDb().collection(COLLECTION).doc(slug).get();
    const merged = mergeLandingFromFirestore(
      slug,
      snap.exists ? (snap.data() as Record<string, unknown>) : undefined,
    );
    return NextResponse.json({ config: merged, exists: snap.exists });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load landing configuration." },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as unknown;
    const cfg = parseBody(body);
    if (!cfg) {
      return NextResponse.json({ error: "Invalid body." }, { status: 400 });
    }

    const ref = getDb().collection(COLLECTION).doc(cfg.slug);
    await ref.set(
      {
        ...cfg,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const snap = await ref.get();
    const merged = mergeLandingFromFirestore(
      cfg.slug,
      snap.data() as Record<string, unknown>,
    );
    return NextResponse.json({ ok: true, config: merged });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to save landing configuration." },
      { status: 500 },
    );
  }
}
