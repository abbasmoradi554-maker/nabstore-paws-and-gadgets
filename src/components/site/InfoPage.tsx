import type { InfoPage as InfoPageData } from "@/data/pages";
import { useI18n } from "@/lib/i18n";
import { pages as defaultPages } from "@/data/pages";
import { useStoreContent } from "@/lib/store-content";

export function InfoPage({ page }: { page: InfoPageData }) {
  const { l } = useI18n();
  const content = useStoreContent();
  const pageKey = Object.entries(defaultPages).find(([, value]) => value === page)?.[0];
  const candidate = pageKey ? content.data?.pages?.[pageKey] : null;
  const pageData = candidate?.title && candidate?.intro && Array.isArray(candidate?.sections) ? candidate : page;
  return (
    <section className="container-page max-w-3xl pt-10">
      <h1 className="text-3xl font-bold">{l(pageData.title)}</h1>
      <p className="mt-4 leading-8 text-foreground/80">{l(pageData.intro)}</p>
      <div className="mt-8 grid gap-4">
        {pageData.sections.map((s: InfoPageData["sections"][number]) => (
          <div key={s.title.en} className="rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="font-bold">{l(s.title)}</h2>
            <p className="mt-2 text-sm leading-7 text-foreground/80">{l(s.body)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
