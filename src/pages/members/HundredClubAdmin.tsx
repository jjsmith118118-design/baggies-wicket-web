import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dices, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { callApi, formatDate, formatPence, type Profile } from "@/lib/members";
import { HUNDRED_CLUB } from "../../../api/_lib/hundredClub";
import { monthName, type LotteryDraw, type LotteryPayment } from "./HundredClub";

type NumberRow = {
  number: number; holder_id: string | null; paid_until: string | null;
  reserved_by: string | null; reserved_until: string | null;
};

const thisMonth = () => new Date().toISOString().slice(0, 7);

const HundredClubAdmin = () => {
  const { profile } = useAuth();
  const [numbers, setNumbers] = useState<NumberRow[]>([]);
  const [payments, setPayments] = useState<LotteryPayment[]>([]);
  const [draws, setDraws] = useState<LotteryDraw[]>([]);
  const [people, setPeople] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [month, setMonth] = useState(thisMonth());
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    if (!supabase || !profile?.is_admin) return;
    const [n, p, d, pr] = await Promise.all([
      supabase.from("club_numbers").select("*").order("number"),
      supabase.from("lottery_payments").select("*").order("created_at", { ascending: false }),
      supabase.from("lottery_draws").select("*").order("draw_month", { ascending: false }),
      supabase.from("profiles").select("*"),
    ]);
    setNumbers((n.data as NumberRow[]) ?? []);
    setPayments((p.data as LotteryPayment[]) ?? []);
    setDraws((d.data as LotteryDraw[]) ?? []);
    setPeople((pr.data as Profile[]) ?? []);
    setLoading(false);
  }, [profile?.is_admin]);

  useEffect(() => { load(); }, [load]);

  const person = useMemo(() => {
    const map = new Map(people.map((p) => [p.id, p]));
    return (id: string | null) => (id ? map.get(id) : undefined);
  }, [people]);

  const act = async (key: string, body: Record<string, unknown>, success: string) => {
    setBusy(key);
    try {
      const res = await callApi<{ unassigned?: number[] }>("/api/lottery-admin", body);
      if (res.unassigned?.length) {
        toast.warning(`Marked paid, but number(s) ${res.unassigned.join(", ")} now belong to someone else. Please offer a swap or a refund.`, { duration: 15000 });
      } else toast.success(success);
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (!profile?.is_admin) return <p className="text-muted-foreground">Committee members only.</p>;
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const today = new Date().toISOString().slice(0, 10);
  const active = numbers.filter((n) => n.holder_id && n.paid_until && n.paid_until >= today);
  const pending = payments.filter((p) => p.status === "pending");
  const yearAgo = new Date(Date.now() - 365 * 864e5).toISOString();
  const takenLastYear = payments.filter((p) => p.status === "paid" && p.paid_at && p.paid_at >= yearAgo)
    .reduce((s, p) => s + p.amount_pence, 0);
  const prizesLastYear = draws.filter((d) => d.drawn_at >= yearAgo)
    .reduce((s, d) => s + d.first_prize_pence + d.second_prize_pence, 0);
  const monthDrawn = draws.some((d) => d.draw_month.slice(0, 7) === month);
  const unpaidPrizes = draws.filter((d) => !d.prizes_paid_at);

  const q = search.trim().toLowerCase();
  const holderRows = numbers.filter((n) => n.holder_id).filter((n) => {
    if (!q) return true;
    const p = person(n.holder_id);
    return String(n.number) === q || [p?.full_name, p?.email].some((v) => v?.toLowerCase().includes(q));
  });
  const pendingRows = pending.filter((p) => {
    if (!q) return true;
    const m = person(p.member_id);
    return [p.reference, m?.full_name, m?.email].some((v) => v?.toLowerCase().includes(q));
  });

  const downloadCsv = () => {
    const header = ["Number", "Holder", "Email", "Phone", "Paid until", "Status"];
    const lines = numbers.map((n) => {
      const p = person(n.holder_id);
      const status = !n.holder_id ? "Available" : n.paid_until && n.paid_until >= today ? "Active" : "Expired";
      return [n.number, p?.full_name ?? "", p?.email ?? "", p?.phone ?? "", n.paid_until ?? "", status];
    });
    const csv = [header, ...lines].map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    Object.assign(document.createElement("a"), { href: url, download: `kbcc-100-club-${today}.csv` }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["Numbers in the draw", `${active.length} / ${HUNDRED_CLUB.totalNumbers}`],
          ["Awaiting payment", String(pending.length)],
          ["Sales (last 12 months)", formatPence(takenLastYear)],
          ["Prizes (last 12 months)", formatPence(prizesLastYear)],
        ].map(([label, value]) => (
          <Card key={label}><CardContent className="p-4">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-2xl font-bold mt-1">{value}</div>
          </CardContent></Card>
        ))}
      </section>

      {/* Draw */}
      <section>
        <h2 className="text-2xl font-bold mb-2">Monthly draw</h2>
        <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
          Draws two different numbers at random from the {active.length} numbers paid up today
          (1st {formatPence(HUNDRED_CLUB.prizesPence[0])}, 2nd {formatPence(HUNDRED_CLUB.prizesPence[1])}).
          Each month can only be drawn once, and the full list of numbers in the draw is saved with the result.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-48" aria-label="Draw month" />
          <Button disabled={monthDrawn || busy === "draw" || active.length < 2}
                  onClick={() => window.confirm(`Run the ${monthName(`${month}-01`)} draw now? This can't be undone.`) &&
                    act("draw", { action: "draw", month }, "Draw complete")}>
            {busy === "draw" ? <Loader2 className="animate-spin" /> : <Dices />} {monthDrawn ? "Already drawn" : "Run the draw"}
          </Button>
        </div>
      </section>

      {/* Pending payments */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="text-2xl font-bold">Payments to check</h2>
            <p className="text-sm text-muted-foreground">
              Match the reference on the bank statement, then mark it paid. Pay-by-bank payments confirm themselves.
            </p>
          </div>
          <Input placeholder="Search name, email, reference or number" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:w-72" />
        </div>
        {pendingRows.length === 0 ? <p className="text-muted-foreground">Nothing waiting.</p> : (
          <div className="overflow-x-auto"><Table>
            <TableHeader><TableRow>
              <TableHead>Reference</TableHead><TableHead>Member</TableHead><TableHead>Numbers</TableHead>
              <TableHead>Amount</TableHead><TableHead>Ordered</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {pendingRows.map((p) => {
                const m = person(p.member_id);
                const expired = Date.now() - new Date(p.created_at).getTime() > HUNDRED_CLUB.reserveDays * 864e5;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono">{p.reference}</TableCell>
                    <TableCell>{m?.full_name ?? "—"}<div className="text-xs text-muted-foreground">{m?.email}</div></TableCell>
                    <TableCell>{p.numbers.join(", ")}</TableCell>
                    <TableCell>{formatPence(p.amount_pence)}</TableCell>
                    <TableCell>
                      {formatDate(p.created_at)}
                      {p.method === "truelayer" && <Badge variant="outline" className="ml-2">Pay by bank</Badge>}
                      {expired && <Badge variant="outline" className="ml-2">Hold expired</Badge>}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap space-x-2">
                      <Button size="sm" disabled={!!busy}
                              onClick={() => act(p.id, { action: "mark-paid", paymentId: p.id }, `${p.reference} marked paid`)}>
                        Mark paid
                      </Button>
                      <Button size="sm" variant="outline" disabled={!!busy}
                              onClick={() => window.confirm(`Cancel ${p.reference} and release its numbers?`) &&
                                act(p.id, { action: "cancel", paymentId: p.id }, "Cancelled")}>
                        Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        )}
      </section>

      {/* Draw history */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Draw results {unpaidPrizes.length > 0 && <Badge className="ml-2 align-middle">{unpaidPrizes.length} to pay out</Badge>}</h2>
        {draws.length === 0 ? <p className="text-muted-foreground">No draws yet.</p> : (
          <div className="overflow-x-auto"><Table>
            <TableHeader><TableRow>
              <TableHead>Month</TableHead><TableHead>1st</TableHead><TableHead>2nd</TableHead><TableHead>In the draw</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {draws.map((d) => {
                const w1 = person(d.first_holder_id), w2 = person(d.second_holder_id);
                return (
                  <TableRow key={d.id}>
                    <TableCell>{monthName(d.draw_month)}<div className="text-xs text-muted-foreground">drawn {formatDate(d.drawn_at)}</div></TableCell>
                    <TableCell>No. {d.first_number}: {w1?.full_name ?? d.first_winner_name}<div className="text-xs text-muted-foreground">{w1?.email} · {formatPence(d.first_prize_pence)}</div></TableCell>
                    <TableCell>No. {d.second_number}: {w2?.full_name ?? d.second_winner_name}<div className="text-xs text-muted-foreground">{w2?.email} · {formatPence(d.second_prize_pence)}</div></TableCell>
                    <TableCell title={d.eligible_numbers.join(", ")}>{d.eligible_numbers.length} numbers</TableCell>
                    <TableCell className="text-right">
                      {d.prizes_paid_at ? <span className="text-sm text-muted-foreground">Paid {formatDate(d.prizes_paid_at)}</span> : (
                        <Button size="sm" variant="outline" disabled={!!busy}
                                onClick={() => act(d.id, { action: "prizes-paid", drawId: d.id }, "Prizes marked paid")}>
                          Mark prizes paid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        )}
      </section>

      {/* Holders */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <h2 className="text-2xl font-bold">Number holders</h2>
          <Button variant="outline" onClick={downloadCsv}><Download /> Download CSV</Button>
        </div>
        {holderRows.length === 0 ? <p className="text-muted-foreground">No numbers sold yet.</p> : (
          <div className="overflow-x-auto"><Table>
            <TableHeader><TableRow>
              <TableHead>No.</TableHead><TableHead>Holder</TableHead><TableHead>Paid until</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {holderRows.map((n) => {
                const p = person(n.holder_id);
                const live = !!n.paid_until && n.paid_until >= today;
                return (
                  <TableRow key={n.number}>
                    <TableCell className="font-semibold">{n.number}</TableCell>
                    <TableCell>{p?.full_name ?? "—"}<div className="text-xs text-muted-foreground">{p?.email}</div></TableCell>
                    <TableCell>{n.paid_until ? formatDate(n.paid_until) : "—"}</TableCell>
                    <TableCell>
                      <Badge className={live ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-muted text-muted-foreground hover:bg-muted"}>
                        {live ? "In the draw" : "Expired"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table></div>
        )}
      </section>
    </div>
  );
};

export default HundredClubAdmin;
