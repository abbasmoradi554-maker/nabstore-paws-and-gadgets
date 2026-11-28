# NABSTORE Production additive migration plan
Date: 2026-11-22
Target: Supabase Production project only after explicit release approval
Status: **Plan only — no Production changes have been executed**

## Verified Production baseline (read-only)

- `public.orders` has its existing customer/order columns and two existing rows. It does not have `shipping_toman` or `user_id`.
- `public.products` has six existing rows and does not have `stock_quantity`.
- `public.store_content` does not exist.
- Storage bucket `product-images` does not exist.
- Existing Production RLS policies:
  - `orders`: authenticated admin SELECT and authenticated admin UPDATE.
  - `products`: authenticated admin ALL and public SELECT where `active=true`.
- Existing Production RPC `place_order_with_rate_limit` has the legacy 10-argument signature, is SECURITY DEFINER, and is executable by `service_role` only. It inserts legacy orders without shipping or stock reservation.
- Existing Production Edge Function `place-order` remains version 1 and returns the legacy response shape.

## Required additive schema changes

1. **Orders**
   - Add nullable `user_id uuid` referencing `auth.users(id)` with `ON DELETE SET NULL`.
   - Add `shipping_toman bigint` without changing historical order totals. For existing rows, backfill `0` (the legacy Production checkout did not store a separate shipping amount). Set the column default to `0` for legacy callers and make it NOT NULL.
   - Add an authenticated SELECT policy for order owners (`auth.uid() = user_id`) while retaining the existing admin SELECT/UPDATE policies. No anonymous order SELECT/INSERT/UPDATE/DELETE policy is to be added.
   - Do not update, delete, or rewrite any existing order row other than populating the new `shipping_toman=0` column.

2. **Products**
   - Add nullable `stock_quantity integer`. NULL means stock is not tracked; a positive integer is tracked stock; zero means unavailable.
   - Add a non-negative check constraint, preferably `NOT VALID` first and validate after the preflight check.

3. **Store content / CMS**
   - Create `public.store_content(key text primary key, value jsonb not null default '{}', updated_at timestamptz not null default now())`.
   - Enable RLS.
   - Add public SELECT only, plus authenticated admin INSERT/UPDATE/DELETE policies matching the existing admin-email policy convention. Do not add anonymous write policies.
   - Seed the `shipping` key only when absent. The Preview configuration currently uses `enabled=true`, `flatFeeToman=59000`, and `freeAboveToman=2000000`; confirm these business values before copying them to Production.
   - Seed other CMS keys (`faq`, `footer`, `home`, `pages`, `store`) from reviewed content only, using insert-if-absent. Never overwrite existing content.

4. **Product image storage**
   - Create public bucket `product-images`.
   - Allow only `image/jpeg`, `image/png`, `image/webp`, and `image/avif`.
   - Set the upload size limit to 8 MiB to match the current admin upload validation.
   - A Production `storage.objects` admin-only INSERT policy for `product-images` already exists; preserve it and verify it becomes effective after bucket creation. Public object reads are expected because the bucket is public. Do not grant anonymous uploads, updates, or deletes.

## RPC and Edge Function compatibility

- Do not replace or drop the existing 10-argument RPC while the legacy Production Edge Function may still call it.
- Add a separate 12-argument overload matching the Preview contract:
  `p_order_code, p_customer_name, p_mobile, p_province, p_city, p_address, p_postal_code, p_notes, p_items, p_total_toman, p_shipping_toman, p_user_id`.
- The new overload must preserve the mobile rate limit, reserve/decrement tracked stock atomically, reject insufficient stock, insert `shipping_toman` and `user_id`, and remain SECURITY DEFINER with `search_path = public, pg_temp`.
- Explicitly revoke EXECUTE from `PUBLIC`, `anon`, and `authenticated`; grant EXECUTE only to `service_role`.
- Deploy the reviewed Production `place-order` Edge Function only after the schema and RPC are ready. The new function must be verified to use the 12-argument RPC and return the new response contract.
- Do not deploy the Preview `claim-order` function blindly. Its claim-attempt rate-limit table/RPC and account UI requirements must be assessed as a separate migration.

## Execution sequence (not authorized yet)

1. Generate a timestamped migration using the Supabase CLI workflow; do not hand-invent a migration filename.
2. Take a fresh Production backup and record table row counts, existing order IDs/order codes, current policies, function signatures, bucket state, and current Worker version/traffic.
3. Review the generated migration for additive-only behavior, idempotent policy/table creation, correct grants, and no destructive statements.
4. Apply to a disposable/Preview database first and test:
   - existing order rows and totals remain unchanged;
   - new `shipping_toman` values are explicit for the new RPC and zero for legacy RPC callers;
   - tracked stock is decremented atomically and cannot go negative;
   - untracked NULL stock remains unlimited;
   - public product/CMS reads work;
   - admin-only product/CMS writes and image uploads work;
   - anonymous users cannot read orders or execute the SECURITY DEFINER RPC.
5. Only after explicit Production approval: apply the migration, deploy the new Production Edge Function, then deploy the matching Worker release. Keep the previous Worker version available for rollback.
6. Verify real browser checkout, retry/idempotency, admin product save/archive/reactivate, image upload, CMS save/reload, and order list/status update. Never use real customer details for test orders.

## Rollback / preservation rules

- This plan is additive. If the release fails, roll back the Worker/Edge Function deployment to the previous compatible versions; leave the new columns/table/bucket in place until a separate reviewed cleanup is authorized.
- Do not delete, truncate, overwrite, or recreate `orders` or `products`.
- Do not alter existing order rows except setting the newly added `shipping_toman` field to zero for historical records.
- Do not merge PR #2, change Worker traffic, or deploy Production without explicit approval.
