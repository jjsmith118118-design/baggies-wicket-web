// Posts payment notifications to a Discord channel.
// Set DISCORD_WEBHOOK_URL in Vercel to switch it on (leave it unset to switch off).
// Children's names are never posted. Full details are in the committee view.
import type { SupabaseClient } from "@supabase/supabase-js";

const MAROON = 0x6b0f35;
const GREY = 0x6b7280;

const gbp = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);

export async function notifyDiscord(supabase: SupabaseClient, orderId: string, kind: "paid" | "refunded") {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;

  try {
    const { data: order } = await supabase
      .from("orders")
      .select("total_pence, parent_id, order_items(category, quantity, unit_price_pence, full_price_pence, products(name))")
      .eq("id", orderId)
      .single();
    if (!order) return;

    const { data: payer } = await supabase.from("profiles").select("full_name").eq("id", order.parent_id).maybeSingle();
    const parts = (payer?.full_name ?? "").trim().split(/\s+/).filter(Boolean);
    const payerName = parts.length ? `${parts[0]}${parts.length > 1 ? ` ${parts[parts.length - 1][0]}.` : ""}` : "A member";

    // Group items by product name, e.g. "Junior Membership 2027 × 2".
    type Item = { quantity: number; unit_price_pence: number; full_price_pence: number | null; products: { name: string } | { name: string }[] | null };
    const counts = new Map<string, number>();
    let discount = 0;
    for (const i of (order.order_items ?? []) as Item[]) {
      const product = Array.isArray(i.products) ? i.products[0] : i.products;
      const name = product?.name ?? "Item";
      counts.set(name, (counts.get(name) ?? 0) + i.quantity);
      if (i.full_price_pence) discount += (i.full_price_pence - i.unit_price_pence) * i.quantity;
    }
    const items = [...counts].map(([name, n]) => (n > 1 ? `${name} × ${n}` : name)).join("\n");

    const test = (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test") ? "[TEST] " : "";
    const embed =
      kind === "paid"
        ? {
            title: `${test}💷 New payment: ${gbp(order.total_pence)}`,
            description: items,
            color: MAROON,
            fields: [
              { name: "Paid by", value: payerName, inline: true },
              ...(discount > 0 ? [{ name: "Discounts given", value: gbp(discount), inline: true }] : []),
            ],
            timestamp: new Date().toISOString(),
          }
        : {
            title: `${test}↩️ Refund: ${gbp(order.total_pence)}`,
            description: items,
            color: GREY,
            fields: [{ name: "Refunded to", value: payerName, inline: true }],
            timestamp: new Date().toISOString(),
          };

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "KBCC Payments", embeds: [embed] }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    // A Discord problem must never affect a payment.
    console.error("Discord notification failed", err);
  }
}
