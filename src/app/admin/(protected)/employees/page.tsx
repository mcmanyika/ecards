"use client";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useCallback, useEffect, useState } from "react";

type ProfileRow = {
  slug: string;
  displayName: string;
  published: boolean;
  headline: string;
};

export default function AdminEmployeesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/employee-profiles");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = (await res.json()) as {
        profiles?: ProfileRow[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to load.");
      setProfiles(data.profiles ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, [load]);

  async function createProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() && !newSlug.trim()) {
      setError("Enter at least a display name or URL slug.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/employee-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: newName.trim() || "Team member",
          slug: newSlug.trim().toLowerCase() || undefined,
        }),
      });
      const data = (await res.json()) as { slug?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not create.");
      setNewName("");
      setNewSlug("");
      await load();
      if (data.slug) {
        router.push(`/admin/landing?slug=${encodeURIComponent(data.slug)}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create.");
    } finally {
      setCreating(false);
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

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900 dark:bg-zinc-950 dark:text-white sm:px-6">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Workspace
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Team profiles
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Each profile is its own link-in-bio URL (
              <code className="rounded bg-zinc-200 px-1 text-xs dark:bg-zinc-800">
                /p/your-slug
              </code>
              ). Open the editor to add photos and links.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              type="button"
              onClick={() => router.push("/admin/landing")}
            >
              Landing editor
            </Button>
            <Button variant="danger" type="button" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </header>

        {error && (
          <p className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-100">
            {error}
          </p>
        )}

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
          <h2 className="text-lg font-semibold">Add employee profile</h2>
          <form onSubmit={createProfile} className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Display name
              <input
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-950"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Jordan Lee"
              />
            </label>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              URL slug (optional)
              <input
                className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 font-mono text-sm dark:border-white/10 dark:bg-zinc-950"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="e.g. jordan-lee"
                spellCheck={false}
              />
              <span className="mt-1 block text-xs text-zinc-500">
                Lowercase letters, numbers, and hyphens. Leave blank to generate
                from the name.
              </span>
            </label>
            <Button type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create & open editor"}
            </Button>
          </form>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">All profiles</h2>
            <Button
              type="button"
              variant="secondary"
              className="text-xs"
              onClick={() => void load()}
            >
              Refresh
            </Button>
          </div>
          {loading ? (
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Loading…
            </p>
          ) : profiles.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              No profiles yet. Create one above or save your first page from
              the landing editor.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-zinc-200 dark:divide-white/10">
              {profiles.map((p) => (
                <li
                  key={p.slug}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900 dark:text-white">
                      {p.displayName}
                    </p>
                    <p className="truncate font-mono text-xs text-zinc-500">
                      /p/{p.slug}
                      {p.published ? (
                        <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                          · live
                        </span>
                      ) : (
                        <span className="ml-2 text-zinc-400">· draft</span>
                      )}
                    </p>
                    {p.headline ? (
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
                        {p.headline}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/landing?slug=${encodeURIComponent(p.slug)}`}
                      className="inline-flex"
                    >
                      <Button type="button" variant="secondary" className="text-xs">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-xs"
                      onClick={() =>
                        window.open(`/p/${p.slug}`, "_blank", "noopener,noreferrer")
                      }
                    >
                      Open
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
