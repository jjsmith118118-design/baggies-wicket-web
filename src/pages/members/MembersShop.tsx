import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, ExternalLink, Loader2, ShoppingBasket, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { PlayUpLink } from "./PlayUpDialog";
import { EcbBookedNote, MarkEcbBooked } from "./EcbBooking";
import { useAuth } from "@/hooks/useAuth";
import { ADULT, CURRENT_SEASON, KIT_STORE_URL } from "@/config/club";
import {
  ageGroupFor, bookingElsewhere, callApi, isEcbBooked, canPlayUp, externalBookingFor, formatPence, isJunior, paidMembershipChildIds, type Child, type Order, type Product,
} from "@/lib/members";

type BasketLine = { key: string; product: Product; child: Child | null; size: string | null; quantity: number };
type Quote = { total: number; lines: { unit_price_pence: number; full_price_pence: number; note: string | null }[] };

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
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [soloPrices, setSoloPrices] = useState<Record<string, Quote["lines"][number]>>({});
  const [autoAdded, setAutoAdded] = useState(false);
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
  const adultMemberships = memberships.filter((m) => m.age_group === ADULT);
  const kit = products.filter((p) => p.category === "kit");
  const hasSiblingRates = memberships.some((m) => m.price_2nd_child_pence || m.price_3rd_child_pence);
  const familyRateNames = memberships.filter((m) => m.unlocks_family_rate).map((m) => m.name.replace(/ \d{4}$/, ""));

  const juniorMembershipFor = (group: string) =>
    memberships.find((m) => m.age_group === group) ?? memberships.find((m) => m.age_group === null) ?? null;
  // Children playing up out of an ECB group pay the standard junior sub.
  const juniorProductFor = (c: Child) => {
    const group = ageGroupFor(c.date_of_birth);
    return c.plays_up && externalBookingFor(group) ? memberships.find((m) => m.age_group === null) ?? null : juniorMembershipFor(group);
  };
  const reloadChildren = async () => {
    if (!supabase || !session) return;
    const { data } = await supabase.from("children").select("*").eq("parent_id", session.user.id).order("date_of_birth", { ascending: false });
    setChildren((data as Child[]) ?? []);
  };

  const adultMembers = children.filter((c) => !isJunior(ageGroupFor(c.date_of_birth)));
  const juniorMembers = children.filter((c) => isJunior(ageGroupFor(c.date_of_birth)));
  const payableKids = juniorMembers
    .filter((c) => !paidIds.has(c.id) && !bookingElsewhere(ageGroupFor(c.date_of_birth), c.plays_up))
    .map((c) => ({ child: c, product: juniorProductFor(c) }))
    .filter((x): x is { child: Child; product: Product } => x.product !== null);
  const kidsNotInBasket = payableKids.filter(
    (x) => !basket.some((l) => l.child?.id === x.child.id && l.product.category === "membership"),
  );
  const addAllKids = () => kidsNotInBasket.forEach((x) => addLine({ product: x.product, child: x.child, size: null, quantity: 1 }));

  // What each child would cost if paid on their own right now. This includes
  // discounts from memberships already paid this season (adult or sibling).
  const payableSignature = payableKids.map((x) => `${x.child.id}:${x.product.id}`).join(",");
  useEffect(() => {
    if (loading || payableKids.length === 0) return;
    Promise.all(
      payableKids.map((x) =>
        callApi<Quote>("/api/quote", { items: [{ productId: x.product.id, childId: x.child.id }] })
          .then((q) => [x.child.id, q.lines[0]] as const)
          .catch(() => null),
      ),
    ).then((results) => setSoloPrices(Object.fromEntries(results.filter((r) => r !== null) as [string, Quote["lines"][number]][])));
  }, [loading, payableSignature]); // eslint-disable-line react-hooks/exhaustive-deps

  // "Pay all children's subs" from the family page.
  useEffect(() => {
    if (loading || autoAdded || searchParams.get("all") !== "1") return;
    setAutoAdded(true);
    addAllKids();
    setSearchParams({}, { replace: true });
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ask the server to price the basket whenever it changes (sibling rates etc.).
  const basketItems = basket.map((l) => ({ productId: l.product.id, childId: l.child?.id ?? null, size: l.size, quantity: l.quantity }));
  const basketSignature = JSON.stringify(basketItems);
  useEffect(() => {
    if (basket.length === 0) {
      setQuote(null);
      setQuoteError(null);
      return;
    }
    let cancelled = false;
    setQuoting(true);
    callApi<Quote>("/api/quote", { items: basketItems })
      .then((q) => { if (!cancelled) { setQuote(q); setQuoteError(null); } })
      .catch((err) => { if (!cancelled) { setQuote(null); setQuoteError((err as Error).message); } })
      .finally(() => { if (!cancelled) setQuoting(false); });
    return () => { cancelled = true; };
  }, [basketSignature]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = quote?.total ?? basket.reduce((s, l) => s + l.product.price_pence * l.quantity, 0);
  const canPay = basket.length > 0 && !!quote && !quoting && !quoteError;

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

  const inBasketFor = (child: Child) => basket.some((l) => l.child?.id === child.id && l.product.category === "membership");

  const checkout = async () => {
    setPaying(true);
    try {
      const { url } = await callApi<{ url: string }>("/api/create-checkout", { items: basketItems });
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
        {/* Memberships */}
        <section>
          <h2 className="text-2xl font-bold mb-1">{CURRENT_SEASON} memberships</h2>
          <p className="text-muted-foreground mb-6">
            Junior subs are priced by age group.
            {hasSiblingRates && " Brothers and sisters get a reduced rate, applied automatically in your basket."}
            {hasSiblingRates && familyRateNames.length > 0 &&
              ` With an ${familyRateNames.join(" or ")}, your first child gets the reduced rate too.`}
          </p>

          {children.length === 0 ? (
            <Card><CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">Add your family first, then come back to pay memberships.</p>
              <Button asChild><Link to="/members">Go to my family</Link></Button>
            </CardContent></Card>
          ) : (
            <div className="space-y-8">
              {adultMembers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Adults</h3>
                  <div className="space-y-3">
                    {adultMembers.map((child) => (
                      <Card key={child.id} className={highlightChild === child.id && !paidIds.has(child.id) ? "ring-2 ring-primary" : ""}>
                        <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
                          <AdultRow child={child} options={adultMemberships} paid={paidIds.has(child.id)}
                                    inBasket={inBasketFor(child)} onAdd={addLine} />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {juniorMembers.length > 0 && (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <h3 className="text-lg font-semibold">Children</h3>
                    {kidsNotInBasket.length > 1 && (
                      <Button variant="outline" size="sm" onClick={addAllKids}>
                        Add all {kidsNotInBasket.length} to basket
                      </Button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {juniorMembers.map((child) => {
                      const group = ageGroupFor(child.date_of_birth);
                      return (
                        <Card key={child.id} className={highlightChild === child.id && !paidIds.has(child.id) ? "ring-2 ring-primary" : ""}>
                          <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
                            {bookingElsewhere(group, child.plays_up) ? (
                              <ExternalRow child={child} group={group} booking={bookingElsewhere(group, child.plays_up)!}
                                           onChanged={reloadChildren} />
                            ) : (
                            <JuniorRow child={child} group={child.plays_up && externalBookingFor(group) ? `${group} · playing up` : group}
                                       product={juniorProductFor(child)}
                                       paid={paidIds.has(child.id)} inBasket={inBasketFor(child)}
                                       solo={soloPrices[child.id]} onAdd={addLine} />
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  {payableKids.length > 1 && (
                    <p className="text-sm text-muted-foreground mt-3">
                      Prices shown are for paying each child on their own. Your basket shows the exact total.
                    </p>
                  )}
                </div>
              )}
              {adultMembers.length === 0 && adultMemberships.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Joining as an adult too? <Link to="/members" className="text-primary hover:underline">Add yourself</Link> on
                  the family page.
                </p>
              )}
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
                  {basket.map((l, i) => {
                    const q = quote?.lines[i];
                    const charged = (q?.unit_price_pence ?? l.product.price_pence) * l.quantity;
                    const discounted = q && q.unit_price_pence < q.full_price_pence;
                    return (
                    <li key={l.key} className="flex justify-between gap-2 text-sm">
                      <div>
                        <p className="font-medium">{l.quantity > 1 && `${l.quantity} × `}{l.product.name}{l.size && ` (${l.size})`}</p>
                        {l.child && <p className="text-muted-foreground">for {l.child.first_name}</p>}
                        {q?.note && <p className="text-green-700">{q.note}</p>}
                      </div>
                      <div className="flex items-start gap-1">
                        <span className="text-right">
                          {discounted && <s className="block text-muted-foreground">{formatPence(q.full_price_pence * l.quantity)}</s>}
                          {formatPence(charged)}
                        </span>
                        <button className="text-muted-foreground hover:text-foreground" aria-label={`Remove ${l.product.name}`}
                                onClick={() => setBasket((b) => b.filter((x) => x.key !== l.key))}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                    );
                  })}
                </ul>
                {quoteError && <p className="text-sm text-destructive mb-3">{quoteError}</p>}
                <div className="flex justify-between font-semibold border-t border-border pt-3 mb-4">
                  <span>Total</span><span>{formatPence(total)}</span>
                </div>
                <Button className="w-full" size="lg" onClick={checkout} disabled={paying || !canPay}>
                  {(paying || quoting) && <Loader2 className="animate-spin" />}Pay {formatPence(total)}
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
          <Button onClick={checkout} disabled={paying || !canPay}>
            {(paying || quoting) && <Loader2 className="animate-spin" />}Pay {formatPence(total)}
          </Button>
        </div>
      )}
    </div>
  );
};

function JuniorRow({ child, group, product, paid, inBasket, solo, onAdd }: {
  child: Child; group: string; product: Product | null; paid: boolean; inBasket: boolean;
  solo?: Quote["lines"][number]; onAdd: (line: Omit<BasketLine, "key">) => void;
}) {
  const discounted = solo && solo.unit_price_pence < solo.full_price_pence;
  return (
    <>
      <div>
        <p className="font-semibold">{child.first_name} {child.last_name} <span className="font-normal text-muted-foreground">· {group}</span></p>
        {!product ? (
          <p className="text-sm text-muted-foreground">No membership set up for this age group yet. Please contact the club.</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {product.name} ·{" "}
            {!paid && discounted ? (
              <>
                <s>{formatPence(solo.full_price_pence)}</s>{" "}
                <span className="text-foreground font-medium">{formatPence(solo.unit_price_pence)}</span>{" "}
                <span className="text-green-700">({solo.note})</span>
              </>
            ) : (
              formatPence(product.price_pence)
            )}
          </p>
        )}
      </div>
      {paid ? (
        <span className="flex items-center gap-2 text-green-700 font-medium"><CheckCircle2 className="h-5 w-5" /> Paid</span>
      ) : product ? (
        <Button variant={inBasket ? "outline" : "default"} disabled={inBasket}
                onClick={() => onAdd({ product, child, size: null, quantity: 1 })}>
          {inBasket ? "In basket" : "Add to basket"}
        </Button>
      ) : null}
    </>
  );
}

function ExternalRow({ child, group, booking, onChanged }: {
  child: Child; group: string; booking: { name: string; url: string }; onChanged: () => void;
}) {
  return (
    <>
      <div>
        <p className="font-semibold">{child.first_name} {child.last_name} <span className="font-normal text-muted-foreground">· {group}</span></p>
        {isEcbBooked(child) ? (
          <div className="mt-1"><EcbBookedNote child={child} onChanged={onChanged} /></div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{group} is booked and paid through {booking.name}, so there's nothing to pay here.</p>
            <div className="mt-1 flex flex-wrap gap-x-4">
              <MarkEcbBooked child={child} group={group} onChanged={onChanged} />
              {canPlayUp(group) && <PlayUpLink child={child} group={group} onChanged={onChanged} />}
            </div>
          </>
        )}
      </div>
      {!isEcbBooked(child) && (
        <Button asChild variant="outline">
          <a href={booking.url} target="_blank" rel="noopener noreferrer">Book {group} <ExternalLink /></a>
        </Button>
      )}
    </>
  );
}

function AdultRow({ child, options, paid, inBasket, onAdd }: {
  child: Child; options: Product[]; paid: boolean; inBasket: boolean;
  onAdd: (line: Omit<BasketLine, "key">) => void;
}) {
  const [choice, setChoice] = useState(options.length === 1 ? options[0].id : "");
  const product = options.find((o) => o.id === choice) ?? null;
  return (
    <>
      <div>
        <p className="font-semibold">{child.first_name} {child.last_name} <span className="font-normal text-muted-foreground">· Adult</span></p>
        {options.length === 0 && <p className="text-sm text-muted-foreground">No adult memberships set up yet.</p>}
      </div>
      {paid ? (
        <span className="flex items-center gap-2 text-green-700 font-medium"><CheckCircle2 className="h-5 w-5" /> Paid</span>
      ) : options.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
          <Select value={choice} onValueChange={setChoice} disabled={inBasket}>
            <SelectTrigger className="w-full sm:w-64" aria-label={`Membership type for ${child.first_name}`}>
              <SelectValue placeholder="Choose membership" />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.name.replace(/ \d{4}$/, "")} · {formatPence(o.price_pence)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant={inBasket ? "outline" : "default"} disabled={inBasket || !product}
                  onClick={() => product && onAdd({ product, child, size: null, quantity: 1 })}>
            {inBasket ? "In basket" : "Add to basket"}
          </Button>
        </div>
      )}
    </>
  );
}

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
