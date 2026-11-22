import { createFileRoute, redirect } from "@tanstack/react-router";

// Backwards-compatible storefront URL: the canonical catalog route is /shop.
export const Route = createFileRoute("/products")({
  beforeLoad: () => {
    throw redirect({ to: "/shop" });
  },
  component: () => null,
});
