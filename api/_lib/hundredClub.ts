// ============================================================
// 100 CLUB RULES – shared by the website AND the payment server,
// so the price shown is always the price charged.
// ============================================================
import { CLUB_BANK, LOTTERY_LICENCE } from "./clubDetails.js";

export const HUNDRED_CLUB = {
  /** Numbers run from 1 to this. */
  totalNumbers: 100,
  /** One-off price for one number until the end of the club year, 31 March (pence). */
  pricePerNumberPence: 1200,
  /** Monthly prizes, in order (pence). */
  prizesPence: [2000, 1200],
  /** Most numbers someone can buy in one go. */
  maxPerPurchase: 10,
  /** How long numbers are held while a payment is checked (manual reconciliation). */
  reserveDays: 3,
  /**
   * Holders first: every number lapses on 31 March, and last year's holder has
   * this many days from 1 April (i.e. until 14 April) to renew it before it goes
   * on general sale. Keep in step with supabase/008_hundred_club_april_year.sql.
   */
  renewalGraceDays: 14,
  /** Minimum age to play a society lottery in Great Britain. */
  minimumAge: 16,

  // Bank account, promoter and licence live in clubDetails.ts (edit them there).
  bank: CLUB_BANK,
  ...LOTTERY_LICENCE,
} as const;

/** Bank payment reference: "KBCC100-" + 6 characters. UK references max 18. */
export function makeReference(randomChars: string) {
  return `KBCC100-${randomChars.toUpperCase().slice(0, 6)}`;
}

/** Characters that can't be misread when typed into a banking app. */
export const REFERENCE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** "Jordan Smith" -> "Jordan S." for public winner lists. */
export function publicName(fullName: string | null | undefined) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "A member";
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}

// ---- The club year runs 1 April to 31 March ----------------------------

/** The 31 March (YYYY-MM-DD) that ends the club year containing this date. */
export function seasonEnd(d: Date = new Date()) {
  const year = d.getMonth() >= 3 ? d.getFullYear() + 1 : d.getFullYear(); // getMonth(): April = 3
  return `${year}-03-31`;
}

/** Monthly draws left this club year, counting this month's (draws happen late in the month). */
export function drawsLeftThisYear(d: Date = new Date()) {
  const month = d.getMonth(); // 0 = Jan
  return month >= 3 ? 12 - (month - 3) : 3 - month;
}

/** True from 1 to 14 April, when only last year's holders can renew their own numbers. */
export function inHoldersFirstWindow(d: Date = new Date()) {
  return d.getMonth() === 3 && d.getDate() <= HUNDRED_CLUB.renewalGraceDays;
}

/** First day of the month, as YYYY-MM-DD. */
export function monthStart(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
