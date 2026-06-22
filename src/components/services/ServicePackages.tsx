import { SERVICE_PACKAGES } from "@/lib/service-packages";

export function ServicePackages({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "space-y-3" : "space-y-5"}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-500">
            Services
          </p>
          <h2
            className={
              compact
                ? "mt-1 text-sm font-semibold text-zinc-900 dark:text-white"
                : "mt-1 text-xl font-semibold tracking-tight text-zinc-900 dark:text-white"
            }
          >
            Engagement packages
          </h2>
          {!compact && (
            <p className="mt-1.5 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
              Starting-at pricing. Final scope after a quick discovery call.
            </p>
          )}
        </div>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {SERVICE_PACKAGES.map((pkg, i) => (
          <li
            key={pkg.id}
            className="glass-card slick-hover group relative overflow-hidden rounded-2xl p-4"
          >
            <div className="pointer-events-none absolute -right-3 -top-3 text-5xl font-bold leading-none text-zinc-100 transition group-hover:text-zinc-200/80 dark:text-zinc-800 dark:group-hover:text-zinc-700">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="relative">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold tracking-tight text-zinc-900 dark:text-white">
                  {pkg.name}
                </p>
                <span className="shrink-0 rounded-full bg-zinc-900 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white dark:bg-white dark:text-zinc-950">
                  {pkg.startingAt}
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {pkg.tagline}
              </p>
              {!compact && (
                <p className="mt-2.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {pkg.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
