import { ChatPanel } from "@/components/chat/ChatPanel";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-200/55 via-zinc-100 to-zinc-50 dark:from-zinc-800/40 dark:via-zinc-950 dark:to-zinc-950" />
      <div className="pointer-events-none absolute -left-32 top-1/4 h-72 w-72 rounded-full bg-zinc-300/35 blur-3xl dark:bg-zinc-600/12" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-zinc-400/25 blur-3xl dark:bg-zinc-500/14" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
          Partson Manyika
        </span>
        <nav className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400 sm:gap-6">
          <ThemeToggle />
          <Link
            href="/admin/login"
            className="hover:text-zinc-900 dark:hover:text-white"
          >
            Admin
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto grid max-w-6xl gap-12 px-6 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
        <section className="space-y-6 pt-4">
          <p className="inline-flex rounded-full border border-violet-200/80 bg-white/90 px-3 py-1 text-xs font-medium uppercase tracking-wider text-violet-800 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-violet-200/90 dark:shadow-none">
            Dallas, TX · LoadMaster · WTP · 15+ years
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
            SaaS builder for logistics tech, data, & global communities.
          </h1>
          <p className="max-w-xl text-pretty text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            Founder and full-stack / data engineer: Python · Django · SQL · AWS
            · Next.js · React · Firebase. Building LoadMaster (TMS for carriers &
            fleets) and We the People (WTP)—a diaspora platform for Zimbabwe &
            global connection. Freelance engineer since 2010. Ask anything in chat
            or leave your details; I follow up when it fits.
          </p>
          <ul className="grid gap-3 text-sm text-zinc-700 dark:text-zinc-300 sm:grid-cols-2">
            {[
              "Full-stack SaaS & data engineering",
              "LoadMaster TMS · fleets, dispatch & analytics",
              "WTP · diaspora services & ecosystems",
              "Python Django AWS Next.js Postgres Firebase",
            ].map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-zinc-200/90 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <ChatPanel />
        </section>
      </main>
    </div>
  );
}
