import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Loader2, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { CLUB_EMAIL, CURRENT_SEASON } from "@/config/club";
import {
  ageGroupFor, formatDate, formatPence, paidMembershipChildIds, type Child, type Order, type Profile,
} from "@/lib/members";

type Row = { child: Child; group: string | null; parent: Profile | undefined; paid: boolean };

const MembersAdmin = () => {
  const { profile } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [parents, setParents] = useState<Profile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unpaid" | "paid">("unpaid");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!supabase || !profile?.is_admin) return;
    Promise.all([
      supabase.from("children").select("*").order("last_name"),
      supabase.from("profiles").select("*"),
      supabase.from("orders").select("*, order_items(*)").eq("status", "paid").order("paid_at", { ascending: false }),
    ]).then(([c, p, o]) => {
      setChildren((c.data as Child[]) ?? []);
      setParents((p.data as Profile[]) ?? []);
      setOrders((o.data as Order[]) ?? []);
      setLoading(false);
    });
  }, [profile?.is_admin]);

  const rows: Row[] = useMemo(() => {
    const paidIds = paidMembershipChildIds(orders);
    const parentMap = new Map(parents.map((p) => [p.id, p]));
    return children
      .map((child) => ({ child, group: ageGroupFor(child.date_of_birth), parent: parentMap.get(child.parent_id), paid: paidIds.has(child.id) }))
      .filter((r) => r.group !== null); // juniors only
  }, [children, parents, orders]);

  if (!profile?.is_admin) {
    return <p className="text-muted-foreground">This page is for committee members only.</p>;
  }
  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const q = search.trim().toLowerCase();
  const visible = rows.filter((r) => {
    if (filter === "paid" && !r.paid) return false;
    if (filter === "unpaid" && r.paid) return false;
    if (!q) return true;
    return [r.child.first_name, r.child.last_name, r.parent?.full_name, r.parent?.email, r.group]
      .some((v) => v?.toLowerCase().includes(q));
  });

  const unpaidRows = rows.filter((r) => !r.paid);
  const unpaidEmails = [...new Set(unpaidRows.map((r) => r.parent?.email).filter(Boolean))] as string[];

  const seasonItems = orders.flatMap((o) => o.order_items);
  const subsCollected = seasonItems
    .filter((i) => i.category === "membership" && i.season === CURRENT_SEASON)
    .reduce((s, i) => s + i.unit_price_pence * i.quantity, 0);
  const seasonStart = new Date(Number(CURRENT_SEASON) - 1, 8, 1);
  const kitSales = orders
    .filter((o) => o.paid_at && new Date(o.paid_at) >= seasonStart)
    .flatMap((o) => o.order_items)
    .filter((i) => i.category === "kit")
    .reduce((s, i) => s + i.unit_price_pence * i.quantity, 0);

  const emailUnpaid = () => {
    const subject = encodeURIComponent(`Kingston Bagpuize CC – ${CURRENT_SEASON} junior subs`);
    const body = encodeURIComponent(
      `Hi,\n\nOur records show ${CURRENT_SEASON} subs are still outstanding for your child. ` +
      `You can pay in a couple of minutes at ${window.location.origin}/members\n\nThank you!\nKingston Bagpuize CC`,
    );
    window.location.href = `mailto:${CLUB_EMAIL}?bcc=${unpaidEmails.join(",")}&subject=${subject}&body=${body}`;
  };

  const downloadCsv = () => {
    const header = ["Child", "Age group", "Date of birth", "Parent", "Email", "Phone", `${CURRENT_SEASON} subs`];
    const lines = rows.map((r) => [
      `${r.child.first_name} ${r.child.last_name}`, r.group ?? "", r.child.date_of_birth,
      r.parent?.full_name ?? "", r.parent?.email ?? "", r.parent?.phone ?? "", r.paid ? "Paid" : "Unpaid",
    ]);
    const csv = [header, ...lines].map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `kbcc-juniors-${CURRENT_SEASON}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label={`${CURRENT_SEASON} subs paid`} value={`${rows.length - unpaidRows.length} of ${rows.length}`} />
        <Stat label="Still to pay" value={String(unpaidRows.length)} tone={unpaidRows.length ? "warn" : undefined} />
        <Stat label="Subs collected" value={formatPence(subsCollected)} />
        <Stat label="Club item sales this season" value={formatPence(kitSales)} />
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-2xl font-bold">Juniors</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={downloadCsv}><Download /> Download CSV</Button>
            <Button onClick={emailUnpaid} disabled={unpaidEmails.length === 0}>
              <Mail /> Email unpaid parents ({unpaidEmails.length})
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <div className="inline-flex rounded-md border border-border p-1" role="group" aria-label="Filter by payment">
            {(["unpaid", "paid", "all"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
                      className={`px-3 py-1.5 text-sm rounded capitalize ${filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {f}
              </button>
            ))}
          </div>
          <Input className="max-w-xs" placeholder="Search name, email or age group" value={search}
                 onChange={(e) => setSearch(e.target.value)} aria-label="Search juniors" />
        </div>

        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Child</TableHead>
                  <TableHead>Age group</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">{CURRENT_SEASON} subs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {filter === "unpaid" && !q ? "Everyone has paid. 🎉" : "No juniors match."}
                  </TableCell></TableRow>
                ) : visible.map((r) => (
                  <TableRow key={r.child.id}>
                    <TableCell className="font-medium">{r.child.first_name} {r.child.last_name}</TableCell>
                    <TableCell>{r.group}</TableCell>
                    <TableCell>{r.parent?.full_name ?? "–"}</TableCell>
                    <TableCell className="text-sm">
                      <a href={`mailto:${r.parent?.email}`} className="text-primary hover:underline">{r.parent?.email}</a>
                      {r.parent?.phone && <div className="text-muted-foreground">{r.parent.phone}</div>}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.paid
                        ? <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>
                        : <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Unpaid</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
        <p className="text-sm text-muted-foreground mt-3">
          Only children registered in the members area appear here. Juniors who haven't been added by a parent won't show yet.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Recent payments</h2>
        {orders.length === 0 ? (
          <p className="text-muted-foreground">No payments yet.</p>
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {orders.slice(0, 20).map((o) => {
                const payer = parents.find((p) => p.id === o.parent_id);
                return (
                  <li key={o.id} className="p-4 flex flex-wrap justify-between gap-2 text-sm">
                    <div>
                      <p className="font-medium">{payer?.full_name ?? payer?.email} · {formatDate(o.paid_at ?? o.created_at)}</p>
                      <p className="text-muted-foreground">{o.order_items.map((i) => i.description).join("; ")}</p>
                    </div>
                    <span className="font-semibold">{formatPence(o.total_pence)}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
};

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className={`text-2xl font-bold ${tone === "warn" ? "text-amber-700" : "text-foreground"}`}>{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

export default MembersAdmin;
