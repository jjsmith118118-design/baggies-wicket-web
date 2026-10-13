import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, ExternalLink, Loader2, ShoppingBasket, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { CURRENT_SEASON, KIT_STORE_URL } from "@/config/club";
import {
  ageGroupFor, callApi, formatPence, paidMembershipChildIds, type Child, type Order, type Product,
} from "@/lib/members";

type BasketLine = { key: string; product: Product; child: Child | null; size: string | null; quantity: number };

const NO_CHILD = "none";

const MembersShop = () => {
  const { session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [basket, setBasket] = useState<BasketLine[]>([]);
  const [paying, setPaying] = useState(false);
  const highlightChild = searchParams.get("child");

  useEffect(() => {
    if (searchParams.get("cancelled")) {
      toast("Payment cancelled – nothing was charged.");
      setSearchParams({}, { replace: true });
    }
    if (!supabase || !session) return;
    Promise.all([
      supabase.from("products").select("*").eq("active", true).order("sort_order"),
      supabase.from("children").select("*").eq("parent_id", session.user.id).order("date_of_birth", { ascending: false }),
      supabase.from("orders").select("*, order_items(*)").eq("parent_id", session.user.id).eq("status", "paid"),
    ]).then(([p, c, o]) => {
      setProducts((p.data as Product[]) ?? []);
      setChildren((c.data as Child[]) ?? []);
      setPaidIds(paidMembershipChildIds((o.data as Order[]) ?? []));
      setLoading(false);
    });
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  const memberships = products.filter((p) => p.category === "membership" && p.season === CURRENT_SEASON);
  const kit = products.filter((p) => p.category === "kit");
  const total = useMemo(() => basket.reduce((s, l) => s + l.product.price_pence * l.quantity, 0), [basket]);

  const membershipFor = (child: Child) => {
    const group = ageGroupFor(child.date_of_birth);
    return memberships.find((m) => m.age_group === group) ?? memberships.find((m) => !m.age_group) ?? null;
  };

  const addLine = (line: Omit<BasketLine, "key">) => {
    const key = `${line.product.id}:${line.child?.id ?? ""}:${line.size ?? ""}`;
    setBasket((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        if (line.product.category === "membership") return prev;
        return prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(10, l.quantity + line.quantity) } : l));
      }
      return [...prev, { ...line, key }];
    });
  };

  const checkout = async () => {
    setPaying(true);
    try {
      const { url } = await callApi<{ url: string }>("/api/create-checkout", {
        items: basket.map((l) => ({ productId: l.product.id, childId: l.child?.id ?? null, size: l.size, quantity: l.quantity })),
      });
      window.location.href = url;
    } catch (err) {
      toast.error((err as Error).message);
      setPaying(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className={`grid lg:grid-cols-[1fr_320px] gap-10 items-start ${basket.length ? "pb-20 lg:pb-0" : ""}`}>
      <div className="space-y-12">
        {/* Subs */}
        <section>
          <h2 className="text-2xl font-bold mb-1">{CURRENT_SEASON} subs</h2>
          <p className="text-muted-foreground mb-4">One membership per child, priced by age group.</p>

          {children.length === 0 ? (
            <Card><CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">Add your children first, then come back to pay their subs.</p>
              <Button asChild><Link to="/members">Go to my family</Link></Button>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {children.map((child) => {
                const product = membershipFor(child);
                const inBasket = basket.some((l) => l.child?.id === child.id && l.product.category === "membership");
                const paid = paidIds.has(child.id);
                return (
                  <Card key={child.id} className={highlightChild === child.id && !paid ? "ring-2 ring-primary" : ""}>
                    <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{child.first_name} {child.last_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product ? `${product.name} · ${formatPence(product.price_pence)}` : "No membership available for this age group – please contact the club."}
                        </p>
                      </div>
                      {paid ? (
                        <span className="flex items-center gap-2 text-green-700 font-medium"><CheckCircle2 className="h-5 w-5" /> Paid</span>
                      ) : product ? (
                        <Button variant={inBasket ? "outline" : "default"} disabled={inBasket}
                                onClick={() => addLine({ product, child, size: null, quantity: 1 })}>
                          {inBasket ? "In basket" : "Add to basket"}
                        </Button>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Club items */}
        {kit.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-1">Club items</h2>
            <p className="text-muted-foreground mb-4">Bought from the club and handed out at training.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {kit.map((product) => (
                <KitCard key={product.id} product={product} children={children} onAdd={addLine} />
              ))}
            </div>
          </section>
        )}

        <Card className="bg-muted/50">
          <CardContent className="py-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-semibold">Looking for playing whites or match kit?</p>
              <p className="text-sm text-muted-foreground">Full club kit is ordered directly from our supplier, Serious Sport.</p>
            </div>
            <Button asChild variant="outline">
              <a href={KIT_STORE_URL} target="_blank" rel="noopener noreferrer">Visit the kit store <ExternalLink /></a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Basket */}
      <aside className="lg:sticky lg:top-24">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg"><ShoppingBasket className="h-5 w-5" /> Basket</CardTitle>
          </CardHeader>
          <CardContent>
            {basket.length === 0 ? (
              <p className="text-sm text-muted-foreground">Your basket is empty.</p>
            ) : (
              <>
                <ul className="space-y-3 mb-4">
                  {basket.map((l) => (
                    <li key={l.key} className="flex justify-between gap-2 text-sm">
                      <div>
                        <p className="font-medium">{l.quantity > 1 && `${l.quantity} × `}{l.product.name}{l.size && ` (${l.size})`}</p>
                        {l.child && <p className="text-muted-foreground">for {l.child.first_name}</p>}
                      </div>
                      <div className="flex items-start gap-1">
                        <span>{formatPence(l.product.price_pence * l.quantity)}</span>
                        <button className="text-muted-foreground hover:text-foreground" aria-label={`Remove ${l.product.name}`}
                                onClick={() => setBasket((b) => b.filter((x) => x.key !== l.key))}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between font-semibold border-t border-border pt-3 mb-4">
                  <span>Total</span><span>{formatPence(total)}</span>
                </div>
                <Button className="w-full" size="lg" onClick={checkout} disabled={paying}>
                  {paying && <Loader2 className="animate-spin" />}Pay {formatPence(total)}
                </Button>
                <p className="text-xs text-muted-foreground mt-3 text-center">Secure card payment by Stripe. Apple Pay and Google Pay accepted.</p>
              </>
            )}
          </CardContent>
        </Card>
      </aside>

      {/* Mobile: keep the pay button in reach */}
      {basket.length > 0 && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-sm">
            {basket.length} {basket.length === 1 ? "item" : "items"} · <strong>{formatPence(total)}</strong>
          </span>
          <Button onClick={checkout} disabled={paying}>
            {paying && <Loader2 className="animate-spin" />}Pay {formatPence(total)}
          </Button>
        </div>
      )}
    </div>
  );
};

function KitCard({ product, children, onAdd }: {
  product: Product; children: Child[]; onAdd: (line: Omit<BasketLine, "key">) => void;
}) {
  const [size, setSize] = useState<string>("");
  const [childId, setChildId] = useState<string>(NO_CHILD);
  const needsSize = product.sizes.length > 0;

  return (
    <Card>
      <CardContent className="pt-5 space-y-3">
        <div className="flex justify-between gap-2">
          <div>
            <p className="font-semibold">{product.name}</p>
            {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}
          </div>
          <span className="font-semibold">{formatPence(product.price_pence)}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {needsSize && (
            <div className="space-y-1">
              <Label className="text-xs">Size</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger aria-label={`Size for ${product.name}`}><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>{product.sizes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {children.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs">For</Label>
              <Select value={childId} onValueChange={setChildId}>
                <SelectTrigger aria-label={`Who is ${product.name} for`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CHILD}>Not named</SelectItem>
                  {children.map((c) => <SelectItem key={c.id} value={c.id}>{c.first_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <Button variant="outline" className="w-full" disabled={needsSize && !size}
                onClick={() => {
                  onAdd({ product, child: children.find((c) => c.id === childId) ?? null, size: size || null, quantity: 1 });
                  toast.success(`${product.name} added to basket`);
                }}>
          {needsSize && !size ? "Choose a size" : "Add to basket"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default MembersShop;
