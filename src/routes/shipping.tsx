import { createFileRoute } from "@tanstack/react-router";
import { siteUrl } from "@/lib/site-config";

import { InfoPage } from "@/components/site/InfoPage";
import { pages } from "@/data/pages";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "ارسال سفارش | ناب استور" },
      { name: "description", content: "نحوه، هزینه و زمان ارسال سفارش‌های ناب استور به سراسر کشور." },
      { property: "og:title", content: "ارسال سفارش | ناب استور" },
      { property: "og:description", content: "نحوه، هزینه و زمان ارسال سفارش‌های ناب استور به سراسر کشور." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${siteUrl}/shipping` },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: `${siteUrl}/shipping` }],
  }),
  component: () => <InfoPage page={pages.shipping} />,
});
