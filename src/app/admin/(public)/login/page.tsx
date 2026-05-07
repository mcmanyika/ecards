"use client";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { getFirebaseAuth } from "@/lib/firebase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";

async function exchangeSessionCookie(idToken: string): Promise<void> {
  const res = await fetch("/api/admin/sessionLogin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Could not establish admin session.");
  }
}

async function exchangeLegacySession(email: string, password: string): Promise<void> {
  const res = await fetch("/api/admin/passwordLogin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Could not establish admin session.");
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const auth = getFirebaseAuth();
    try {
      if (!auth) {
        await exchangeLegacySession(email.trim(), password);
      } else {
        const cred = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );
        const idToken = await cred.user.getIdToken();
        await exchangeSessionCookie(idToken);
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: string }).code)
          : "";
      let friendly =
        err instanceof Error ? err.message : "Sign-in failed.";
      if (
        code.includes("wrong-password") ||
        code.includes("invalid-credential") ||
        code.includes("user-not-found")
      ) {
        friendly = "Invalid email or password.";
      }
      setError(friendly);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 px-6 py-16 text-zinc-900 dark:bg-zinc-950 dark:text-white">
      <div className="mx-auto flex w-full max-w-md flex-col space-y-8">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Restricted
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Admin sign-in
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-8 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-zinc-900/60"
        >
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
            <input
              type="email"
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-[15px] text-zinc-900 focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/25 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:focus:border-violet-500/50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Password
            <input
              type="password"
              autoComplete="current-password"
              className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-[15px] text-zinc-900 focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/25 dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:focus:border-violet-500/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && (
            <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Continue"}
          </Button>
        </form>

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-500">
          New admin?{" "}
          <Link
            href="/admin/register"
            className="text-violet-700 hover:text-violet-900 dark:text-violet-300 dark:hover:text-white"
          >
            Create an account
          </Link>
        </p>

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-500">
          <Link
            href="/"
            className="text-violet-700 hover:text-violet-900 dark:text-violet-300 dark:hover:text-white"
          >
            ← Back to chat
          </Link>
        </p>
      </div>
    </div>
  );
}
