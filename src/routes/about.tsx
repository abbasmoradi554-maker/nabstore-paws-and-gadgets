import { createFileRoute } from "@tanstack/react-router";

import { InfoPage } from "@/components/site/InfoPage";
import { pages } from "@/data/pages";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "درباره ما | ناب استور" },
      { name: "description", content: "آشنایی با ناب استور، فروشگاه آنلاین قاب و لوازم جانبی گوشی، محصولات حیوانات خانگی و گجت‌ها." },
      { property: "og:title", content: "درباره ما | ناب استور" },
      { property: "og:description", content: "آشنایی با ناب استور، فروشگاه آنلاین قاب و لوازم جانبی گوشی، محصولات حیوانات خانگی و گجت‌ها." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nabstore-paws-and-gadgets.lovable.app/about" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://nabstore-paws-and-gadgets.lovable.app/about" }],
  }),
  component: () => <InfoPage page={pages.about} />,
});
