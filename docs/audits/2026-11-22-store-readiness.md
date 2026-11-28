# NABSTORE Technical Readiness Audit
Date: 2026-11-22
Scope: GitHub branch `feature/store-admin-cms`, Supabase Preview project, Supabase Production project, read-only schema/policy/function inspection, current CI metadata.
Safety: No production deployment, traffic change, database mutation, order mutation, merge, or credential access was performed.

## Executive conclusion

**Not ready for public sales / production cutover.** The feature branch builds successfully in CI, but the current Preview and Production environments are not schema/API compatible. The code currently targets the newer Preview schema and Edge Function contract, while Production still has the older schema and `place-order` function contract. This is a concrete launch blocker.

The reported admin slowness/404 cannot be conclusively reproduced without a real browser session, but static review found several definite environment mismatches that can cause failed admin, catalog, account, and checkout requests when the app is pointed at Production.

## Confirmed findings

### P0 — Production checkout can create an order and then report failure to the customer

- Frontend `src/lib/orders.functions.ts` accepts a successful order response only if it contains `code`, `lines`, `total`, and numeric `shippingToman`.
- Production `place-order` v1 returns `{ code, lines, total }` and does not return `shippingToman`.
- Therefore, on Production, the Edge Function can persist the order successfully, but the frontend's response validation rejects the response and displays a generic failure. A customer retry could create a duplicate order.
- Preview `place-order` v5 returns the newer shipping-aware response shape. The two environments are not equivalent.
- **Remediation:** Do not point the current branch at Production or invite real orders until the API contract is versioned/aligned and an end-to-end checkout test confirms exactly one order is persisted and acknowledged.

### P0 — Production database schema is behind the application contract

The application currently expects fields/tables that were not present in Production during this audit:

- `orders.shipping_toman`: selected by the admin order list and customer account page; absent in Production.
- `orders.user_id`: needed for customer ownership and claim-order flow; absent in Production.
- `products.stock_quantity`: selected by public catalog and product-admin queries and used by inventory-aware checkout; absent in Production.
- `public.store_content`: used by homepage/contact/CMS and by Preview checkout shipping configuration; absent in Production.
- Preview contains these newer fields/table.
- **Impact:** Production order-list/account queries that select missing columns fail as a whole; product catalog/admin queries selecting `stock_quantity` fail; CMS cannot load/save; the Preview customer-order-claim workflow cannot work against the old Production schema.
- **Remediation:** Prepare reviewed, additive, backwards-compatible migrations and a data-preserving rollout plan before any Production schema change. Do not drop, rewrite, or overwrite existing order records.

### P1 — Customer account and order-claim are Preview-only in practice

- Preview has `claim-order` v2 and the `orders.user_id` field.
- Production only has `place-order` v1 in the inspected function list and has no `user_id` column.
- Customer account code queries `shipping_toman` and `user_id`-based order ownership.
- **Impact:** customer account/order history and claiming guest orders are not ready for Production.

### P1 — Admin content management is tied to Preview schema

- `AdminContentPage` reads and upserts `public.store_content`.
- Production has no `store_content` table.
- **Impact:** CMS tab cannot operate on Production until schema and RLS policies are migrated.

### P1 — Current admin/product code has a destructive hard-delete action

- Product admin exposes a direct delete operation.
- Even if order items are stored as snapshots today, hard deletion is a poor operational default for a live store and can break future references/analytics.
- **Remediation:** Prefer archive/deactivate (`active=false`) for ordinary admin workflows; reserve permanent deletion for a guarded maintenance process after checking references and backups.

### P1 — Environment-specific administrator identity is duplicated in code and database policies

- The admin server functions and database RLS policies each contain a hard-coded administrator email.
- This creates drift risk when admin identity changes and makes role expansion/auditing harder.
- **Remediation:** Move toward a centrally managed authorization role in trusted app metadata or a dedicated protected role table, with a careful policy migration. Do not loosen RLS during this change.

### P2 — SEO canonical URLs still reference the old Lovable hostname

Several route metadata files (including About, Contact, Shipping, Privacy, and Terms) set canonical/Open Graph URLs to the old `lovable.app` domain. This can split indexing and social previews across hostnames.
- **Remediation:** Centralize the canonical origin and generate route URLs from the intended public domain after the domain/canonical decision is final.

### P2 — External image optimization adds a third-party dependency

`optimizedProductImage` routes external product photos through `images.weserv.nl`. This adds a dependency outside the store's hosting and may fail or be unavailable during international connectivity restrictions.
- **Remediation:** For launch-critical assets, store optimized images in the store's own object storage/CDN; keep original source URLs as provenance where appropriate.

### P2 — Security advisor warning

Supabase Security Advisor reported `auth_leaked_password_protection` as WARN in both projects: leaked-password protection is disabled. No other security lint was returned in the inspected advisor results.
- **Remediation:** Enable leaked-password protection in Auth settings when available and verify signup/password-reset behavior. This setting change was not performed.

### P2 — Performance advisor

Preview advisor reported one unused index (`orders_user_created_at_idx`). This is informational, not a launch blocker. Do not drop it based only on this observation; re-evaluate after representative query traffic.

## Positive controls observed

- Public product reads are limited to active products by RLS.
- Order rows are not publicly readable; Preview order reads are limited to the owner or configured store administrator.
- Product writes and order status changes are restricted to the configured store administrator in RLS.
- Checkout prices are recalculated server-side from database product records; client-submitted prices are not trusted.
- Preview order creation uses a transactional RPC with per-mobile rate limiting and stock checks.
- Preview claim-order endpoint validates the authenticated user, order code and mobile number, and rate-limits claim attempts.
- No service-role or secret key is required by the browser-facing admin code; privileged checkout/claim logic remains in Edge Functions.
- The current CI run for commit `e976c97cecc3397aaa684a8d50202c51ee0884ee` completed successfully.

## Feature coverage snapshot

| Capability | Code status | Launch status |
|---|---|---|
| Homepage, categories, product detail | Implemented | Needs real-data and browser verification |
| Search and catalog filters | Implemented | Needs browser verification |
| Cart and checkout form | Implemented | Blocked by Production response/schema mismatch |
| Admin order list/status changes | Implemented | Blocked by Production missing `shipping_toman` |
| Admin product CRUD/image upload | Implemented | Blocked by Production missing `stock_quantity` and storage/RLS parity review |
| CMS/store settings | Implemented | Blocked by missing Production `store_content` |
| Customer account/order history | Implemented | Blocked by Production missing `user_id` and `shipping_toman` |
| Payment gateway | Not integrated | Not ready; support-coordinated payment only |
| SMS notifications | Not integrated/verified | Not ready |
| Verified reviews, wishlist, comparison, blog, discount engine | Not confirmed as complete | Not launch-ready |
| Supplier-confirmed inventory/prices | Not verified | Not ready for real sales |

## Recommended remediation order

1. **Freeze Production writes and preserve all current orders.** Keep the current branch and Preview as the development target.
2. **Establish one canonical application/database contract.** Decide which schema and Edge Function response is authoritative; Preview currently represents the newer contract.
3. **Write additive migrations for Production** (`shipping_toman`, `user_id`, `stock_quantity`, `store_content`, supporting indexes/policies/functions) with explicit backfill/default rules and rollback plan. Review migrations before applying.
4. **Version and align Edge Function contracts.** Ensure checkout's accepted response shape matches the deployed function, and add an idempotency key so network retries cannot create duplicate orders.
5. **Replace product hard-delete with archive/deactivate.**
6. **Centralize admin authorization and canonical URL configuration.**
7. **Run browser-based acceptance tests** against Preview: direct URL loads, admin sign-in, orders list/status update, product CRUD, image upload, CMS save/reload, guest checkout, authenticated checkout, customer claim/history, mobile layout, and 404/deep-link refresh.
8. **Only after all tests pass:** plan a separately approved Production migration and release. No merge/deploy is implied by this audit.

## Verification limitations

- CI success proves install/test/build only; it does not prove real browser behavior or database compatibility.
- No browser automation/session was available in this audit, so the reported 404/slow-load symptom was not reproduced directly.
- No Production data rows were read or changed. Schema, RLS policy metadata, function definitions, and advisor output were inspected read-only.
- This report does not authorize a Production migration, deploy, traffic switch, PR merge, or any order/data modification.
