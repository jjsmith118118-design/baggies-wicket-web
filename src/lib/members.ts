import { CURRENT_SEASON } from "@/config/club";
import { supabase } from "@/lib/supabase";

export type Profile = { id: string; email: string; full_name: string | null; phone: string | null; is_admin: boolean };
export type Child = {
  id: string; parent_id: string; first_name: string; last_name: string; date_of_birth: string;
  plays_up?: boolean; ecb_booked_season?: string | null;
};

/** Has the parent said this child is booked with the ECB for the current season? */
export const isEcbBooked = (c: Child, season = CURRENT_SEASON) => c.ecb_booked_season === season;
export type Product = {
  id: string; name: string; description: string | null; category: "membership" | "kit";
  price_pence: number; price_2nd_child_pence: number | null; price_3rd_child_pence: number | null;
  unlocks_family_rate?: boolean;
  season: string | null; age_group: string | null; sizes: string[]; sort_order: number;
};
export type OrderItem = {
  id: string; order_id: string; child_id: string | null; description: string; category: string;
  season: string | null; size: string | null; quantity: number; unit_price_pence: number;
  full_price_pence: number | null; sibling_position: number | null;
};
export type Order = {
  id: string; parent_id: string; status: "pending" | "paid" | "cancelled" | "refunded"; total_pence: number;
  receipt_url: string | null; created_at: string; paid_at: string | null; order_items: OrderItem[];
};

export const formatPence = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export { ageGroupFor, bookingElsewhere, canPlayUp, externalBookingFor, isJunior, membershipFits } from "../../api/_lib/rules";

/** Child ids with a PAID membership for the given season. */
export function paidMembershipChildIds(orders: Order[], season = CURRENT_SEASON) {
  const ids = new Set<string>();
  for (const o of orders) {
    if (o.status !== "paid") continue;
    for (const i of o.order_items) {
      if (i.category === "membership" && i.season === season && i.child_id) ids.add(i.child_id);
    }
  }
  return ids;
}

/** Calls one of our /api endpoints with the parent's login token. */
export async function callApi<T>(path: string, body: unknown): Promise<T> {
  const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    },
    body: JSON.stringify(body),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error ?? "Something went wrong. Please try again.");
  return payload as T;
}
