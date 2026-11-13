import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Copy, Landmark, Loader2, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { callApi, formatDate, formatPence } from "@/lib/members";
import { HUNDRED_CLUB } from "../../../api/_lib/hundredClub";

type Cell = { number: number; state: "available" | "taken" | "reserved" | "mine" | "mine_pending"; paid_until: string | null };
export type LotteryPayment = {
  id: string; member_id: string; numbers: number[]; amount_pence: number; reference: string;
  method: "truelayer" | "bank_transfer"; status: "pending" | "paid" | "cancelled";
  unassigned_numbers: number[] | null; created_at: string; paid_at: string | null;
};
export type LotteryDraw = {
  id: string; draw_month: string; drawn_at: string; eligible_numbers: number[];
  first_number: number; first_winner_name: string; first_prize_pence: number; first_holder_id: string | null;
  second_number: number; second_winner_name: string; second_prize_pence: number; second_holder_id: string | null;
  prizes_paid_at: string | null;
};
type BuyResult = {
  paymentId: string; reference: string; amountPence: number; numbers: number[];
  bank: typeof HUNDRED_CLUB.bank; payUrl?: string;
};

export const monthName = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

const [FIRST_PRIZE, SECOND_PRIZE] = HUNDRED_CLUB.prizesPence;

const cellStyles: Record<Cell["state"], string> = {
  available: "bg-background hover:bg-primary/10 border-border",
  taken: "bg-muted text-muted-foreground/60 border-transparent cursor-not-allowed",
  reserved: "bg-muted text-muted-foreground/60 border-transparent cursor-not-allowed", // someone else's, awaiting payment
  mine: "bg-primary text-primary-foreground border-primary",
  mine_pending: "bg-amber-100 text-amber-900 border-amber-300",
};

const copy = (text: string) =>
  navigator.clipboard.writeText(text).then(() => toast.success("Copied"), () => toast("Couldn't copy – please type it in."));

/** Bank details with the reference the member must use. */
export function TransferDetails({ reference, amountPence }: { reference: string; amountPence: number }) {
  const rows: [string, string][] = [
    ["Amount", formatPence(amountPence)],
    ["Account name", HUNDRED_CLUB.bank.accountName],
    ["Sort code", HUNDRED_CLUB.bank.sortCode],
    ["Account number", HUNDRED_CLUB.bank.accountNumber],
    ["Reference", reference],
  ];
  return (
    <dl className="grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-2 text-sm max-w-md">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className={`font-medium ${label === "Reference" ? "font-mono text-base" : ""}`}>{value}</dd>
          <dd>
            {label !== "Amount" && label !== "Account name" && (
              <button onClick={() => copy(value.replace(/-/g, label === "Reference" ? "-" : ""))}
                      className="text-muted-foreground hover:text-foreground" aria-label={`Copy ${label.toLowerCase()}`}>
                <Copy className="h-4 w-4" />
              </button>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const HundredClub = () => {
  const { session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [board, setBoard] = useState<Cell[]>([]);
  const [payments, setPayments] = useState<LotteryPayment[]>([]);
  const [draws, setDraws] = useState<LotteryDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number[]>([]);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [justBought, setJustBought] = useState<BuyResult | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !session) return;
    const [b, p, d] = await Promise.all([
      supabase.rpc("lottery_board"),
      supabase.from("lottery_payments").select("*").eq("member_id", session.user.id).order("created_at", { ascending: false }),
      supabase.from("lottery_draws").select("*").order("draw_month", { ascending: false }).limit(12),
    ]);
    setBoard((b.data as Cell[]) ?? []);
    setPayments((p.data as LotteryPayment[]) ?? []);
    setDraws((d.data as LotteryDraw[]) ?? []);
    setLoading(false);
  }, [session]);

  // Coming back from TrueLayer (it adds ?payment_id=…): check the payment with the server, then refresh.
  useEffect(() => {
    const truelayerPaymentId = searchParams.get("payment_id");
    if (!truelayerPaymentId) { load(); return; }
    const done = () => { setSearchParams({}, { replace: true }); load(); };
    if (searchParams.get("error")) {
      toast("The bank payment wasn't completed. Your numbers are held, so you can pay by bank transfer below, or cancel to release them.");
      done();
      return;
    }
    callApi<{ status: string }>("/api/lottery-checkout", { action: "confirm", truelayerPaymentId })
      .then(({ status }) =>
        status === "paid" ? toast.success("Payment received. Good luck in the draw!")
          : status === "failed" ? toast("The bank payment didn't go through. Your numbers are held, so you can pay by bank transfer below, or cancel to release them.")
          : toast("Thanks! Your bank is processing the payment. Your numbers will be confirmed shortly."))
      .catch(() => toast("We'll confirm your payment shortly."))
      .finally(done);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (n: number) =>
    setSelected((s) => s.includes(n) ? s.filter((x) => x !== n)
      : s.length >= HUNDRED_CLUB.maxPerPurchase ? (toast(`Up to ${HUNDRED_CLUB.maxPerPurchase} numbers at a time.`), s)
      : [...s, n].sort((a, b) => a - b));

  const buy = async () => {
    setBusy(true);
    try {
      const result = await callApi<BuyResult>("/api/lottery-checkout", { action: "buy", numbers: selected, ageConfirmed });
      if (result.payUrl) { window.location.href = result.payUrl; return; }
      setJustBought(result);
      setSelected([]);
      await load();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error((err as Error).message);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (p: LotteryPayment) => {
    const nums = p.numbers.join(", ");
    if (!window.confirm(
      `Cancel and release number${p.numbers.length > 1 ? "s" : ""} ${nums}?\n\n` +
      "Only do this if you haven't sent a bank transfer for them. Anyone else will then be able to pick them.",
    )) return;
    setCancelling(p.id);
    try {
      await callApi("/api/lottery-checkout", { action: "cancel", paymentId: p.id });
      toast.success(`Cancelled. Number${p.numbers.length > 1 ? "s" : ""} ${nums} released.`);
      if (justBought?.paymentId === p.id) setJustBought(null);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setCancelling(null);
      await load();
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const mine = board.filter((c) => c.state === "mine");
  const pending = payments.filter((p) => p.status === "pending");
  const soon = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const total = selected.length * HUNDRED_CLUB.pricePerNumberPence;
  const myWins = draws.flatMap((d) => [
    d.first_holder_id === session?.user.id ? { d, n: d.first_number, prize: d.first_prize_pence } : null,
    d.second_holder_id === session?.user.id ? { d, n: d.second_number, prize: d.second_prize_pence } : null,
  ]).filter(Boolean) as { d: LotteryDraw; n: number; prize: number }[];

  return (
    <div className="space-y-12">
      <section className="max-w-3xl">
        <h2 className="text-2xl font-bold mb-2">The 100 Club</h2>
        <p className="text-muted-foreground">
          Pick a number from 1 to {HUNDRED_CLUB.totalNumbers} for {formatPence(HUNDRED_CLUB.pricePerNumberPence)} a year.
          Every month we draw two winners: <strong className="text-foreground">{formatPence(FIRST_PRIZE)}</strong> for first
          and <strong className="text-foreground">{formatPence(SECOND_PRIZE)}</strong> for second. The rest goes to the club.
        </p>
      </section>

      {justBought && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5" /> Now send the payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              We're holding number{justBought.numbers.length > 1 ? "s" : ""} <strong>{justBought.numbers.join(", ")}</strong> for
              you for {HUNDRED_CLUB.reserveDays} days. Pay by bank transfer using <strong>exactly this reference</strong>, so we
              know it's from you:
            </p>
            <TransferDetails reference={justBought.reference} amountPence={justBought.amountPence} />
            <p className="text-sm text-muted-foreground">
              Your numbers are entered into the draws as soon as the committee sees the payment arrive.
            </p>
          </CardContent>
        </Card>
      )}

      {/* My numbers */}
      <section>
        <h3 className="text-xl font-bold mb-4">My numbers</h3>
        {mine.length === 0 && pending.length === 0 ? (
          <p className="text-muted-foreground">You don't have any numbers yet. Pick one below.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {mine.map((c) => {
              const lapsed = !!c.paid_until && c.paid_until < today;
              const expiring = !!c.paid_until && c.paid_until <= soon;
              return (
                <Card key={c.number} className="w-[calc(50%-0.375rem)] sm:w-44">
                  <CardContent className="p-4">
                    <div className="text-3xl font-bold text-primary">{c.number}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {lapsed ? `Expired ${formatDate(c.paid_until!)}` : `In the draw until ${formatDate(c.paid_until!)}`}
                    </div>
                    {expiring && (
                      <Button size="sm" variant={lapsed ? "default" : "outline"} className="mt-3 w-full"
                              onClick={() => !selected.includes(c.number) && toggle(c.number)}>
                        {selected.includes(c.number) ? "Added below" : "Renew for a year"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {pending.map((p) => (
          <Card key={p.id} className="mt-4 border-amber-300">
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Awaiting payment</Badge>
                <span className="text-sm">Number{p.numbers.length > 1 ? "s" : ""} {p.numbers.join(", ")} · ordered {formatDate(p.created_at)}</span>
              </div>
              {justBought?.paymentId !== p.id && <TransferDetails reference={p.reference} amountPence={p.amount_pence} />}
              <Button variant="outline" size="sm" disabled={cancelling === p.id} onClick={() => cancel(p)}>
                {cancelling === p.id ? <Loader2 className="animate-spin" /> : <X />}
                Cancel and release {p.numbers.length > 1 ? "these numbers" : "this number"}
              </Button>
            </CardContent>
          </Card>
        ))}

        {myWins.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold mb-2 flex items-center gap-2"><Trophy className="h-4 w-4 text-primary" /> Your wins</h4>
            <ul className="text-sm space-y-1">
              {myWins.map(({ d, n, prize }) => (
                <li key={`${d.id}-${n}`}>
                  {monthName(d.draw_month)}: number {n} won {formatPence(prize)}
                  {d.prizes_paid_at ? " · paid" : " · we'll be in touch to pay you"}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Number board */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <h3 className="text-xl font-bold">Choose your numbers</h3>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded border border-border bg-background" /> Available</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-primary" /> Yours</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-100 border border-amber-300" /> Yours, awaiting payment</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-muted" /> Taken</span>
          </div>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 max-w-2xl">
          {board.map((c) => {
            const isSelected = selected.includes(c.number);
            const selectable = c.state === "available" || c.state === "mine";
            return (
              <button key={c.number} disabled={!selectable} onClick={() => toggle(c.number)} aria-pressed={isSelected}
                      aria-label={`Number ${c.number}, ${c.state.replace("_", " ")}`}
                      className={`aspect-square rounded-md border text-sm font-semibold transition-colors ${
                        isSelected ? "ring-2 ring-offset-1 ring-primary bg-primary/15 text-primary border-primary" : cellStyles[c.state]}`}>
                {c.number}
              </button>
            );
          })}
        </div>

        <Card className="mt-6 max-w-2xl">
          <CardContent className="p-5 space-y-4">
            {selected.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tap the numbers you'd like. Tap one of your own to renew it.</p>
            ) : (
              <p>
                <strong>{selected.join(", ")}</strong>: {selected.length} × {formatPence(HUNDRED_CLUB.pricePerNumberPence)} ={" "}
                <strong>{formatPence(total)}</strong> for a year of draws
              </p>
            )}
            <div className="flex items-start gap-2">
              <Checkbox id="age" checked={ageConfirmed} onCheckedChange={(v) => setAgeConfirmed(v === true)} />
              <Label htmlFor="age" className="text-sm font-normal leading-snug">
                I'm {HUNDRED_CLUB.minimumAge} or over and I've read the rules below.
              </Label>
            </div>
            <Button disabled={!selected.length || !ageConfirmed || busy} onClick={buy}>
              {busy && <Loader2 className="animate-spin" />} Pay {selected.length ? formatPence(total) : ""} by bank
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Results */}
      <section>
        <h3 className="text-xl font-bold mb-4">Recent winners</h3>
        {draws.length === 0 ? (
          <p className="text-muted-foreground">No draws yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {draws.map((d) => (
              <Card key={d.id}>
                <CardContent className="p-4 text-sm space-y-1">
                  <div className="font-semibold mb-2">{monthName(d.draw_month)}</div>
                  <div>🥇 No. {d.first_number}: {d.first_winner_name} · {formatPence(d.first_prize_pence)}</div>
                  <div>🥈 No. {d.second_number}: {d.second_winner_name} · {formatPence(d.second_prize_pence)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Rules */}
      <section className="max-w-3xl text-sm text-muted-foreground space-y-2">
        <h3 className="text-base font-semibold text-foreground">Rules</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Each number costs {formatPence(HUNDRED_CLUB.pricePerNumberPence)} and is in every monthly draw for 12 months from the day your payment is confirmed.</li>
          <li>Two numbers are drawn at random each month from the numbers that are paid up on the day: 1st prize {formatPence(FIRST_PRIZE)}, 2nd prize {formatPence(SECOND_PRIZE)}. A number can only win once per draw.</li>
          <li>You can buy up to {HUNDRED_CLUB.maxPerPurchase} numbers at a time. When your year ends you have {HUNDRED_CLUB.renewalGraceDays} days to renew before your number is offered to someone else.</li>
          <li>Players must be {HUNDRED_CLUB.minimumAge} or over. Proceeds support Kingston Bagpuize Cricket Club.</li>
          <li>Promoter: {HUNDRED_CLUB.promoter}. Registered with {HUNDRED_CLUB.licensingAuthority}, registration {HUNDRED_CLUB.licenceNumber}.</li>
        </ul>
      </section>
    </div>
  );
};

export default HundredClub;
