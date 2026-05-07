import type {
  LandingGridLink,
  LandingPageConfig,
  LandingLinkAction,
} from "@/types/landing";

export const DEFAULT_LANDING_SLUG = "main";

/** Fresh link-in-bio for a new team member (minimal copy; client-specific defaults). */
export function emptyEmployeeLanding(
  slug: string,
  displayName: string,
): LandingPageConfig {
  const dm = displayName.trim() || "Team member";
  return {
    slug,
    published: false,
    bannerUrl: "",
    avatarUrl: "",
    badgeUrl: "",
    displayName: dm,
    headline: "Role · title",
    subheadline: "",
    location: "",
    bio: "",
    hashtags: "",
    primaryCtaLabel: "Lets Talk",
    linkedinUrl: "",
    contactPhone: "",
    contactEmail: "",
    websiteUrl: "",
    links: [],
  };
}

export function defaultLandingConfig(slug: string): LandingPageConfig {
  return {
    slug,
    published: false,
    bannerUrl: "",
    avatarUrl: "/image/manyika.jpeg",
    badgeUrl: "",
    displayName: "Partson Manyika",
    headline:
      "Founder | Full-Stack Developer | Data Engineer | SaaS Builder · Python · Django · AWS · SQL · Next.js",
    subheadline: "LoadMaster TMS",
    location: "Dallas, TX",
    bio:
      "Full-stack developer, entrepreneur, and technology builder with 25+ years of experience in web apps, SaaS, and data-driven products. Based in Dallas, I work across Python, Django, SQL/PostgreSQL, AWS, Next.js, React, Firebase, and modern frontend—plus Solidity/blockchain integrations where relevant. Creator of LoadMaster, a transportation management platform for carriers, dispatchers, and fleet ops. Freelance full-stack & data engineer since 2010 (among other full-time and contract roles over 25+ years): logistics tech, education, blockchain apps, dashboards, REST APIs, and cloud systems. Building products that solve real operational problems and deliver measurable business value.",
    hashtags:
      "#LoadMaster #SaaS #DataEngineering #AWS #Python #Django #NextJs #React #PostgreSQL #LogisticsTech #StartupFounder #Firebase #Blockchain",
    primaryCtaLabel: "Lets Talk",
    linkedinUrl: "",
    contactPhone: "",
    contactEmail: "",
    websiteUrl: "",
    links: [],
  };
}

function normalizeImageUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  // Legacy root path after moving asset to `public/image/manyika.jpeg`
  if (/^\/?manyika\.jpeg$/i.test(t)) {
    return "/image/manyika.jpeg";
  }
  if (
    t.startsWith("/") ||
    /^https?:\/\//i.test(t) ||
    /^data:/i.test(t) ||
    /^blob:/i.test(t)
  ) {
    return t;
  }
  return `/${t.replace(/^\.?\/*/, "")}`;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

/** Maps legacy stored label + empty string to current default. */
export function normalizePrimaryCtaLabel(raw: string, fallback: string): string {
  const t = raw.trim();
  if (!t) return fallback;
  if (/^save\s+contact$/i.test(t)) return "Lets Talk";
  return t;
}

/** Ensures https:// for pasted LinkedIn URLs. */
export function normalizeLinkedInProfileUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t.replace(/^\/+/, "")}`;
}

/** Ensures https:// for pasted website URLs (not mailto/tel). */
export function normalizeWebsiteUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^mailto:/i.test(t) || /^tel:/i.test(t)) return t;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t.replace(/^\/+/, "")}`;
}

function action(v: unknown): LandingLinkAction {
  return v === "chat" ? "chat" : "external";
}

function normalizeLink(raw: unknown): LandingGridLink | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = str(o.id);
  const label = str(o.label);
  const rawImg = str(o.imageUrl).trim();
  const imageUrl = rawImg ? normalizeImageUrl(rawImg) : "";
  if (!id || !label) return null;
  const a = action(o.action);
  const href = str(o.href);
  return {
    id,
    label,
    imageUrl,
    action: a,
    href: a === "external" ? href : undefined,
  };
}

export function mergeLandingFromFirestore(
  slug: string,
  data: Record<string, unknown> | undefined,
): LandingPageConfig {
  const base = defaultLandingConfig(slug);
  if (!data) return base;

  const linksRaw = Array.isArray(data.links) ? data.links : [];
  const links = linksRaw
    .map(normalizeLink)
    .filter((x): x is LandingGridLink => x !== null);

  const linkedinUrl = normalizeLinkedInProfileUrl(str(data.linkedinUrl, ""));
  const websiteUrl = normalizeWebsiteUrl(str(data.websiteUrl, ""));

  const bannerRaw = str(data.bannerUrl).trim();
  const avatarRaw = str(data.avatarUrl).trim();
  const badgeRaw = str(data.badgeUrl).trim();

  return {
    slug,
    published: Boolean(data.published),
    bannerUrl: bannerRaw ? normalizeImageUrl(bannerRaw) : base.bannerUrl,
    avatarUrl: avatarRaw ? normalizeImageUrl(avatarRaw) : base.avatarUrl,
    badgeUrl: badgeRaw ? normalizeImageUrl(badgeRaw) : base.badgeUrl,
    displayName: str(data.displayName, base.displayName),
    headline: str(data.headline, base.headline),
    subheadline: str(data.subheadline),
    location: str(data.location),
    bio: str(data.bio),
    hashtags: str(data.hashtags),
    primaryCtaLabel: normalizePrimaryCtaLabel(
      str(data.primaryCtaLabel, ""),
      base.primaryCtaLabel,
    ),
    linkedinUrl,
    contactPhone: str(data.contactPhone),
    contactEmail: str(data.contactEmail).trim(),
    websiteUrl,
    links,
  };
}

export function sanitizeSlug(raw: string): string | null {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (s.length < 1 || s.length > 64) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) return null;
  return s;
}
