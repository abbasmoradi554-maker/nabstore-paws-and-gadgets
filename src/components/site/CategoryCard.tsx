import { Link } from "@tanstack/react-router";

import type { Category } from "@/data/products";
import { useI18n } from "@/lib/i18n";

export function CategoryCard({ category }: { category: Category }) {
  const { l } = useI18n();
  return (
    <Link
      to="/category/$slug"
      params={{ slug: category.slug }}
      className="group flex flex-col items-center gap-3 rounded-2xl p-2 text-center"
    >
      <span className="relative block aspect-square w-full overflow-hidden rounded-2xl bg-sand ring-1 ring-border transition-shadow duration-300 group-hover:shadow-lift">
        <img
          src={category.image}
          alt={l(category.name)}
          loading="lazy"
          width={1024}
          height={1024}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </span>
      <span className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary">
        {l(category.name)}
      </span>
    </Link>
  );
}
