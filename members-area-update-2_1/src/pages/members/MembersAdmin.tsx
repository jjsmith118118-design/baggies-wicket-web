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
  ageGroupFor, formatDate, formatPence, isJunior, paidMembershipChildIds, type Child, type Order, type Profile,
} from "@/lib/members";

type Row = { child: Child; group: string; parent: Profile | undefined; paid: boolean };

const MembersAdmin = () => {
  const { profile } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [parents, setParents] = useState<Profile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unpaid" | "paid">("unpaid");
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<"juniors" | "adults">("juniors");

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
      .filter((r) => (segment === "juniors" ? isJunior(r.group) : !isJunior(r.group)));
  }, [children, parents, orders, segment]);

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
  const rowIds = new Set(rows.map((r) => r.child.id));
  const subsCollected = seasonItems
    .filter((i) => i.category === "membership" && i.season === CURRENT_SEASON && i.child_id && rowIds.has(i.child_id))
    .reduce((s, i) => s + i.unit_price_pence * i.quantity, 0);
  const siblingSavings = seasonItems
    .filter((i) => i.category === "membership" && i.season === CURRENT_SEASON && i.full_price_pence && i.child_id && rowIds.has(i.child_id))
    .reduce((s, i) => s + ((i.full_price_pence ?? 0) - i.unit_price_pence) * i.quantity, 0);
  const label = segment === "juniors" ? "Juniors" : "Adults";
  const seasonStart = new Date(Number(CURRENT_SEASON) - 1, 8, 1);
  const kitSales = orders
    .filter((o) => o.paid_at && new Date(o.paid_at) >= seasonStart)
    .flatMap((o) => o.order_items)
    .filter((i) => i.category === "kit")
    .reduce((s, i) => s + i.unit_price_pence * i.quantity, 0);

  const emailUnpaid = () => {
    const subject = encodeURIComponent(`Kingston Bagpuize CC – ${CURRENT_SEASON} junior subs`);
    const body = encodeURIComponent(
      (segment === "juniors"
        ? `Hi,\n\nOur records show ${CURRENT_SEASON} subs are still outstanding for your child. `
        : `Hi,\n\nA reminder that ${CURRENT_SEASON} adult memberships are now open. `) +
      `You can pay in a couple of minutes at ${window.location.origin}/members\n\nThank you!\nKingston Bagpuize CC`,
    );
    window.location.href = `mailto:${CLUB_EMAIL}?bcc=${unpaidEmails.join(",")}&subject=${subject}&body=${body}`;
  };

  const downloadCsv = () => {
    const header = ["Name", "Age group", "Date of birth", "Account holder", "Email", "Phone", `${CURRENT_SEASON} membership`];
    const lines = rows.map((r) => [
      `${r.child.first_name} ${r.child.last_name}`, r.group ?? "", r.child.date_of_birth,
      r.parent?.full_name ?? "", r.parent?.email ?? "", r.parent?.phone ?? "", r.paid ? "Paid" : "Unpaid",
    ]);
    const csv = [header, ...lines].map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `kbcc-${segment}-${CURRENT_SEASON}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      <div className="inline-flex rounded-md border border-border p-1" role="group" aria-label="Members to show">
        {(["juniors", "adults"] as const).map((seg) => (
          <button key={seg} onClick={() => setSegment(seg)} aria-pressed={segment === seg}
                  className={`px-4 py-2 text-sm font-medium rounded capitalize ${segment === seg ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {seg}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label={`${CURRENT_SEASON} memberships paid`} value={`${rows.length - unpaidRows.length} of ${rows.length}`} />
        <Stat label={segment === "juniors" ? "Still to pay" : "Not yet joined"} value={String(unpaidRows.length)}
              tone={unpaidRows.length && segment === "juniors" ? "warn" : undefined} />
        <Stat label={`${label} memberships collected`} value={formatPence(subsCollected)}
              sub={siblingSavings > 0 ? `after ${formatPence(siblingSavings)} sibling discounts` : undefined} />
        <Stat label="Club item sales this season" value={formatPence(kitSales)} />
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-2xl font-bold">{label}</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={downloadCsv}><Download /> Download CSV</Button>
            <Button onClick={emailUnpaid} disabled={unpaidEmails.length === 0}>
              <Mail /> {segment === "juniors" ? "Email unpaid parents" : "Email adults not yet joined"} ({unpaidEmails.length})
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
                 onChange={(e) => setSearch(e.target.value)} aria-label="Search members" />
        </div>

        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Age group</TableHead>
                  <TableHead>Account holder</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">{CURRENT_SEASON} membership</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {filter === "unpaid" && !q ? "Everyone has paid. 🎉" : `No ${segment} match.`}
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
          Only people registered in the members area appear here. Anyone who hasn't been added to an account won't show yet.
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

function Stat({ label, value, tone, sub }: { label: string; value: string; tone?: "warn"; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className={`text-2xl font-bold ${tone === "warn" ? "text-amber-700" : "text-foreground"}`}>{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default MembersAdmin;
