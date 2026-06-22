export interface ServicePackage {
  id: string;
  name: string;
  tagline: string;
  description: string;
  /** Display price e.g. "$750", "$4,000/mo", or "Quote" */
  startingAt: string;
  /** Optional hint for quote form budget field */
  minBudgetHint?: number;
}

export const SERVICE_PACKAGES: ServicePackage[] = [
  {
    id: "discovery",
    name: "Discovery",
    tagline: "Architecture & roadmap",
    description:
      "1–2 working sessions plus a written summary: scope, stack, timeline, and risks. Ideal when you need clarity before committing to a build.",
    startingAt: "from $750",
    minBudgetHint: 750,
  },
  {
    id: "presence",
    name: "Presence",
    tagline: "Link-in-bio + AI lead capture",
    description:
      "Branded landing page, contact links, AI chat, lead form, and admin inbox. Optional team member profiles for your organization.",
    startingAt: "from $2,500 setup",
    minBudgetHint: 2500,
  },
  {
    id: "build",
    name: "Build",
    tagline: "Custom web app / MVP",
    description:
      "Next.js or Django app with auth, admin, core workflows, and deployment. Scoped MVP with change control after launch.",
    startingAt: "from $20,000",
    minBudgetHint: 20000,
  },
  {
    id: "partner",
    name: "Partner",
    tagline: "Monthly retainer",
    description:
      "Fixed hours per month for roadmap grooming, bug fixes, and incremental features—fractional engineering without a full-time hire.",
    startingAt: "from $4,000/mo",
    minBudgetHint: 4000,
  },
];

export function getServicePackage(id: string): ServicePackage | undefined {
  return SERVICE_PACKAGES.find((p) => p.id === id);
}

export function serviceNeededLabel(pkg: ServicePackage): string {
  return `${pkg.name} — ${pkg.tagline}`;
}

export function formatPackagesForChatPrompt(): string {
  const lines = SERVICE_PACKAGES.map(
    (p) =>
      `- **${p.name}** (${p.tagline}): ${p.description} Starting at: ${p.startingAt}.`,
  );
  return `Service packages — this is the core of what you sell. When visitors ask what you offer, how to engage, or what something costs, lead with these tiers (starting-at pricing; final quote after discovery). Help them pick the best fit based on their goals. Do not invent other packages or exact fixed prices beyond what is listed:\n${lines.join("\n")}\n\nPackage-fit hints (use conversationally, not as a rigid script): Discovery = unclear scope; Presence = link-in-bio + leads; Build = custom app/MVP; Partner = ongoing retainer. After explaining options, invite them to use "Get a quote" or share name, email, and phone in chat.`;
}
