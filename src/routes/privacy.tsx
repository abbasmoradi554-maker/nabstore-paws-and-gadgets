import { createFileRoute } from "@tanstack/react-router";
import { siteUrl } from "@/lib/site-config";

import { InfoPage } from "@/components/site/InfoPage";
import { pages } from "@/data/pages";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "حریم خصوصی | ناب استور" },
      { name: "description", content: "نحوه استفاده ناب استور از اطلاعات ثبت سفارش شما." },
      { property: "og:title", content: "حریم خصوصی | ناب استور" },
      { property: "og:description", content: "نحوه استفاده ناب استور از اطلاعات ثبت سفارش شما." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${siteUrl}/privacy` },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: `${siteUrl}/privacy` }],
  }),
  component: () => <InfoPage page={pages.privacy} />,
});
