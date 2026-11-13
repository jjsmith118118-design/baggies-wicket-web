// POST /api/confirm-checkout
//   Body: { sessionId }            – returning from Stripe (card)
//   Body: { truelayerPaymentId }   – returning from TrueLayer (bank)
// Called by the members dashboard when a parent returns from paying, so the
// payment shows as paid straight away (the webhooks do the same job in the
// background, in case the parent closes the tab before getting back).
import { getStripe, getSupabaseAdmin, getUserFromRequest, json, markOrderPaidFromSession } from "./_lib/server.js";
import { settleOrderFromTrueLayer } from "./_lib/bankOrders.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return json({ error: "Please log in again." }, 401);

    const { sessionId, truelayerPaymentId } =
      ((await request.json().catch(() => ({}))) ?? {}) as { sessionId?: string; truelayerPaymentId?: string };

    if (typeof truelayerPaymentId === "string") {
      if (!UUID.test(truelayerPaymentId)) return json({ error: "Invalid payment." }, 400);
      const { data: order } = await getSupabaseAdmin()
        .from("orders").select("id, parent_id").eq("truelayer_payment_id", truelayerPaymentId).maybeSingle();
      if (!order || order.parent_id !== user.id) return json({ error: "Order not found." }, 404);
      const status = await settleOrderFromTrueLayer(getSupabaseAdmin(), order.id);
      return json({ paid: status === "paid", status });
    }

    if (!sessionId || !sessionId.startsWith("cs_")) return json({ error: "Invalid session." }, 400);

    // Make sure this checkout belongs to the signed-in parent.
    const { data: order } = await getSupabaseAdmin()
      .from("orders")
      .select("id, parent_id")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();
    if (!order || order.parent_id !== user.id) return json({ error: "Order not found." }, 404);

    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const paid = await markOrderPaidFromSession(session);
    return json({ paid });
  } catch (err) {
    console.error("confirm-checkout failed", err);
    return json({ error: "Couldn't confirm the payment." }, 500);
  }
}
