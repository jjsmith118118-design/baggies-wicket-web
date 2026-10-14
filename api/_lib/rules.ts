// ============================================================
// CLUB RULES – shared by the website AND the payment server.
// Change these each season.
// ============================================================

export const CURRENT_SEASON = "2027";

// Junior age groups, youngest first. Each group covers children up to and
// including maxAge (their age on 31 August before the season). Anyone older
// than the last group counts as an adult. Rename or re-band these freely.
// Groups with "bookVia" are booked and paid OUTSIDE this site (e.g. through
// the ECB), so the members area won't take payment for them. Replace the URLs
// with your club's own ECB booking links if you have them.
// "canPlayUp": a parent can confirm (with a coach's agreement) that their
// child plays in an older age group, and then pay club membership instead.
export const AGE_GROUPS: { name: string; maxAge: number; bookVia?: { name: string; url: string }; canPlayUp?: boolean }[] = [
  { name: "All Stars", maxAge: 8, canPlayUp: true, bookVia: { name: "the ECB", url: "https://ecb.clubspark.uk/AllStars/kingstonbagpuize/Course/02a1eadf-1814-4f03-9f3e-b8d44174d066" } }, // ages 5–8
  { name: "Dynamos", maxAge: 11, canPlayUp: true, bookVia: { name: "the ECB", url: "https://www.ecb.co.uk/play/dynamoscricket" } }, // ages 9–11
  { name: "U13", maxAge: 12 },
  { name: "U15", maxAge: 14 },
  { name: "U18", maxAge: 17 },
  { name: "U20", maxAge: 19 },
];

export const ADULT = "Adult";

/**
 * Age group for a season, using the ECB rule (age at 31 August before
 * the season). e.g. for 2027, a child who is 10 on 31 Aug 2026 is in Dynamos.
 * Returns "Adult" for anyone older than the oldest junior group.
 */
export function ageGroupFor(dateOfBirth: string, season = CURRENT_SEASON): string {
  const cutoff = new Date(Number(season) - 1, 7, 31); // 31 August
  const dob = new Date(dateOfBirth);
  let age = cutoff.getFullYear() - dob.getFullYear();
  const hadBirthday =
    cutoff.getMonth() > dob.getMonth() || (cutoff.getMonth() === dob.getMonth() && cutoff.getDate() >= dob.getDate());
  if (!hadBirthday) age -= 1;
  return AGE_GROUPS.find((g) => age <= g.maxAge)?.name ?? ADULT;
}

export const isJunior = (group: string) => group !== ADULT;

/** If this age group is booked elsewhere (e.g. the ECB), where to send people. */
export const externalBookingFor = (group: string) => AGE_GROUPS.find((g) => g.name === group)?.bookVia ?? null;

/** Can children in this age group play up into older groups? */
export const canPlayUp = (group: string) => !!AGE_GROUPS.find((g) => g.name === group)?.canPlayUp;

/** Where this child books instead of paying here, or null if they pay club membership. */
export function bookingElsewhere(group: string, playsUp = false) {
  const booking = externalBookingFor(group);
  if (!booking) return null;
  return playsUp && canPlayUp(group) ? null : booking;
}

/** Can this membership product be bought for someone in this age group? */
export function membershipFits(productAgeGroup: string | null, personGroup: string, playsUp = false) {
  if (bookingElsewhere(personGroup, playsUp)) return false; // paid through the ECB, not here
  if (playsUp && externalBookingFor(personGroup)) return productAgeGroup === null; // playing up: standard junior sub
  if (productAgeGroup === ADULT) return personGroup === ADULT;
  if (productAgeGroup === null) return isJunior(personGroup); // "any junior"
  return productAgeGroup === personGroup;
}

type DiscountableProduct = {
  price_pence: number;
  price_2nd_child_pence: number | null;
  price_3rd_child_pence: number | null;
};

export const hasSiblingRates = (p: DiscountableProduct) =>
  p.price_2nd_child_pence !== null || p.price_3rd_child_pence !== null;

/** Price for the Nth junior membership a family buys in a season (1 = first child). */
export function siblingPrice(p: DiscountableProduct, position: number) {
  if (position <= 1) return p.price_pence;
  if (position === 2) return p.price_2nd_child_pence ?? p.price_pence;
  return p.price_3rd_child_pence ?? p.price_2nd_child_pence ?? p.price_pence;
}

export const ordinal = (n: number) => (n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`);

// ============================================================
// FINANCE – which Xero account each sale is coded to.
// Codes match the club's Xero chart of accounts. A product can
// override this with its own xero_account_code in Supabase.
// ============================================================
export const XERO_ACCOUNTS = {
  juniorSubs: { code: "0005", name: "Junior subs" },
  adultSubs: { code: "0002", name: "Subs" },
  socialSubs: { code: "0025", name: "Social subs" },
  clubItems: { code: "0013", name: "Clothing Sales" },
  stripeFees: { code: "1013", name: "Stripe Fees" },
} as const;

export const XERO_TAX_TYPE = "No VAT";

type FinanceProduct = { category: string; age_group: string | null; name: string; xero_account_code?: string | null };

/** The Xero account (code + label) a product's sales belong to. */
export function xeroAccountFor(p: FinanceProduct): { code: string; name: string } {
  if (p.xero_account_code) return { code: p.xero_account_code, name: `Account ${p.xero_account_code}` };
  if (p.category === "kit") return XERO_ACCOUNTS.clubItems;
  if (p.age_group === ADULT) return /social/i.test(p.name) ? XERO_ACCOUNTS.socialSubs : XERO_ACCOUNTS.adultSubs;
  return XERO_ACCOUNTS.juniorSubs;
}
