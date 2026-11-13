// POST /api/truelayer-webhook
// TrueLayer calls this when a payment is executed or fails. It's the safety
// net for members who close the tab before getting back to the site.
// Set the webhook URI in TrueLayer Console → Settings → Webhooks.
//
// Every request is checked against TrueLayer's published signing keys, and we
// still ask TrueLayer for the payment's status before marking anything paid.
import { getSupabaseAdmin, json } from "./_lib/server.js";
import { verifyTrueLayerWebhook } from "./_lib/truelayer.js";
import { settleFromTrueLayer } from "./_lib/lottery.js";
import { settleOrderFromTrueLayer } from "./_lib/bankOrders.js";

const HANDLED = ["payment_executed", "payment_settled", "payment_failed"];

export async function POST(request: Request) {
  const body = await request.text();
  try {
    await verifyTrueLayerWebhook({
      signature: request.headers.get("tl-signature"),
      path: new URL(request.url).pathname,
      body,
      headers: Object.fromEntries(request.headers.entries()),
    });
  } catch (err) {
    console.error("TrueLayer webhook signature check failed", err);
    return json({ error: "Invalid signature" }, 401);
  }

  try {
    const event = JSON.parse(body) as { type?: string; payment_id?: string };
    // Acknowledge anything we don't need so TrueLayer doesn't keep retrying.
    if (!event.type || !HANDLED.includes(event.type) || !event.payment_id) return json({ received: true });

    const supabase = getSupabaseAdmin();

    // A 100 Club purchase?
    const { data: payment } = await supabase
      .from("lottery_payments").select("id").eq("provider_payment_id", event.payment_id).maybeSingle();
    if (payment) return json({ received: true, status: await settleFromTrueLayer(supabase, payment.id) });

    // Subs or kit paid by bank?
    const { data: order } = await supabase
      .from("orders").select("id").eq("truelayer_payment_id", event.payment_id).maybeSingle();
    if (order) return json({ received: true, status: await settleOrderFromTrueLayer(supabase, order.id) });

    return json({ received: true }); // not one of ours
  } catch (err) {
    console.error("TrueLayer webhook failed", err, body.slice(0, 1000));
    return json({ error: "Handler error" }, 500);
  }
}
