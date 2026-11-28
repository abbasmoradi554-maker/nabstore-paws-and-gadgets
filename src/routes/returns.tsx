import { createFileRoute } from "@tanstack/react-router";
import { siteUrl } from "@/lib/site-config";

import { InfoPage } from "@/components/site/InfoPage";
import { pages } from "@/data/pages";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "رویه بازگشت کالا | ناب استور" },
      { name: "description", content: "شرایط بازگشت و تعویض کالا در ناب استور." },
      { property: "og:title", content: "رویه بازگشت کالا | ناب استور" },
      { property: "og:description", content: "شرایط بازگشت و تعویض کالا در ناب استور." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${siteUrl}/returns` },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: `${siteUrl}/returns` }],
  }),
  component: () => <InfoPage page={pages.returns} />,
});
