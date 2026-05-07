"use client";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { startTransition, useCallback, useEffect, useState } from "react";

type LeadRow = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  serviceNeeded?: string;
  budget?: string;
  preferredAppointmentDate?: string;
  qualified?: boolean;
  conversationId?: string;
  createdAt?: string | null;
};

type ConversationRow = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type DetailMsg = {
  id: string;
  role?: string;
  content?: string;
  createdAt?: string | null;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"leads" | "conversations">("conversations");
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailMessages, setDetailMessages] = useState<DetailMsg[]>([]);
  const [detailContact, setDetailContact] = useState<Record<
    string,
    string
  > | null>(null);
  const [detailContactCapturedAt, setDetailContactCapturedAt] = useState<
    string | null
  >(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lr, cr] = await Promise.all([
        fetch("/api/admin/leads"),
        fetch("/api/admin/conversations"),
      ]);
      if (lr.status === 401 || cr.status === 401) {
        router.push("/admin/login");
        return;
      }
      const readErr = async (r: Response) => {
        try {
          const j = (await r.json()) as { error?: string };
          return j.error ?? `HTTP ${r.status}`;
        } catch {
          return `HTTP ${r.status}`;
        }
      };
      if (!lr.ok || !cr.ok) {
        const bits = await Promise.all([
          lr.ok ? Promise.resolve(null) : readErr(lr),
          cr.ok ? Promise.resolve(null) : readErr(cr),
        ]);
        throw new Error(bits.filter(Boolean).join(" · "));
      }
      const lj = (await lr.json()) as { leads?: LeadRow[] };
      const cj = (await cr.json()) as { conversations?: ConversationRow[] };
      setLeads(lj.leads ?? []);
      setConversations(cj.conversations ?? []);
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

  async function openConversation(id: string) {
    setDetailOpen(id);
    setDetailMessages([]);
    setDetailContact(null);
    setDetailContactCapturedAt(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/conversations/${id}`);
      if (!res.ok) throw new Error("Could not load thread.");
      const data = (await res.json()) as {
        messages?: DetailMsg[];
        contact?: Record<string, string> | null;
        contactCapturedAt?: string | null;
      };
      setDetailMessages(data.messages ?? []);
      setDetailContact(data.contact ?? null);
      setDetailContactCapturedAt(data.contactCapturedAt ?? null);
    } catch {
      setDetailMessages([]);
      setDetailContact(null);
      setDetailContactCapturedAt(null);
    } finally {
      setDetailLoading(false);
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
    <div className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900 dark:bg-zinc-950 dark:text-white">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Overview
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Conversations & leads
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle />
            <Button variant="secondary" type="button" onClick={() => void load()}>
              Refresh
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() => router.push("/admin/employees")}
            >
              Team profiles
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() => router.push("/admin/landing")}
            >
              Landing page
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() => router.push("/")}
            >
              View chat
            </Button>
            <Button variant="danger" type="button" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </header>

        <div className="flex gap-2 rounded-2xl border border-zinc-200 bg-zinc-100/90 p-1 dark:border-white/10 dark:bg-zinc-900/40">
          {(["leads", "conversations"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${
                tab === key
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-white dark:text-zinc-950 dark:shadow-none"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              {key === "leads" ? "Leads" : "Conversations"}
            </button>
          ))}
        </div>

        {loading && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Loading records…
          </p>
        )}
        {error && (
          <p className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-100">
            {error}
          </p>
        )}

        {!loading && tab === "leads" && (
          <div className="overflow-x-auto rounded-3xl border border-zinc-200 dark:border-white/10">
            <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-white/10">
              <thead className="bg-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Budget</th>
                  <th className="px-4 py-3">Qualified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white dark:divide-white/5 dark:bg-zinc-900/40">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.03]">
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {lead.createdAt
                        ? new Date(lead.createdAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">{lead.name}</td>
                    <td className="px-4 py-3 text-violet-700 dark:text-violet-200">
                      {lead.email}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3">
                      {lead.serviceNeeded}
                    </td>
                    <td className="px-4 py-3">{lead.budget}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          lead.qualified
                            ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200"
                            : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700/60 dark:text-zinc-300"
                        }`}
                      >
                        {lead.qualified ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                ))}
                {leads.length === 0 && (
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-500"
                      colSpan={6}
                    >
                      No lead forms yet — leads come only from{" "}
                      <strong className="font-semibold text-zinc-800 dark:text-zinc-300">
                        Get a quote
                      </strong>{" "}
                      on the chat page. Chat transcripts live under Conversations.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && tab === "conversations" && (
          <div className="overflow-x-auto rounded-3xl border border-zinc-200 dark:border-white/10">
            <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-white/10">
              <thead className="bg-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white dark:divide-white/5 dark:bg-zinc-900/40">
                {conversations.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/[0.04]"
                    onClick={() => void openConversation(c.id)}
                  >
                    <td className="max-w-[140px] truncate px-4 py-3">
                      {c.name?.trim() ? c.name : "—"}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-violet-700 dark:text-violet-200">
                      {c.email?.trim() ? c.email : "—"}
                    </td>
                    <td className="max-w-[140px] truncate whitespace-nowrap px-4 py-3 tabular-nums">
                      {c.phone?.trim() ? c.phone : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {c.updatedAt
                        ? new Date(c.updatedAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100 hover:text-violet-950 dark:text-violet-300 dark:hover:bg-violet-500/15 dark:hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          void openConversation(c.id);
                        }}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
                {conversations.length === 0 && (
                  <tr>
                    <td
                      className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-500"
                      colSpan={6}
                    >
                      No conversations yet — send a message from the homepage
                      chat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 dark:bg-black/70 sm:items-center">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-950">
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-white/10">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                  Thread
                </p>
                <p className="font-mono text-sm text-zinc-800 dark:text-inherit">
                  {detailOpen}
                </p>
              </div>
              <button
                type="button"
                className="rounded-xl px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
                onClick={() => setDetailOpen(null)}
              >
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-6 [-webkit-overflow-scrolling:touch]">
              {detailContact &&
                (detailContact.name ||
                  detailContact.email ||
                  detailContact.phone) && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-500/25 dark:bg-emerald-950/35 dark:text-emerald-50">
                    <p className="text-xs uppercase tracking-wide text-emerald-800 dark:text-emerald-200/90">
                      Contact captured in chat
                    </p>
                    <dl className="mt-2 grid gap-1 text-zinc-900 dark:text-zinc-100">
                      {detailContact.name && (
                        <div className="flex flex-wrap gap-2">
                          <dt className="text-zinc-600 dark:text-zinc-400">
                            Name
                          </dt>
                          <dd>{detailContact.name}</dd>
                        </div>
                      )}
                      {detailContact.email && (
                        <div className="flex flex-wrap gap-2">
                          <dt className="text-zinc-600 dark:text-zinc-400">
                            Email
                          </dt>
                          <dd>{detailContact.email}</dd>
                        </div>
                      )}
                      {detailContact.phone && (
                        <div className="flex flex-wrap gap-2">
                          <dt className="text-zinc-600 dark:text-zinc-400">
                            Phone
                          </dt>
                          <dd>{detailContact.phone}</dd>
                        </div>
                      )}
                    </dl>
                    {detailContactCapturedAt && (
                      <p className="mt-2 text-xs text-emerald-800/90 dark:text-emerald-200/70">
                        Last capture:{" "}
                        {new Date(detailContactCapturedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              {detailLoading ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Loading transcript…
                </p>
              ) : (
                <>
                  {detailMessages.map((m) => (
                    <div
                      key={m.id}
                      className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-500/30 dark:bg-violet-950/40 dark:text-violet-50"
                          : "border-zinc-200 bg-zinc-50 text-zinc-900 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100"
                      }`}
                    >
                      <p className="mb-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        {m.role}
                      </p>
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-500">
                        {m.createdAt
                          ? new Date(m.createdAt).toLocaleString()
                          : ""}
                      </p>
                    </div>
                  ))}
                  {detailMessages.length === 0 && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-500">
                      No messages on this conversation (or failed to load).
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
