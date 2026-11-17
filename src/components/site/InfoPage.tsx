import type { InfoPage as InfoPageData } from "@/data/pages";
import { useI18n } from "@/lib/i18n";

export function InfoPage({ page }: { page: InfoPageData }) {
  const { l } = useI18n();
  return (
    <section className="container-page max-w-3xl pt-10">
      <h1 className="text-3xl font-bold">{l(page.title)}</h1>
      <p className="mt-4 leading-8 text-foreground/80">{l(page.intro)}</p>
      <div className="mt-8 grid gap-4">
        {page.sections.map((s) => (
          <div key={s.title.en} className="rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="font-bold">{l(s.title)}</h2>
            <p className="mt-2 text-sm leading-7 text-foreground/80">{l(s.body)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
