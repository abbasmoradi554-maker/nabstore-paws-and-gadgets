# NABSTORE remediation log
Date: 2026-11-22
Branch: `feature/store-admin-cms`

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

4. **Canonical metadata**
   - Centralized the canonical site origin in `src/lib/site-config.ts`.
   - Replaced stale Lovable canonical/Open Graph URLs on About, Contact, Shipping, Privacy, Terms and Returns pages with the current public Worker origin.

## Validation performed

- GitHub branch writes completed on `feature/store-admin-cms` only.
- Preview Edge Function deployment returned ACTIVE, version 6.
- Source in the repository and deployed Preview function were checked before deployment.
- No Production deploy, Production schema change, order mutation, PR merge, or traffic change was performed.

## Remaining release blockers

1. Production schema remains behind the application contract: `orders.shipping_toman`, `orders.user_id`, `products.stock_quantity`, and `store_content` need a reviewed additive migration plan.
2. Production `place-order` v1 still returns the older response shape and does not implement the new idempotency behavior. It was intentionally not deployed or modified.
3. Real browser end-to-end tests have not been run in this environment. Required checks include admin login, product list/save/archive/reactivate, image upload, CMS save/reload, order list/status updates, guest checkout, authenticated checkout, and duplicate retry.
4. Supabase Auth leaked-password protection remains disabled (Security Advisor warning).
5. Payment gateway and SMS notifications are not integrated; current payment flow is support-coordinated.
6. Real supplier-confirmed stock, costs, shipping operations, and final public contact details still need business verification.

## Release rule

Do not merge PR #2, deploy to Production, change Worker traffic, or migrate Production data until the blockers above are resolved, browser acceptance tests pass, and the user explicitly approves the Production release.
