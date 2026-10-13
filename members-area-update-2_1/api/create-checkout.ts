// POST /api/create-checkout
// Body: { items: [{ productId, childId?, size?, quantity? }] }
// Prices the basket on the server (including sibling discounts), records a
// pending order, and returns a Stripe Checkout URL.
import { getStripe, getSupabaseAdmin, getUserFromRequest, json } from "./_lib/server.js";
import { priceBasket, PricingError, type BasketItem } from "./_lib/pricing.js";

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return json({ error: "Please log in again." }, 401);

    const body = (await request.json().catch(() => null)) as { items?: BasketItem[] } | null;
    const supabase = getSupabaseAdmin();
    const { lines, total } = await priceBasket(supabase, user.id, body?.items ?? []);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({ parent_id: user.id, total_pence: total, status: "pending" })
      .select()
      .single();
    if (orderError) throw orderError;

    const { error: itemsError } = await supabase.from("order_items").insert(
      lines.map(({ note: _note, ...l }) => ({ ...l, order_id: order.id })),
    );
    if (itemsError) throw itemsError;

    // Send people back to whichever site they came from (works on preview links too).
    const origin = request.headers.get("origin") ?? process.env.SITE_URL ?? new URL(request.url).origin;

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      client_reference_id: order.id,
      metadata: { order_id: order.id },
      payment_intent_data: { metadata: { order_id: order.id } },
      line_items: lines.map((l) => ({
        quantity: l.quantity,
        price_data: { currency: "gbp", unit_amount: l.unit_price_pence, product_data: { name: l.description } },
      })),
      success_url: `${origin}/members?paid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/members/shop?cancelled=1`,
    });

    await supabase.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);
    return json({ url: session.url });
  } catch (err) {
    if (err instanceof PricingError) return json({ error: err.message }, 400);
    console.error("create-checkout failed", err);
    return json({ error: "Couldn't start the payment. Please try again." }, 500);
  }
}
