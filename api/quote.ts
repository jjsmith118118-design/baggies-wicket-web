// POST /api/quote  Body: { items }
// Returns the server's prices for a basket (including sibling discounts) so
// the basket shows exactly what will be charged. Lines come back in the
// same order as the items sent.
import { getSupabaseAdmin, getUserFromRequest, json } from "./_lib/server.js";
import { priceBasket, PricingError, type BasketItem } from "./_lib/pricing.js";

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return json({ error: "Please log in again." }, 401);
    const body = (await request.json().catch(() => null)) as { items?: BasketItem[] } | null;
    const { lines, total } = await priceBasket(getSupabaseAdmin(), user.id, body?.items ?? []);
    return json({
      total,
      lines: lines.map((l) => ({ unit_price_pence: l.unit_price_pence, full_price_pence: l.full_price_pence, note: l.note })),
    });
  } catch (err) {
    if (err instanceof PricingError) return json({ error: err.message }, 400);
    console.error("quote failed", err);
    return json({ error: "Couldn't price your basket. Please try again." }, 500);
  }
}
