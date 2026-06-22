import { ChatPanel } from "@/components/chat/ChatPanel";
import { ServicePackages } from "@/components/services/ServicePackages";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import Link from "next/link";

const HIGHLIGHTS: { label: string; href?: string }[] = [
  { label: "Full-stack SaaS" },
  { label: "LoadMaster TMS", href: "https://www.loadmaster.sh" },
  { label: "The Timba Papers", href: "https://www.jamesontimba.com" },
  { label: "Python · Django · AWS" },
];

const HIGHLIGHT_PILL_CLASS =
  "glass-pill rounded-full px-3 py-1 text-[11px] font-medium text-zinc-600 transition dark:text-zinc-400";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-zinc-50 dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-zinc-300/40 via-zinc-50 to-zinc-50 dark:from-zinc-700/20 dark:via-zinc-950 dark:to-zinc-950" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(161 161 170 / 0.15) 1px, transparent 1px), linear-gradient(90deg, rgb(161 161 170 / 0.15) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none absolute -left-24 top-20 h-96 w-96 rounded-full bg-zinc-300/30 blur-3xl dark:bg-zinc-600/10" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-zinc-400/20 blur-3xl dark:bg-zinc-500/10" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-white dark:text-zinc-950">
            PM
          </div>
          <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white">
            Partson Manyika
          </span>
        </div>
        <nav className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <ThemeToggle className="h-9 w-9 rounded-full" />
          <Link
            href="/admin/login"
            className="glass-pill rounded-full px-3.5 py-2 font-medium text-zinc-700 transition hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
          >
            Admin
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-2">
        <div className="mb-8 text-center lg:mb-10 lg:text-left">
          <p className="glass-pill mx-auto inline-flex rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600 dark:text-zinc-400 lg:mx-0">
            Dallas, TX · 25+ years
          </p>
          <h1 className="mt-4 text-balance text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white sm:text-3xl lg:max-w-xl">
            Full-stack SaaS & web apps
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-pretty text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 lg:mx-0">
            Pick a package, ask about pricing, or request a quote.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
            {HIGHLIGHTS.map((item) =>
              item.href ? (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${HIGHLIGHT_PILL_CLASS} hover:text-zinc-900 dark:hover:text-zinc-200`}
                >
                  {item.label}
                </a>
              ) : (
                <span key={item.label} className={HIGHLIGHT_PILL_CLASS}>
                  {item.label}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
          <section className="order-2 lg:order-1 lg:col-span-6">
            <ServicePackages stacked />
          </section>
          <section className="order-1 lg:sticky lg:top-8 lg:order-2 lg:col-span-6">
            <div className="shadow-2xl shadow-zinc-900/10 dark:shadow-black/50">
              <ChatPanel />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
