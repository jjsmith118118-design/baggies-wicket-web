// Server-side 100 Club helpers, used by the checkout, admin and webhook endpoints.
import { randomInt } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { HUNDRED_CLUB, REFERENCE_ALPHABET, makeReference } from "./hundredClub.js";
import { TRUELAYER_FAILED, TRUELAYER_PAID, getTrueLayerPaymentStatus } from "./truelayer.js";

export function newReference() {
  let chars = "";
  for (let i = 0; i < 6; i++) chars += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  return makeReference(chars);
}

export async function markLotteryPaid(supabase: SupabaseClient, paymentId: string, confirmedBy: string | null) {
  const { data, error } = await supabase.rpc("lottery_mark_paid", {
    p_payment: paymentId,
    p_confirmed_by: confirmedBy,
    p_grace_days: HUNDRED_CLUB.renewalGraceDays,
  });
  if (error) throw error;
  return data === true;
}

/**
 * Asks TrueLayer itself about the payment linked to this purchase (never
 * trusting what the browser says) and marks it paid once the money has gone.
 */
export async function settleFromTrueLayer(
  supabase: SupabaseClient, lotteryPaymentId: string,
): Promise<"paid" | "processing" | "failed"> {
  const { data: payment } = await supabase
    .from("lottery_payments").select("id, status, provider_payment_id").eq("id", lotteryPaymentId).maybeSingle();
  if (!payment) throw new Error("Unknown 100 Club payment");
  if (payment.status === "paid") return "paid";
  if (!payment.provider_payment_id) return "processing";

  const status = await getTrueLayerPaymentStatus(payment.provider_payment_id);
  if (TRUELAYER_PAID.includes(status)) {
    await markLotteryPaid(supabase, lotteryPaymentId, null);
    return "paid";
  }
  // On failure the numbers stay held, so the member can still pay by bank transfer.
  return TRUELAYER_FAILED.includes(status) ? "failed" : "processing";
}
