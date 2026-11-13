// POST /api/lottery-checkout
//   { action: "buy", numbers: [7, 42], ageConfirmed: true }
//     Holds the numbers, records a pending payment with its own bank reference,
//     and returns a TrueLayer pay-by-bank link (or the club's bank details if
//     TrueLayer isn't switched on).
//   { action: "confirm", truelayerPaymentId }
//     Called when the member comes back from TrueLayer. Checks with TrueLayer
//     whether the money has gone and, if so, marks the numbers as theirs.
import { getSupabaseAdmin, getUserFromRequest, json } from "./_lib/server.js";
import { HUNDRED_CLUB } from "./_lib/hundredClub.js";
import { createTrueLayerPayment, truelayerEnabled } from "./_lib/truelayer.js";
import { newReference, settleFromTrueLayer } from "./_lib/lottery.js";

type Body =
  | { action: "buy"; numbers?: unknown; ageConfirmed?: unknown }
  | { action: "confirm"; truelayerPaymentId?: unknown };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return json({ error: "Please log in again." }, 401);
    const body = (await request.json().catch(() => null)) as Body | null;
    const supabase = getSupabaseAdmin();

    if (body?.action === "confirm") {
      // TrueLayer adds its own payment_id to the return link; find our purchase from it.
      const { truelayerPaymentId } = body;
      if (typeof truelayerPaymentId !== "string" || !UUID.test(truelayerPaymentId)) return json({ error: "Invalid payment." }, 400);
      const { data: payment } = await supabase
        .from("lottery_payments").select("id, member_id").eq("provider_payment_id", truelayerPaymentId).maybeSingle();
      if (!payment || payment.member_id !== user.id) return json({ error: "Payment not found." }, 404);
      return json({ status: await settleFromTrueLayer(supabase, payment.id) });
    }

    if (body?.action !== "buy") return json({ error: "Unknown request." }, 400);

    if (body.ageConfirmed !== true) {
      return json({ error: `You must be ${HUNDRED_CLUB.minimumAge} or over to join the 100 Club.` }, 400);
    }
    const raw = Array.isArray(body.numbers) ? body.numbers : [];
    const numbers = [...new Set(raw)].filter(
      (n): n is number => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= HUNDRED_CLUB.totalNumbers,
    ).sort((a, b) => a - b);
    if (numbers.length === 0 || numbers.length !== raw.length) return json({ error: "Please choose your numbers again." }, 400);
    if (numbers.length > HUNDRED_CLUB.maxPerPurchase) {
      return json({ error: `You can buy up to ${HUNDRED_CLUB.maxPerPurchase} numbers at a time.` }, 400);
    }

    // TrueLayer needs the payer's name.
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    const useTrueLayer = truelayerEnabled();
    if (useTrueLayer && !profile?.full_name?.trim()) {
      return json({ error: "Please add your name on the My family tab first." }, 400);
    }

    const amount = numbers.length * HUNDRED_CLUB.pricePerNumberPence;
    const method = useTrueLayer ? "truelayer" : "bank_transfer";

    // Very rarely a random reference is already taken; just try another.
    let paymentId: string | null = null;
    let reference = "";
    for (let attempt = 0; attempt < 5 && !paymentId; attempt++) {
      reference = newReference();
      const { data, error } = await supabase.rpc("lottery_reserve", {
        p_member: user.id, p_numbers: numbers, p_amount: amount, p_reference: reference, p_method: method,
        p_reserve_days: HUNDRED_CLUB.reserveDays, p_grace_days: HUNDRED_CLUB.renewalGraceDays,
      });
      if (!error) { paymentId = data as string; break; }
      const taken = /NUMBER_UNAVAILABLE:(\d+)/.exec(error.message);
      if (taken) return json({ error: `Sorry, number ${taken[1]} has just been taken. Please pick another.` }, 409);
      if (error.code !== "23505") throw error; // 23505 = duplicate reference
    }
    if (!paymentId) throw new Error("Couldn't create a unique reference");

    const bankTransfer = { paymentId, reference, amountPence: amount, numbers, bank: HUNDRED_CLUB.bank };
    if (!useTrueLayer) return json(bankTransfer);

    try {
      const origin = process.env.SITE_URL ?? request.headers.get("origin") ?? new URL(request.url).origin;
      const { truelayerPaymentId, payUrl } = await createTrueLayerPayment({
        paymentId, reference, amountPence: amount,
        payer: { name: profile!.full_name!.trim(), email: user.email ?? "" },
        returnUrl: `${origin}/members/100-club`,
        metadata: { lottery_payment_id: paymentId },
      });
      const { error } = await supabase.from("lottery_payments")
        .update({ provider_payment_id: truelayerPaymentId }).eq("id", paymentId);
      if (error) throw error;
      return json({ ...bankTransfer, payUrl });
    } catch (err) {
      // TrueLayer is down or misconfigured: the numbers are still held, so let them pay by transfer.
      console.error("TrueLayer payment failed to start", err);
      await supabase.from("lottery_payments").update({ method: "bank_transfer" }).eq("id", paymentId);
      return json(bankTransfer);
    }
  } catch (err) {
    console.error("lottery-checkout failed", err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
}
