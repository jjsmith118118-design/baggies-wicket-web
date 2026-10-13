// Works out the price of a basket ON THE SERVER, including sibling
// discounts. The browser only ever sends product ids; it never decides prices.
import type { SupabaseClient } from "@supabase/supabase-js";
import { ADULT, ageGroupFor, hasSiblingRates, membershipFits, ordinal, siblingPrice } from "./rules.js";

export type BasketItem = { productId: string; childId?: string | null; size?: string | null; quantity?: number };

export type PricedLine = {
  product_id: string;
  child_id: string | null;
  description: string;
  category: string;
  season: string | null;
  size: string | null;
  quantity: number;
  unit_price_pence: number; // what's actually charged
  full_price_pence: number; // before any sibling discount
  sibling_position: number | null; // 1 = first child, 2 = second... (junior memberships only)
  note: string | null; // e.g. "2nd child rate"
};

export class PricingError extends Error {}

export async function priceBasket(supabase: SupabaseClient, userId: string, items: BasketItem[]) {
  if (!Array.isArray(items) || items.length === 0) throw new PricingError("Your basket is empty.");
  if (items.length > 30) throw new PricingError("Too many items in one basket.");

  const productIds = [...new Set(items.map((i) => i.productId))];
  const [{ data: products, error: pErr }, { data: members, error: cErr }] = await Promise.all([
    supabase.from("products").select("*").in("id", productIds).eq("active", true),
    supabase.from("children").select("id, first_name, last_name, date_of_birth").eq("parent_id", userId),
  ]);
  if (pErr) throw pErr;
  if (cErr) throw cErr;

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const memberMap = new Map((members ?? []).map((m) => [m.id, m]));

  // Memberships this family has already PAID for, by season.
  const { data: paidItems, error: paidErr } = await supabase
    .from("order_items")
    .select("child_id, season, sibling_position, orders!inner(parent_id, status)")
    .eq("orders.parent_id", userId)
    .eq("orders.status", "paid")
    .eq("category", "membership");
  if (paidErr) throw paidErr;

  const alreadyMember = new Set((paidItems ?? []).map((i) => `${i.child_id}:${i.season}`));
  const siblingsPaid = new Map<string, number>(); // season -> count of discount-counted memberships
  for (const i of paidItems ?? []) {
    if (i.sibling_position !== null) siblingsPaid.set(i.season, (siblingsPaid.get(i.season) ?? 0) + 1);
  }

  const lines: PricedLine[] = [];
  const seenMemberships = new Set<string>();

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) throw new PricingError("One of the items is no longer available. Please refresh the page.");

    const member = item.childId ? memberMap.get(item.childId) : null;
    if (item.childId && !member) throw new PricingError("That person isn't on your account.");

    const quantity = product.category === "membership" ? 1 : Math.floor(Number(item.quantity ?? 1));
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 10) throw new PricingError("Quantity must be between 1 and 10.");

    if (product.sizes?.length && (!item.size || !product.sizes.includes(item.size))) {
      throw new PricingError(`Please choose a size for ${product.name}.`);
    }

    if (product.category === "membership") {
      if (!member) throw new PricingError("Memberships must be for someone on your account.");
      const group = ageGroupFor(member.date_of_birth, product.season ?? undefined);
      if (!membershipFits(product.age_group, group)) {
        throw new PricingError(`${product.name} isn't available for ${member.first_name} (${group}).`);
      }
      const key = `${member.id}:${product.season}`;
      if (seenMemberships.has(key)) throw new PricingError(`${member.first_name} can only have one membership per season.`);
      if (alreadyMember.has(key)) throw new PricingError(`${member.first_name}'s ${product.season} membership is already paid.`);
      seenMemberships.add(key);
    }

    const name = member ? `${member.first_name} ${member.last_name}` : null;
    lines.push({
      product_id: product.id,
      child_id: member?.id ?? null,
      description: [product.name, item.size ? `(${item.size})` : null, name ? `for ${name}` : null].filter(Boolean).join(" "),
      category: product.category,
      season: product.season,
      size: item.size ?? null,
      quantity,
      unit_price_pence: product.price_pence,
      full_price_pence: product.price_pence,
      sibling_position: null,
      note: null,
    });
  }

  // Sibling discounts: junior memberships on products with sibling rates.
  // Within each season, the most expensive membership is charged first at
  // full price (unless a child is already paid for), then 2nd, 3rd... rates.
  const seasons = new Set(lines.filter((l) => l.category === "membership").map((l) => l.season));
  for (const season of seasons) {
    const eligible = lines.filter((l) => {
      if (l.category !== "membership" || l.season !== season) return false;
      const product = productMap.get(l.product_id)!;
      return product.age_group !== ADULT && hasSiblingRates(product);
    });
    eligible.sort((a, b) => b.full_price_pence - a.full_price_pence);
    let position = siblingsPaid.get(season ?? "") ?? 0;
    for (const line of eligible) {
      position += 1;
      const product = productMap.get(line.product_id)!;
      line.sibling_position = position;
      line.unit_price_pence = siblingPrice(product, position);
      if (position > 1 && line.unit_price_pence < line.full_price_pence) {
        line.note = `${ordinal(position)} child rate`;
        line.description += ` (${line.note})`;
      }
    }
  }

  const total = lines.reduce((sum, l) => sum + l.unit_price_pence * l.quantity, 0);
  return { lines, total };
}
