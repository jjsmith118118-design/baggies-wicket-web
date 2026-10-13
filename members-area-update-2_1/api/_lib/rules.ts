// ============================================================
// CLUB RULES – shared by the website AND the payment server.
// Change these each season.
// ============================================================

export const CURRENT_SEASON = "2027";

// Junior age groups, youngest first. Anyone older than the last
// group counts as an adult.
export const AGE_GROUPS = ["U9", "U11", "U13", "U15", "U18", "U20"];

export const ADULT = "Adult";

/**
 * Age group for a season, using the ECB rule (age at 31 August before
 * the season). e.g. for 2027, a child who is 10 on 31 Aug 2026 plays U11.
 * Returns "Adult" for anyone older than the oldest junior group.
 */
export function ageGroupFor(dateOfBirth: string, season = CURRENT_SEASON): string {
  const cutoff = new Date(Number(season) - 1, 7, 31); // 31 August
  const dob = new Date(dateOfBirth);
  let age = cutoff.getFullYear() - dob.getFullYear();
  const hadBirthday =
    cutoff.getMonth() > dob.getMonth() || (cutoff.getMonth() === dob.getMonth() && cutoff.getDate() >= dob.getDate());
  if (!hadBirthday) age -= 1;
  return AGE_GROUPS.find((g) => age < Number(g.replace(/\D/g, ""))) ?? ADULT;
}

export const isJunior = (group: string) => group !== ADULT;

/** Can this membership product be bought for someone in this age group? */
export function membershipFits(productAgeGroup: string | null, personGroup: string) {
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
