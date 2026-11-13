// ============================================================
// 100 CLUB RULES – shared by the website AND the payment server,
// so the price shown is always the price charged.
// ============================================================

export const HUNDRED_CLUB = {
  /** Numbers run from 1 to this. */
  totalNumbers: 100,
  /** One-off price for one number for one year (pence). */
  pricePerNumberPence: 1200,
  /** Monthly prizes, in order (pence). */
  prizesPence: [2000, 1200],
  /** Most numbers someone can buy in one go. */
  maxPerPurchase: 10,
  /** How long a number is held for someone while their bank transfer arrives. */
  reserveDays: 7,
  /** After a number expires, the holder keeps first refusal for this many days before it's released. */
  renewalGraceDays: 30,
  /** Minimum age to play a society lottery in Great Britain. */
  minimumAge: 16,

  // ---- Fill these in before going live -------------------------------
  // Shown to members who pay by manual bank transfer, and printed on the rules.
  bank: {
    accountName: "Kingston Bagpuize Cricket Club",
    sortCode: "00-00-00", // TODO: club bank sort code
    accountNumber: "00000000", // TODO: club bank account number
  },
  // A society lottery must show who is promoting it and who licensed it.
  promoter: "TODO: name of the club's lottery promoter", // e.g. "Jane Smith, Treasurer"
  licensingAuthority: "TODO: e.g. Vale of White Horse District Council",
  licenceNumber: "TODO: registration number",
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

/** First day of the month, as YYYY-MM-DD. */
export function monthStart(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
