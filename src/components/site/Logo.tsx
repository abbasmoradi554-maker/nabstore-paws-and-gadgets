import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn("size-9 shrink-0", className)}>
      <rect width="40" height="40" rx="11" className="fill-primary" />
      <path
        d="M12.5 28V12.5L27.5 28V18.5"
        fill="none"
        className="stroke-primary-foreground"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="27.5" cy="12" r="2.8" className="fill-highlight" />
    </svg>
  );
}

export function Logo({ className, inverted }: { className?: string; inverted?: boolean }) {
  return (
    <span dir="ltr" className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span
        className={cn(
          "inline-flex items-baseline gap-1 font-[Sora,Manrope,sans-serif] leading-none",
          inverted ? "text-ink-foreground" : "text-foreground",
        )}
      >
        <span className="text-[1.45rem] font-extrabold tracking-[0.08em]">NAB</span>
        <span className="text-[0.72rem] font-semibold tracking-[0.22em] opacity-80">STORE</span>
      </span>
    </span>
  );
}
