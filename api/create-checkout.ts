// POST /api/create-checkout
// Body: { items: [{ productId, childId?, size?, quantity? }] }
// Validates everything against the database (never trusts browser prices),
// records a pending order, and returns a Stripe Checkout URL.
import { getStripe, getSupabaseAdmin, getUserFromRequest, json } from "./_lib/server.js";

type IncomingItem = { productId: string; childId?: string | null; size?: string | null; quantity?: number };

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return json({ error: "Please log in again." }, 401);

    const body = (await request.json().catch(() => null)) as { items?: IncomingItem[] } | null;
    const items = body?.items ?? [];
    if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
      return json({ error: "Your basket is empty." }, 400);
    }

    const supabase = getSupabaseAdmin();

    const productIds = [...new Set(items.map((i) => i.productId))];
    const { data: products, error: productError } = await supabase
      .from("products")
      .select("*")
      .in("id", productIds)
      .eq("active", true);
    if (productError) throw productError;

    const { data: children, error: childError } = await supabase
      .from("children")
      .select("id, first_name, last_name")
      .eq("parent_id", user.id);
    if (childError) throw childError;

    const productMap = new Map((products ?? []).map((p) => [p.id, p]));
    const childMap = new Map((children ?? []).map((c) => [c.id, c]));

    const lines: {
      product_id: string; child_id: string | null; description: string; category: string;
      season: string | null; size: string | null; quantity: number; unit_price_pence: number;
    }[] = [];
    const membershipKeys = new Set<string>();

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) return json({ error: "One of the items is no longer available. Please refresh." }, 400);

      const child = item.childId ? childMap.get(item.childId) : null;
      if (item.childId && !child) return json({ error: "That child isn't on your account." }, 400);

      const quantity = product.category === "membership" ? 1 : Math.floor(Number(item.quantity ?? 1));
      if (!Number.isFinite(quantity) || quantity < 1 || quantity > 10) {
        return json({ error: "Quantity must be between 1 and 10." }, 400);
      }

      if (product.sizes?.length) {
        if (!item.size || !product.sizes.includes(item.size)) {
          return json({ error: `Please choose a size for ${product.name}.` }, 400);
        }
      }

      if (product.category === "membership") {
        if (!child) return json({ error: "Memberships must be for a child on your account." }, 400);
        const key = `${child.id}:${product.season}`;
        if (membershipKeys.has(key)) return json({ error: "A child can only have one membership per season." }, 400);
        membershipKeys.add(key);

        // Already paid for this season?
        const { data: existing } = await supabase
          .from("order_items")
          .select("id, orders!inner(status)")
          .eq("child_id", child.id)
          .eq("category", "membership")
          .eq("season", product.season)
          .eq("orders.status", "paid")
          .limit(1);
        if (existing && existing.length > 0) {
          return json({ error: `${child.first_name}'s ${product.season} membership is already paid.` }, 400);
        }
      }

      const childName = child ? `${child.first_name} ${child.last_name}` : null;
      const description = [product.name, item.size ? `(${item.size})` : null, childName ? `for ${childName}` : null]
        .filter(Boolean)
        .join(" ");

      lines.push({
        product_id: product.id,
        child_id: child?.id ?? null,
        description,
        category: product.category,
        season: product.season,
        size: item.size ?? null,
        quantity,
        unit_price_pence: product.price_pence,
      });
    }

    const total = lines.reduce((sum, l) => sum + l.unit_price_pence * l.quantity, 0);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({ parent_id: user.id, total_pence: total, status: "pending" })
      .select()
      .single();
    if (orderError) throw orderError;

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(lines.map((l) => ({ ...l, order_id: order.id })));
    if (itemsError) throw itemsError;

    // Send people back to whichever site they came from (works on preview links too).
    const origin = request.headers.get("origin") ?? process.env.SITE_URL ?? new URL(request.url).origin;

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      client_reference_id: order.id,
      metadata: { order_id: order.id },
      payment_intent_data: { metadata: { order_id: order.id } },
      line_items: lines.map((l) => ({
        quantity: l.quantity,
        price_data: {
          currency: "gbp",
          unit_amount: l.unit_price_pence,
          product_data: { name: l.description },
        },
      })),
      success_url: `${origin}/members?paid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/members/shop?cancelled=1`,
    });

    await supabase.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);

    return json({ url: session.url });
  } catch (err) {
    console.error("create-checkout failed", err);
    return json({ error: "Couldn't start the payment. Please try again." }, 500);
  }
}
