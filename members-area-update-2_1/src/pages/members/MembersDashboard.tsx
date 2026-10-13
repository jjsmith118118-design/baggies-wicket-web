import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { CheckCircle2, ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { CURRENT_SEASON } from "@/config/club";
import {
  ageGroupFor, callApi, formatDate, formatPence, isJunior, paidMembershipChildIds, type Child, type Order,
} from "@/lib/members";

const statusStyles: Record<Order["status"], string> = {
  paid: "bg-green-100 text-green-800 hover:bg-green-100",
  pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  cancelled: "bg-muted text-muted-foreground hover:bg-muted",
  refunded: "bg-blue-100 text-blue-800 hover:bg-blue-100",
};
const statusLabel: Record<Order["status"], string> = {
  paid: "Paid", pending: "Not completed", cancelled: "Cancelled", refunded: "Refunded",
};

const MembersDashboard = () => {
  const { session, profile, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [children, setChildren] = useState<Child[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    if (!supabase || !session) return;
    const [kids, ords] = await Promise.all([
      supabase.from("children").select("*").eq("parent_id", session.user.id).order("date_of_birth", { ascending: false }),
      supabase.from("orders").select("*, order_items(*)").eq("parent_id", session.user.id).order("created_at", { ascending: false }),
    ]);
    setChildren((kids.data as Child[]) ?? []);
    setOrders((ords.data as Order[]) ?? []);
    setLoading(false);
  }, [session]);

  // Returning from Stripe: confirm the payment, then refresh.
  useEffect(() => {
    const sessionId = searchParams.get("paid");
    if (!sessionId) {
      load();
      return;
    }
    callApi<{ paid: boolean }>("/api/confirm-checkout", { sessionId })
      .then(({ paid }) => (paid ? toast.success("Payment received – thank you!") : toast("Payment is still processing.")))
      .catch(() => toast("We'll update your payment shortly."))
      .finally(() => {
        setSearchParams({}, { replace: true });
        load();
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const removeChild = async (child: Child) => {
    if (!supabase) return;
    if (!window.confirm(`Remove ${child.first_name} from your account? Past payments stay in your history.`)) return;
    const { error } = await supabase.from("children").delete().eq("id", child.id);
    if (error) toast.error(error.message);
    else load();
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const paidIds = paidMembershipChildIds(orders);
  const visibleOrders = orders.filter((o) => o.status !== "pending" && o.status !== "cancelled");

  return (
    <div className="space-y-12">
      {!profile?.full_name && <DetailsPrompt onSaved={refreshProfile} />}

      {/* Children & memberships */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Your family</h2>
          <Button variant="outline" onClick={() => setAddOpen(true)}>
            <Plus /> Add a family member
          </Button>
        </div>

        {children.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground mb-4">
                Add your children, and yourself if you play, to pay {CURRENT_SEASON} memberships.
              </p>
              <Button onClick={() => setAddOpen(true)}><Plus /> Add a family member</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => {
              const paid = paidIds.has(child.id);
              const group = ageGroupFor(child.date_of_birth);
              const junior = isJunior(group);
              return (
                <Card key={child.id} className={paid || !junior ? "" : "border-amber-300"}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg">{child.first_name} {child.last_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {junior ? `${group} in ${CURRENT_SEASON}` : "Adult"}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" aria-label={`Remove ${child.first_name}`} onClick={() => removeChild(child)}>
                        <Trash2 className="text-muted-foreground" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {paid ? (
                      <p className="flex items-center gap-2 text-green-700 font-medium">
                        <CheckCircle2 className="h-5 w-5" /> {CURRENT_SEASON} {junior ? "subs" : "membership"} paid
                      </p>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className={junior ? "text-amber-700 font-medium" : "text-muted-foreground"}>
                          {junior ? `${CURRENT_SEASON} subs due` : `No ${CURRENT_SEASON} membership`}
                        </span>
                        <Button asChild size="sm" variant={junior ? "default" : "outline"}>
                          <Link to={`/members/shop?child=${child.id}`}>{junior ? "Pay subs" : "Join"}</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Payment history */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Payment history</h2>
        {visibleOrders.length === 0 ? (
          <p className="text-muted-foreground">Nothing yet. Payments you make will appear here with a receipt.</p>
        ) : (
          <div className="space-y-3">
            {visibleOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{formatDate(order.paid_at ?? order.created_at)}</span>
                      <Badge className={statusStyles[order.status]}>{statusLabel[order.status]}</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{formatPence(order.total_pence)}</span>
                      {order.receipt_url && (
                        <a href={order.receipt_url} target="_blank" rel="noopener noreferrer"
                           className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                          Receipt <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {order.order_items.map((item) => (
                      <li key={item.id} className="flex justify-between gap-4">
                        <span>{item.quantity > 1 ? `${item.quantity} × ` : ""}{item.description}</span>
                        <span>{formatPence(item.unit_price_pence * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <AddChildDialog open={addOpen} onOpenChange={setAddOpen} onAdded={load} />
    </div>
  );
};

function DetailsPrompt({ onSaved }: { onSaved: () => Promise<void> }) {
  const { session } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !session) return;
    setSaving(true);
    const { error } = await supabase.from("profiles")
      .update({ full_name: fullName.trim(), phone: phone.trim() || null })
      .eq("id", session.user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else await onSaved();
  };

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle>Welcome! First, your details</CardTitle>
        <p className="text-sm text-muted-foreground">So the club knows who to contact about your children.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="grid sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="full_name">Your full name</Label>
            <Input id="full_name" required value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Mobile number</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          </div>
          <Button type="submit" disabled={saving}>{saving && <Loader2 className="animate-spin" />}Save details</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AddChildDialog({ open, onOpenChange, onAdded }: { open: boolean; onOpenChange: (o: boolean) => void; onAdded: () => void }) {
  const { session } = useAuth();
  const [form, setForm] = useState({ first_name: "", last_name: "", date_of_birth: "" });
  const [saving, setSaving] = useState(false);
  const group = form.date_of_birth ? ageGroupFor(form.date_of_birth) : null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !session) return;
    setSaving(true);
    const { error } = await supabase.from("children").insert({
      parent_id: session.user.id,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      date_of_birth: form.date_of_birth,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`${form.first_name} added`);
    setForm({ first_name: "", last_name: "", date_of_birth: "" });
    onOpenChange(false);
    onAdded();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a family member</DialogTitle>
          <DialogDescription>
            Add each child, and yourself or your partner if you're joining as an adult. Date of birth sets
            the age group.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob">Date of birth</Label>
            <Input id="dob" type="date" required value={form.date_of_birth} max={new Date().toISOString().slice(0, 10)}
                   onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            {form.date_of_birth && (
              <p className="text-sm text-muted-foreground">
                {group && isJunior(group) ? `Plays ${group} in the ${CURRENT_SEASON} season.` : "Adult member."}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="animate-spin" />}Add to family</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default MembersDashboard;
