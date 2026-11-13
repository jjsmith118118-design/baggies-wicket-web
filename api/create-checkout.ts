// POST /api/create-checkout
// Body: { items: [{ productId, childId?, size?, quantity? }], method?: "card" | "bank" }
// Prices the basket on the server (including sibling discounts), records a
// pending order, and returns where to send the member to pay:
//   card (default) – a Stripe Checkout page
//   bank           – TrueLayer's pay-by-bank page
import { getStripe, getSupabaseAdmin, getUserFromRequest, json } from "./_lib/server.js";
import { priceBasket, PricingError, type BasketItem } from "./_lib/pricing.js";
import { createTrueLayerPayment, truelayerEnabled } from "./_lib/truelayer.js";
import { newOrderReference } from "./_lib/bankOrders.js";

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return json({ error: "Please log in again." }, 401);

    const body = (await request.json().catch(() => null)) as { items?: BasketItem[]; method?: string } | null;
    const method = body?.method === "bank" ? "bank" : "card";
    const supabase = getSupabaseAdmin();
    const { lines, total } = await priceBasket(supabase, user.id, body?.items ?? []);

    // TrueLayer needs the payer's name.
    let payerName = "";
    if (method === "bank") {
      if (!truelayerEnabled()) return json({ error: "Pay by bank isn't available right now. Please pay by card." }, 400);
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      payerName = profile?.full_name?.trim() ?? "";
      if (!payerName) return json({ error: "Please add your name on the My family tab first." }, 400);
    }

    // Very rarely a random bank reference is already taken; just try another.
    let order: { id: string; payment_reference: string | null } | null = null;
    for (let attempt = 0; attempt < 5 && !order; attempt++) {
      const { data, error } = await supabase
        .from("orders")
        .insert({
          parent_id: user.id, total_pence: total, status: "pending", payment_method: method,
          payment_reference: method === "bank" ? newOrderReference() : null,
        })
        .select("id, payment_reference")
        .single();
      if (!error) order = data;
      else if (error.code !== "23505") throw error;
    }
    if (!order) throw new Error("Couldn't create the order");

    const { error: itemsError } = await supabase.from("order_items").insert(
      lines.map(({ note: _note, ...l }) => ({ ...l, order_id: order!.id })),
    );
    if (itemsError) throw itemsError;

    if (method === "bank") {
      const origin = process.env.SITE_URL?.trim() || request.headers.get("origin") || new URL(request.url).origin;
      try {
        const { truelayerPaymentId, payUrl } = await createTrueLayerPayment({
          paymentId: order.id,
          reference: order.payment_reference!,
          amountPence: total,
          payer: { name: payerName, email: user.email ?? "" },
          returnUrl: `${origin}/members`, // must be in TrueLayer's allowed redirect URIs
          metadata: { order_id: order.id },
        });
        const { error } = await supabase.from("orders").update({ truelayer_payment_id: truelayerPaymentId }).eq("id", order.id);
        if (error) throw error;
        return json({ url: payUrl });
      } catch (err) {
        console.error("TrueLayer payment failed to start", err);
        await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
        return json({ error: "Pay by bank isn't working right now. Please try again or pay by card." }, 502);
      }
    }

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
