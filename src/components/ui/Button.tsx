import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary:
    "bg-violet-600 text-white hover:bg-violet-500 focus-visible:ring-violet-500/40",
  secondary:
    "bg-zinc-200 text-zinc-900 hover:bg-zinc-300 focus-visible:ring-zinc-400/40 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 dark:focus-visible:ring-zinc-500/40",
  ghost:
    "bg-transparent text-zinc-600 hover:bg-zinc-200/80 focus-visible:ring-zinc-400/30 dark:text-zinc-300 dark:hover:bg-white/10 dark:focus-visible:ring-white/20",
  danger:
    "bg-rose-600/90 text-white hover:bg-rose-500 focus-visible:ring-rose-500/40",
} as const;

type Variant = keyof typeof variants;

export function Button({
  className = "",
  variant = "primary",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium
        transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950 disabled:pointer-events-none disabled:opacity-40
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
