// POST /api/lottery-admin  (committee only)
//   { action: "mark-paid", paymentId }   – the bank transfer has arrived
//   { action: "cancel", paymentId }      – never paid; releases the numbers
//   { action: "draw", month: "2027-03" } – runs that month's draw
//   { action: "prizes-paid", drawId }    – records that the winners have been paid
import { randomInt } from "node:crypto";
import { getSupabaseAdmin, getUserFromRequest, json } from "./_lib/server.js";
import { HUNDRED_CLUB, publicName } from "./_lib/hundredClub.js";
import { markLotteryPaid } from "./_lib/lottery.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return json({ error: "Please log in again." }, 401);
    const supabase = getSupabaseAdmin();
    const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle();
    if (!me?.is_admin) return json({ error: "Committee members only." }, 403);

    const body = ((await request.json().catch(() => null)) ?? {}) as Record<string, unknown>;

    switch (body.action) {
      case "mark-paid": {
        if (typeof body.paymentId !== "string" || !UUID.test(body.paymentId)) return json({ error: "Invalid payment." }, 400);
        const changed = await markLotteryPaid(supabase, body.paymentId, user.id);
        const { data } = await supabase.from("lottery_payments").select("unassigned_numbers").eq("id", body.paymentId).single();
        return json({ changed, unassigned: data?.unassigned_numbers ?? [] });
      }

      case "cancel": {
        if (typeof body.paymentId !== "string" || !UUID.test(body.paymentId)) return json({ error: "Invalid payment." }, 400);
        const { error } = await supabase.rpc("lottery_cancel", { p_payment: body.paymentId });
        if (error) throw error;
        return json({ ok: true });
      }

      case "prizes-paid": {
        if (typeof body.drawId !== "string" || !UUID.test(body.drawId)) return json({ error: "Invalid draw." }, 400);
        const { error } = await supabase.from("lottery_draws")
          .update({ prizes_paid_at: new Date().toISOString() }).eq("id", body.drawId).is("prizes_paid_at", null);
        if (error) throw error;
        return json({ ok: true });
      }

      case "draw": {
        const m = typeof body.month === "string" ? /^(\d{4})-(\d{2})$/.exec(body.month) : null;
        if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) return json({ error: "Choose a month." }, 400);
        const drawMonth = `${m[1]}-${m[2]}-01`;

        // In the draw: every number with a holder whose year hasn't run out.
        const today = new Date().toISOString().slice(0, 10);
        const { data: rows, error } = await supabase
          .from("club_numbers").select("number, holder_id").not("holder_id", "is", null).gte("paid_until", today).order("number");
        if (error) throw error;
        const eligible = (rows ?? []) as { number: number; holder_id: string }[];
        if (eligible.length < HUNDRED_CLUB.prizesPence.length) {
          return json({ error: `At least ${HUNDRED_CLUB.prizesPence.length} paid-up numbers are needed for a draw.` }, 400);
        }

        // Cryptographically random, without replacement: the same number can't win twice.
        const pool = [...eligible];
        const winners = HUNDRED_CLUB.prizesPence.map(() => pool.splice(randomInt(pool.length), 1)[0]);

        const ids = [...new Set(winners.map((w) => w.holder_id))];
        const { data: people } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        const nameOf = (id: string) => publicName(people?.find((p) => p.id === id)?.full_name);

        const [first, second] = winners;
        const { data: draw, error: insertError } = await supabase.from("lottery_draws").insert({
          draw_month: drawMonth,
          drawn_by: user.id,
          eligible_numbers: eligible.map((e) => e.number),
          first_number: first.number, first_holder_id: first.holder_id, first_winner_name: nameOf(first.holder_id),
          first_prize_pence: HUNDRED_CLUB.prizesPence[0],
          second_number: second.number, second_holder_id: second.holder_id, second_winner_name: nameOf(second.holder_id),
          second_prize_pence: HUNDRED_CLUB.prizesPence[1],
        }).select().single();
        if (insertError?.code === "23505") return json({ error: "That month has already been drawn." }, 409);
        if (insertError) throw insertError;
        return json({ draw });
      }

      default:
        return json({ error: "Unknown request." }, 400);
    }
  } catch (err) {
    console.error("lottery-admin failed", err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
}
