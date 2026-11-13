// Pay-by-bank (TrueLayer) for subs and kit orders. Card payments still go
// through Stripe; this only handles orders where payment_method = 'bank'.
import { randomInt } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { REFERENCE_ALPHABET } from "./hundredClub.js";
import { TRUELAYER_FAILED, TRUELAYER_PAID, getTrueLayerPaymentStatus } from "./truelayer.js";
import { notifyDiscord } from "./discord.js";

/** Bank statement reference for a shop order, e.g. "KBCC-7QX4MZ" (UK max 18 characters). */
export function newOrderReference() {
  let chars = "";
  for (let i = 0; i < 6; i++) chars += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  return `KBCC-${chars}`;
}

/**
 * Asks TrueLayer itself whether an order's payment has gone (never trusting
 * the browser or the webhook body) and marks the order paid if so.
 * Safe to call more than once: only the call that changes it posts to Discord.
 */
export async function settleOrderFromTrueLayer(
  supabase: SupabaseClient, orderId: string,
): Promise<"paid" | "processing" | "failed"> {
  const { data: order } = await supabase
    .from("orders").select("id, status, truelayer_payment_id").eq("id", orderId).maybeSingle();
  if (!order) throw new Error("Unknown order");
  if (order.status === "paid") return "paid";
  if (!order.truelayer_payment_id) return "processing";

  const status = await getTrueLayerPaymentStatus(order.truelayer_payment_id);
  if (TRUELAYER_PAID.includes(status)) {
    const { data: updated, error } = await supabase
      .from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", orderId)
      .in("status", ["pending", "cancelled"])
      .select("id");
    if (error) throw error;
    if (updated && updated.length > 0) await notifyDiscord(supabase, orderId, "paid");
    return "paid";
  }
  if (TRUELAYER_FAILED.includes(status)) {
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId).eq("status", "pending");
    return "failed";
  }
  return "processing";
}
