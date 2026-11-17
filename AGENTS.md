<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- All UI text goes through `src/lib/i18n.tsx` (fa default/RTL, en/LTR); use logical utilities (ms/me/ps/pe/start/end) so both directions work.
- Sample catalog lives in `src/data/products.ts` (category order = display order) and is replaced by the database later; never add fake stock, ratings or reviews to it.
- Contact details live only in `src/lib/site-config.ts`; `[BRACKETED]` values count as unset (use `isSet`). Why: one place to fill in real details.
- Orders are written only by the `placeOrder` server function, which re-prices items from the catalog; the `orders` table has no client policies. Why: never trust client prices.
- Cart lives in localStorage via `src/lib/cart.tsx`; read storage only in effects. Why: avoids hydration mismatches.
