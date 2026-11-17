import { createFileRoute } from "@tanstack/react-router";

import { InfoPage } from "@/components/site/InfoPage";
import { pages } from "@/data/pages";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "قوانین و مقررات | ناب استور" },
      { name: "description", content: "قوانین ثبت سفارش، قیمت و اطلاعات خریدار در ناب استور." },
      { property: "og:title", content: "قوانین و مقررات | ناب استور" },
      { property: "og:description", content: "قوانین ثبت سفارش، قیمت و اطلاعات خریدار در ناب استور." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://nabstore-paws-and-gadgets.lovable.app/terms" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://nabstore-paws-and-gadgets.lovable.app/terms" }],
  }),
  component: () => <InfoPage page={pages.terms} />,
});
