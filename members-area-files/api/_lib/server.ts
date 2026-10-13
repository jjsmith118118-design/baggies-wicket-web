// Shared helpers for the Vercel serverless functions.
// Files/folders starting with "_" inside /api are NOT exposed as endpoints.
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

export function getStripe() {
  return new Stripe(requireEnv("STRIPE_SECRET_KEY"));
}

// Service-role client: bypasses Row Level Security. Server-side ONLY.
export function getSupabaseAdmin() {
  return createClient(
    requireEnv("VITE_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Returns the signed-in user from the "Authorization: Bearer <token>" header.
export async function getUserFromRequest(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// Marks an order as paid using a Stripe Checkout Session. Safe to call more
// than once (from the webhook AND from the "thanks for paying" page).
export async function markOrderPaidFromSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return false;
  const orderId = session.metadata?.order_id ?? session.client_reference_id;
  if (!orderId) return false;

  const stripe = getStripe();
  const supabase = getSupabaseAdmin();

  let receiptUrl: string | null = null;
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;

  if (paymentIntentId) {
    try {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ["latest_charge"] });
      const charge = pi.latest_charge as Stripe.Charge | null;
      receiptUrl = charge?.receipt_url ?? null;
    } catch {
      // Receipt link is a nice-to-have; don't fail the payment over it.
    }
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      stripe_payment_intent: paymentIntentId,
      receipt_url: receiptUrl,
    })
    .eq("id", orderId)
    .eq("stripe_session_id", session.id)
    .in("status", ["pending", "cancelled"]);

  if (error) throw error;
  return true;
}
