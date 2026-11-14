import { Link, type LinkProps } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  subtitle,
  link,
  inverted,
}: {
  title: string;
  subtitle?: string;
  link?: LinkProps;
  inverted?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
      <div>
        <h2 className={cn("text-2xl font-bold sm:text-3xl", inverted ? "text-ink-foreground" : "text-foreground")}>
          {title}
        </h2>
        {subtitle && (
          <p className={cn("mt-1.5 text-sm sm:text-base", inverted ? "text-ink-foreground/70" : "text-muted-foreground")}>
            {subtitle}
          </p>
        )}
      </div>
      {link && (
        <Link
          {...link}
          className={cn(
            "group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold",
            inverted ? "text-ink-foreground" : "text-primary",
          )}
        >
          {t("viewAll")}
          <ArrowLeft className="size-4 transition-transform ltr:rotate-180 rtl:group-hover:-translate-x-0.5 ltr:group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
