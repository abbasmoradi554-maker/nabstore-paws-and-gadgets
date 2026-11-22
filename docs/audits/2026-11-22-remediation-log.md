# NABSTORE remediation log
Date: 2026-11-22
Branch: `feature/store-admin-cms`
Latest reviewed commit: `7cad1dcaaa01e9d14c7f492a8d6b80161bca55fe`

## Changes completed

1. **Checkout retry idempotency**
   - Checkout creates a UUID idempotency key and keeps it in `sessionStorage` until a successful response is received.
   - The key is validated by the server-side order input schema.
   - Preview `place-order` derives a stable order code from the key, checks for an existing order before catalog and stock processing, and returns the original persisted order for a matching retry.
   - Reusing the same key with different customer/order details returns HTTP 409 (`idempotency_conflict`) rather than creating another order.
   - The unique-order-code race is handled by checking the existing order after a unique constraint conflict.
   - Preview Edge Function `place-order` deployed as version 6. Production function was not changed.

2. **Product deletion safety**
   - Replaced permanent product deletion with archival (`active=false`) and updated the admin UI label/confirmation.
   - Archived product data remains in the database and can be reactivated from the editor.

3. **Admin product loading**
   - Product list now uses the authenticated server function `listAdminProducts` rather than a direct browser query.
   - Explicitly passes the active access token during both login and session restoration. This avoids relying on a React state update having committed before the first data request.

4. **Admin deep-link routing**
   - Replaced the client-effect redirect on `/admin/products` with a router-level redirect to `/admin?tab=products`.
   - Added a backwards-compatible `/products` route that redirects to the canonical catalog route `/shop`.

5. **Admin SSR / hydration stability**
   - Removed direct `window.location.hash` access from the initial render.
   - Deferred reading remembered login details from `localStorage` and password-recovery hash state until after hydration, keeping server and first client renders consistent.

6. **Canonical metadata**
   - Centralized the canonical site origin in `src/lib/site-config.ts`.
   - Replaced stale Lovable canonical/Open Graph URLs on About, Contact, Shipping, Privacy, Terms and Returns pages with the current public Worker origin.

## Validation performed

- GitHub branch writes completed on `feature/store-admin-cms` only.
- GitHub Actions for commit `7cad1dcaaa01e9d14c7f492a8d6b80161bca55fe`: dependency install, `bun run test`, and `bun run build` all succeeded.
- Cloudflare Workers Preview build for the same commit completed successfully with `bun run build` and `npx wrangler preview`; Preview environment points to the separate Preview Supabase project.
- Browser tests against the Preview Worker:
  - `/products` redirected to `/shop` and displayed the catalog.
  - `/admin/products` redirected to `/admin?tab=products`; unauthenticated login screen rendered.
  - Direct `/admin?tab=products` rendered the login screen.
  - Product detail, add-to-cart, cart, and checkout form rendered; cart item and total carried through to checkout.
  - No JavaScript page errors or console errors were reported in the final browser run.
  - No order was submitted; the checkout flow was intentionally stopped before submission.
- One third-party product image request for the smart moving cat ball was blocked by the remote image host (ORB); the page's image error fallback is active. This image needs a verified replacement.
- Preview database policy inspection confirmed the order RPC's execute privilege is not granted to `anon` or `authenticated`; it is available to `service_role`.
- No Production deploy, Production schema change, order mutation, PR merge, or traffic change was performed.

## Remaining release blockers

1. Production schema remains behind the application contract: `orders.shipping_toman`, `orders.user_id`, `products.stock_quantity`, and `store_content` need a reviewed additive migration plan. Do not run it until a migration is generated and reviewed through the Supabase CLI workflow.
2. Production `place-order` v1 still returns the older response shape and does not implement the new idempotency behavior. It was intentionally not deployed or modified.
3. Admin sign-in and authenticated management actions are not yet verified in a browser. Required acceptance checks include product list/save/archive/reactivate, image upload, CMS save/reload, order list/status updates, guest checkout, authenticated checkout, and duplicate retry. These require an authorized admin account/session; no password or secret was requested or exposed.
4. Supabase Auth leaked-password protection remains disabled (Security Advisor warning).
5. Payment gateway and SMS notifications are not integrated; current payment flow is support-coordinated.
6. Real supplier-confirmed stock, costs, shipping operations, and final public contact details still need business verification.
7. The production build emits a non-blocking large JavaScript chunk warning (main client bundle about 690 kB before gzip); code-splitting/performance work remains advisable.
8. One product image source is unreliable and needs a verified replacement.

## Release rule

Do not merge PR #2, deploy to Production, change Worker traffic, or migrate Production data until the blockers above are resolved, browser acceptance tests pass, and the user explicitly approves the Production release.
