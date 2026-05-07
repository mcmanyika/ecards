/* eslint-disable @next/next/no-img-element -- arbitrary admin image URLs */
"use client";

import { ChatPanel } from "@/components/chat/ChatPanel";
import {
  normalizeLinkedInProfileUrl,
  normalizeWebsiteUrl,
} from "@/lib/landing-config";
import type { LandingGridLink, LandingPageConfig } from "@/types/landing";
import { useCallback, useEffect, useMemo, useState } from "react";

function initialsFromDisplayName(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    const w = parts[0] ?? "";
    return w.slice(0, 2).toUpperCase() || "?";
  }
  const a = parts[0]?.[0] ?? "";
  const b = parts[parts.length - 1]?.[0] ?? "";
  return `${a}${b}`.toUpperCase() || "?";
}

function safeExternalHref(href: string | undefined): string | null {
  const t = (href ?? "").trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (/^mailto:/i.test(t)) return t;
  if (/^tel:/i.test(t)) return t;
  return null;
}

/** Drops subheadline text that only repeats display name or "Name · rest". */
function subheadlineWithoutRepeatedName(
  displayName: string,
  subheadline: string,
): string {
  const d = displayName.trim();
  const s = subheadline.trim();
  if (!s || !d) return s;
  if (s.toLowerCase() === d.toLowerCase()) return "";
  const esc = d.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const afterName = s.replace(new RegExp(`^${esc}\\s*[·•|,]\\s*`, "i"), "").trim();
  return afterName !== s ? afterName : s;
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

const CONTACT_CHIP_LINK_CLASS =
  "inline-flex max-w-full min-w-0 items-center gap-2 rounded-full border border-violet-200/90 bg-white px-3.5 py-2 font-medium text-violet-900 shadow-sm transition-[background-color,border-color,box-shadow] no-underline hover:border-violet-300 hover:bg-violet-50 hover:shadow-md dark:border-violet-500/25 dark:bg-zinc-900/75 dark:text-violet-100 dark:hover:border-violet-400/35 dark:hover:bg-violet-950/50";

const CONTACT_CHIP_ICON_CLASS =
  "size-4 shrink-0 text-violet-600 opacity-90 dark:text-violet-300";

function LinkedInBrandTile() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#0A66C2]">
      <svg
        className="h-[58%] w-[58%] text-white"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    </div>
  );
}

export function LandingPageClient({
  config,
}: {
  config: LandingPageConfig;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  const avatarSrc = (config.avatarUrl ?? "").trim();
  const avatarInitials = useMemo(
    () => initialsFromDisplayName(config.displayName),
    [config.displayName],
  );
  const showAvatarImage = Boolean(avatarSrc) && !avatarLoadFailed;

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarSrc]);

  const openChat = useCallback(() => setChatOpen(true), []);
  const closeChat = useCallback(() => setChatOpen(false), []);

  const { effectiveLinkedInUrl, showLinkedInTile, otherLinks, tileCount } =
    useMemo(() => {
      const explicitRaw = (config.linkedinUrl ?? "").trim();
      const explicitNorm = explicitRaw
        ? normalizeLinkedInProfileUrl(config.linkedinUrl ?? "")
        : "";
      const legacyLink = config.links.find(
        (l) =>
          l.action === "external" &&
          Boolean(l.href?.trim()) &&
          /linkedin\.com/i.test(l.href ?? ""),
      );
      const effectiveLinkedInUrl = explicitNorm.trim()
        ? explicitNorm
        : legacyLink?.href
          ? normalizeLinkedInProfileUrl(legacyLink.href)
          : "";
      const showLinkedInTile = Boolean(effectiveLinkedInUrl.trim());
      const otherLinks = config.links.filter((l) => {
        if (l.action !== "external") return true;
        const h = l.href ?? "";
        if (/linkedin\.com/i.test(h)) return false;
        if (/\blinkedin\b/i.test(l.label.trim())) return false;
        return true;
      });
      const tileCount = (showLinkedInTile ? 1 : 0) + otherLinks.length;
      return {
        effectiveLinkedInUrl,
        showLinkedInTile,
        otherLinks,
        tileCount,
      };
    }, [config.linkedinUrl, config.links]);

  const metaLineParts = useMemo(() => {
    const sub = subheadlineWithoutRepeatedName(
      config.displayName,
      config.subheadline ?? "",
    );
    const loc = (config.location ?? "").trim();
    const parts = [sub, loc].filter(Boolean);
    return [...new Set(parts.map((p) => p.trim()))];
  }, [config.displayName, config.subheadline, config.location]);

  const contactLinks = useMemo(() => {
    const phone = (config.contactPhone ?? "").trim();
    const email = (config.contactEmail ?? "").trim();
    const siteRaw = (config.websiteUrl ?? "").trim();
    const site = siteRaw ? normalizeWebsiteUrl(siteRaw) : "";
    const telBody = phone.replace(/^tel:/i, "").trim();
    const phoneHref = telBody
      ? `tel:${telBody.replace(/[\s()-]/g, "")}`
      : null;
    const emailHref =
      email && email.includes("@")
        ? `mailto:${encodeURIComponent(email)}`
        : null;
    const siteHref = site ? safeExternalHref(site) : null;
    const siteLabel = siteHref
      ? (() => {
          try {
            return new URL(site).hostname.replace(/^www\./i, "") || "Website";
          } catch {
            return "Website";
          }
        })()
      : "Website";
    const hasAny = Boolean(phone || email || siteHref);
    return {
      phone,
      phoneHref,
      email,
      emailHref,
      site,
      siteHref,
      siteLabel,
      hasAny,
    };
  }, [config.contactPhone, config.contactEmail, config.websiteUrl]);

  function openLinkedInProfile() {
    const u = safeExternalHref(effectiveLinkedInUrl);
    if (u) window.open(u, "_blank", "noopener,noreferrer");
  }

  function handleGridLink(link: LandingGridLink) {
    if (link.action === "chat") {
      openChat();
      return;
    }
    const url = safeExternalHref(link.href);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="min-h-screen bg-zinc-100 pb-10 font-serif text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="relative mx-auto max-w-lg">
        <div className="relative aspect-[21/10] w-full overflow-hidden bg-zinc-300 dark:bg-zinc-800">
          {config.bannerUrl ? (
            <img
              src={config.bannerUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>

        <div className="relative flex justify-center">
          <div className="relative -mt-14">
            <div
              className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-zinc-200 shadow-lg shadow-zinc-400/25 dark:border-zinc-950 dark:bg-zinc-800 dark:shadow-zinc-950/40"
              {...(showAvatarImage
                ? {}
                : {
                    role: "img" as const,
                    "aria-label": `${config.displayName}, ${avatarInitials}`,
                  })}
            >
              {showAvatarImage ? (
                <img
                  src={avatarSrc}
                  alt={`${config.displayName}`}
                  className="h-full w-full object-cover"
                  onError={() => setAvatarLoadFailed(true)}
                />
              ) : (
                <span className="select-none font-sans text-2xl font-semibold tracking-wide text-zinc-600 dark:text-zinc-300">
                  {avatarInitials}
                </span>
              )}
            </div>
            {config.badgeUrl ? (
              <div className="absolute bottom-1 right-1 h-9 w-9 overflow-hidden rounded-full border-2 border-white bg-white shadow-md shadow-zinc-400/20 dark:border-zinc-950 dark:bg-white">
                <img
                  src={config.badgeUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 px-5 pt-5 text-center">
          <h1 className="text-xl font-semibold leading-snug tracking-tight">
            {config.displayName}
          </h1>
          <p className="text-base leading-snug text-zinc-800 dark:text-zinc-200">
            {config.headline}
          </p>
          {metaLineParts.length > 0 ? (
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {metaLineParts.join(" · ")}
            </p>
          ) : null}
          {contactLinks.hasAny ? (
            <div className="flex flex-wrap items-center justify-center gap-2.5 font-sans text-sm sm:gap-3">
              {contactLinks.phoneHref ? (
                <a href={contactLinks.phoneHref} className={CONTACT_CHIP_LINK_CLASS}>
                  <PhoneIcon className={CONTACT_CHIP_ICON_CLASS} />
                  <span className="truncate">{contactLinks.phone}</span>
                </a>
              ) : null}
              {contactLinks.emailHref ? (
                <a href={contactLinks.emailHref} className={CONTACT_CHIP_LINK_CLASS}>
                  <MailIcon className={CONTACT_CHIP_ICON_CLASS} />
                  <span className="truncate">{contactLinks.email}</span>
                </a>
              ) : null}
              {contactLinks.siteHref ? (
                <a
                  href={contactLinks.siteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={CONTACT_CHIP_LINK_CLASS}
                >
                  <GlobeIcon className={CONTACT_CHIP_ICON_CLASS} />
                  <span className="truncate">{contactLinks.siteLabel}</span>
                </a>
              ) : null}
            </div>
          ) : null}
          {config.bio ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {config.bio}
            </p>
          ) : null}
          {config.hashtags ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {config.hashtags}
            </p>
          ) : null}

          <button
            type="button"
            onClick={openChat}
            className="mt-4 w-full rounded-full bg-zinc-900 py-4 text-center text-base font-semibold tracking-wide text-white shadow-lg shadow-zinc-400/25 transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:shadow-zinc-950/35 dark:hover:bg-zinc-200"
          >
            {config.primaryCtaLabel.trim() || "Lets Talk"}
          </button>
        </div>

        {tileCount > 0 ? (
          <div
            className={
              tileCount === 1
                ? "mt-8 flex justify-center px-4"
                : "mt-8 grid grid-cols-3 gap-3 px-4"
            }
          >
            {showLinkedInTile ? (
              <button
                type="button"
                onClick={openLinkedInProfile}
                className={`flex flex-col items-center gap-2 text-center ${
                  tileCount === 1 ? "w-[36%] max-w-[124px]" : ""
                }`}
              >
                <div className="aspect-square w-full overflow-hidden rounded-2xl shadow-md shadow-zinc-400/20 dark:shadow-zinc-950/35">
                  <LinkedInBrandTile />
                </div>
                <span className="line-clamp-2 w-full text-[11px] font-medium leading-tight text-zinc-800 dark:text-zinc-200">
                  LinkedIn
                </span>
              </button>
            ) : null}
            {otherLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => handleGridLink(link)}
                className={`flex flex-col items-center gap-2 text-center ${
                  tileCount === 1 ? "w-[36%] max-w-[124px]" : ""
                }`}
              >
                <div className="aspect-square w-full overflow-hidden rounded-2xl bg-zinc-200 shadow-md shadow-zinc-400/20 dark:bg-zinc-800 dark:shadow-zinc-950/35">
                  {link.imageUrl?.trim() ? (
                    <img
                      src={link.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <span className="line-clamp-2 w-full text-[11px] font-medium leading-tight text-zinc-800 dark:text-zinc-200">
                  {link.label}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {chatOpen ? (
        <div className="fixed inset-0 z-[100] flex flex-col justify-center bg-black/45 px-4 py-6 backdrop-blur-sm dark:bg-black/55">
          <button
            type="button"
            aria-label="Close chat"
            className="absolute inset-0 cursor-pointer border-0 bg-transparent"
            onClick={closeChat}
          />
          <div className="relative z-[101] mx-auto w-full max-w-lg rounded-3xl bg-zinc-100 p-3 pb-6 shadow-2xl shadow-black/25 dark:bg-zinc-900 dark:shadow-black/50">
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="font-sans text-sm font-semibold text-zinc-900 dark:text-white">
                Chat
              </p>
              <button
                type="button"
                onClick={closeChat}
                className="rounded-full px-3 py-1 font-sans text-sm text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
            <ChatPanel sheetEmbed />
          </div>
        </div>
      ) : null}
    </div>
  );
}
