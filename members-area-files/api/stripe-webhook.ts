// POST /api/stripe-webhook
// Stripe calls this when a payment completes, expires or is refunded.
// Set it up in Stripe → Developers → Webhooks (see MEMBERS_SETUP.md).
import type Stripe from "stripe";
import { getStripe, getSupabaseAdmin, json, markOrderPaidFromSession } from "./_lib/server.js";

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return json({ error: "Webhook not configured" }, 400);

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, secret);
  } catch (err) {
    console.error("Webhook signature check failed", err);
    return json({ error: "Invalid signature" }, 400);
  }

  try {
    const supabase = getSupabaseAdmin();

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await markOrderPaidFromSession(event.data.object as Stripe.Checkout.Session);
        break;

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await supabase.from("orders").update({ status: "cancelled" })
          .eq("stripe_session_id", session.id).eq("status", "pending");
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        // Only mark fully refunded charges; partial refunds stay "paid".
        if (charge.refunded && typeof charge.payment_intent === "string") {
          await supabase.from("orders").update({ status: "refunded" })
            .eq("stripe_payment_intent", charge.payment_intent);
        }
        break;
      }
    }
    return json({ received: true });
  } catch (err) {
    console.error("Webhook handling failed", err);
    return json({ error: "Handler error" }, 500);
  }
}
