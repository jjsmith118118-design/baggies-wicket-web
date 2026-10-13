// POST /api/confirm-checkout  Body: { sessionId }
// Called by the members dashboard when a parent returns from Stripe, so the
// payment shows as paid straight away (the webhook does the same job in the
// background, in case the parent closes the tab before getting back).
import { getStripe, getSupabaseAdmin, getUserFromRequest, json, markOrderPaidFromSession } from "./_lib/server.js";

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return json({ error: "Please log in again." }, 401);

    const { sessionId } = ((await request.json().catch(() => ({}))) ?? {}) as { sessionId?: string };
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
