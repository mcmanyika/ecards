export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-auto border-t border-zinc-200/80 bg-zinc-50/80 px-6 py-8 backdrop-blur dark:border-white/8 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 text-center text-sm text-zinc-500 dark:text-zinc-500">
        <p>© {year} Manyika. All rights reserved.</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-600">
          Dallas, TX · Full-stack SaaS & web apps
        </p>
      </div>
    </footer>
  );
}
