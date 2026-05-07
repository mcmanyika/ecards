"use client";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/Button";
import {
  DEFAULT_LANDING_SLUG,
  sanitizeSlug,
} from "@/lib/landing-config";
import { getFirebaseAuth } from "@/lib/firebase/client";
import type { LandingGridLink, LandingLinkAction, LandingPageConfig } from "@/types/landing";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { useCallback, useEffect, useState } from "react";

function emptyLink(): LandingGridLink {
  return {
    id: crypto.randomUUID(),
    label: "",
    imageUrl: "",
    action: "external",
    href: "",
  };
}

export default function AdminLandingEditorPage() {
  const router = useRouter();
  const [slugInput, setSlugInput] = useState(DEFAULT_LANDING_SLUG);
  const [config, setConfig] = useState<LandingPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedHint, setSavedHint] = useState<string | null>(null);
  const [publicBaseUrl, setPublicBaseUrl] = useState("");
  const [copiedLandingUrl, setCopiedLandingUrl] = useState(false);

  const slug =
    sanitizeSlug(slugInput) ?? DEFAULT_LANDING_SLUG;

  const load = useCallback(async () => {
    const s = sanitizeSlug(slugInput) ?? DEFAULT_LANDING_SLUG;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/landing?slug=${encodeURIComponent(s)}`,
      );
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = (await res.json()) as {
        config?: LandingPageConfig;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to load.");
      if (data.config) {
        setConfig(data.config);
        setSlugInput(data.config.slug);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [router, slugInput]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/landing?slug=${encodeURIComponent(DEFAULT_LANDING_SLUG)}`,
        );
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        const data = (await res.json()) as {
          config?: LandingPageConfig;
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "Failed to load.");
        if (data.config) {
          setConfig(data.config);
          setSlugInput(data.config.slug);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "").trim();
    setPublicBaseUrl(fromEnv || window.location.origin);
  }, []);

  const landingAbsoluteUrl =
    publicBaseUrl !== "" ? `${publicBaseUrl}/p/${slug}` : "";

  async function save() {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSavedHint(null);
    try {
      const body = { ...config, slug };
      const res = await fetch("/api/admin/landing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = (await res.json()) as {
        config?: LandingPageConfig;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Save failed.");
      if (data.config) {
        setConfig(data.config);
        setSlugInput(data.config.slug);
      }
      setSavedHint("Saved.");
      window.setTimeout(() => setSavedHint(null), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    const auth = getFirebaseAuth();
    if (auth) {
      try {
        await signOut(auth);
      } catch {
        /* ignore */
      }
    }
    router.push("/admin/login");
    router.refresh();
  }

  async function copyLandingUrl() {
    if (!landingAbsoluteUrl) return;
    try {
      await navigator.clipboard.writeText(landingAbsoluteUrl);
      setCopiedLandingUrl(true);
      window.setTimeout(() => setCopiedLandingUrl(false), 2000);
    } catch {
      /* ignore */
    }
  }

  function updateLink(idx: number, next: LandingGridLink) {
    setConfig((c) => {
      if (!c) return c;
      const links = [...c.links];
      links[idx] = next;
      return { ...c, links };
    });
  }

  function removeLink(idx: number) {
    setConfig((c) => {
      if (!c) return c;
      const links = c.links.filter((_, i) => i !== idx);
      return { ...c, links };
    });
  }

  function addLink() {
    setConfig((c) => {
      if (!c) return c;
      return { ...c, links: [...c.links, emptyLink()] };
    });
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900 dark:bg-zinc-950 dark:text-white sm:px-6">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Mobile landing
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Link-in-bio page
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              type="button"
              onClick={() => router.push("/admin")}
            >
              Dashboard
            </Button>
            <Button variant="danger" type="button" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </header>

        {loading && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>
        )}
        {error && (
          <p className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-100">
            {error}
          </p>
        )}
        {savedHint && (
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {savedHint}
          </p>
        )}

        {config && (
          <div className="space-y-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  URL slug
                  <input
                    className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 font-mono text-sm dark:border-white/10 dark:bg-zinc-950"
                    value={slugInput}
                    onChange={(e) => setSlugInput(e.target.value)}
                    spellCheck={false}
                  />
                </label>
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="text-xs"
                    onClick={() => void load()}
                  >
                    Load this slug
                  </Button>
                </div>
              </div>
              <label className="flex items-center gap-3 pt-8 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={config.published}
                  onChange={(e) =>
                    setConfig({ ...config, published: e.target.checked })
                  }
                  className="size-4 rounded border-zinc-400"
                />
                Published (visible to visitors)
              </label>
            </div>

            {landingAbsoluteUrl !== "" && (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900/60">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  QR code (full URL)
                </p>
                <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                  <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-white">
                    <QRCode value={landingAbsoluteUrl} size={168} level="M" />
                  </div>
                  <div className="w-full min-w-0 flex-1 space-y-2">
                    <p className="break-all font-mono text-xs text-zinc-700 dark:text-zinc-300">
                      {landingAbsoluteUrl}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="text-xs"
                        onClick={() => void copyLandingUrl()}
                      >
                        {copiedLandingUrl ? "Copied" : "Copy URL"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-xs"
                        onClick={() =>
                          window.open(landingAbsoluteUrl, "_blank", "noreferrer")
                        }
                      >
                        Open page
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Banner image URL
              <input
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-zinc-950"
                value={config.bannerUrl}
                onChange={(e) =>
                  setConfig({ ...config, bannerUrl: e.target.value })
                }
                placeholder="https://…"
              />
            </label>

            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Profile photo URL
              <input
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-zinc-950"
                value={config.avatarUrl}
                onChange={(e) =>
                  setConfig({ ...config, avatarUrl: e.target.value })
                }
                placeholder="https://…"
              />
            </label>

            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Badge URL (optional, corner on avatar)
              <input
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-zinc-950"
                value={config.badgeUrl}
                onChange={(e) =>
                  setConfig({ ...config, badgeUrl: e.target.value })
                }
                placeholder="https://…"
              />
            </label>

            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Display name
              <input
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-950"
                value={config.displayName}
                onChange={(e) =>
                  setConfig({ ...config, displayName: e.target.value })
                }
              />
            </label>

            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Headline
              <input
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-950"
                value={config.headline}
                onChange={(e) =>
                  setConfig({ ...config, headline: e.target.value })
                }
              />
            </label>

            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Subheadline / organization (optional)
              <input
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-950"
                value={config.subheadline}
                onChange={(e) =>
                  setConfig({ ...config, subheadline: e.target.value })
                }
              />
            </label>

            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Location (optional)
              <input
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-950"
                value={config.location}
                onChange={(e) =>
                  setConfig({ ...config, location: e.target.value })
                }
              />
            </label>

            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Bio
              <textarea
                rows={5}
                className="mt-2 w-full resize-y rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-zinc-950"
                value={config.bio}
                onChange={(e) => setConfig({ ...config, bio: e.target.value })}
              />
            </label>

            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Hashtags / footer line (optional)
              <input
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-950"
                value={config.hashtags}
                onChange={(e) =>
                  setConfig({ ...config, hashtags: e.target.value })
                }
              />
            </label>

            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Primary button label (opens chat)
              <input
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-950"
                value={config.primaryCtaLabel}
                onChange={(e) =>
                  setConfig({ ...config, primaryCtaLabel: e.target.value })
                }
                placeholder="Lets Talk"
              />
            </label>

            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              LinkedIn profile URL (optional)
              <input
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 font-mono text-sm dark:border-white/10 dark:bg-zinc-950"
                value={config.linkedinUrl ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, linkedinUrl: e.target.value })
                }
                placeholder=""
                spellCheck={false}
              />
              <span className="mt-2 block text-xs text-zinc-500">
                Shows the LinkedIn tile above your custom grid. You can paste{" "}
                <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
                  linkedin.com/in/…
                </code>{" "}
                — https:// is added if omitted. Saving removes duplicate
                LinkedIn rows from the grid.
              </span>
            </label>

            <div className="space-y-4 border-t border-zinc-200 pt-6 dark:border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Link grid</h2>
                <Button type="button" variant="secondary" onClick={addLink}>
                  Add tile
                </Button>
              </div>
              <p className="text-xs text-zinc-500">
                Extra tiles besides LinkedIn: external links or chat. Use the
                LinkedIn URL field above for your profile link.
              </p>
              <ul className="space-y-4">
                {config.links.map((link, idx) => (
                  <li
                    key={link.id}
                    className="rounded-2xl border border-zinc-200 p-4 dark:border-white/10"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Label
                        <input
                          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                          value={link.label}
                          onChange={(e) =>
                            updateLink(idx, { ...link, label: e.target.value })
                          }
                        />
                      </label>
                      <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Image URL
                        <input
                          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                          value={link.imageUrl}
                          onChange={(e) =>
                            updateLink(idx, {
                              ...link,
                              imageUrl: e.target.value,
                            })
                          }
                          placeholder="https://…"
                        />
                      </label>
                      <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Opens
                        <select
                          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                          value={link.action}
                          onChange={(e) => {
                            const action = e.target.value as LandingLinkAction;
                            updateLink(idx, {
                              ...link,
                              action,
                              href: action === "chat" ? undefined : link.href,
                            });
                          }}
                        >
                          <option value="external">External URL</option>
                          <option value="chat">Chat</option>
                        </select>
                      </label>
                      {link.action === "external" ? (
                        <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
                          URL
                          <input
                            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
                            value={link.href ?? ""}
                            onChange={(e) =>
                              updateLink(idx, {
                                ...link,
                                href: e.target.value,
                              })
                            }
                            placeholder="https://…"
                          />
                        </label>
                      ) : null}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeLink(idx)}
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-zinc-200 pt-6 dark:border-white/10">
              <Button type="button" disabled={saving} onClick={() => void save()}>
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button
                variant="secondary"
                type="button"
                onClick={() =>
                  window.open(`/p/${slug}`, "_blank", "noopener,noreferrer")
                }
              >
                Preview live page
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
