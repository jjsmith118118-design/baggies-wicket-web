// TrueLayer "pay by bank" (open banking) for the 100 Club.
//
// How it works: for each purchase we create a TrueLayer payment for the exact
// amount, paid straight into the club's bank account with our reference.
// The member is sent to TrueLayer's hosted payment page, picks their bank and
// approves the payment in their banking app, then comes back to the site.
//
// Switch it on by adding these in Vercel (leave them unset and members are
// shown the club's bank details to pay by manual transfer instead):
//   TRUELAYER_CLIENT_ID           – Console → Settings → App settings
//   TRUELAYER_CLIENT_SECRET       – shown once when you create the app
//   TRUELAYER_SIGNING_KEY_ID      – the "kid" shown after you upload your public key
//   TRUELAYER_SIGNING_PRIVATE_KEY – the matching private key (PEM), kept secret
//   TRUELAYER_ENV                 – "live" for real payments; anything else = sandbox
//   TRUELAYER_MERCHANT_ACCOUNT_ID – optional: pay into a TrueLayer merchant account
//                                   instead of straight into the club's bank account
//
// Docs: https://docs.truelayer.com/docs/single-payments
import * as tlSigning from "truelayer-signing";
import { HUNDRED_CLUB } from "./hundredClub.js";

const live = () => process.env.TRUELAYER_ENV === "live";
const API = () => (live() ? "https://api.truelayer.com" : "https://api.truelayer-sandbox.com");
const AUTH = () => (live() ? "https://auth.truelayer.com" : "https://auth.truelayer-sandbox.com");
const HPP = () => (live() ? "https://payment.truelayer.com" : "https://payment.truelayer-sandbox.com");
export const WEBHOOK_JWKS_URLS = [
  "https://webhooks.truelayer.com/.well-known/jwks",
  "https://webhooks.truelayer-sandbox.com/.well-known/jwks",
];

export function truelayerEnabled() {
  return Boolean(
    process.env.TRUELAYER_CLIENT_ID && process.env.TRUELAYER_CLIENT_SECRET &&
    process.env.TRUELAYER_SIGNING_KEY_ID && process.env.TRUELAYER_SIGNING_PRIVATE_KEY,
  );
}

// Vercel sometimes stores multi-line values with literal "\n".
const privateKey = () => (process.env.TRUELAYER_SIGNING_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");

let cachedToken: { value: string; expires: number } | null = null;

async function accessToken() {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.value;
  const res = await fetch(`${AUTH()}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.TRUELAYER_CLIENT_ID ?? "",
      client_secret: process.env.TRUELAYER_CLIENT_SECRET ?? "",
      scope: "payments",
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`TrueLayer token failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expires: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

function beneficiary(reference: string) {
  const merchantAccountId = process.env.TRUELAYER_MERCHANT_ACCOUNT_ID;
  if (merchantAccountId) {
    return { type: "merchant_account", merchant_account_id: merchantAccountId, reference, statement_reference: reference };
  }
  return {
    type: "external_account",
    account_holder_name: HUNDRED_CLUB.bank.accountName.slice(0, 40),
    reference, // max 18 characters, shown on the club's bank statement
    account_identifier: {
      type: "sort_code_account_number",
      sort_code: HUNDRED_CLUB.bank.sortCode.replace(/\D/g, ""),
      account_number: HUNDRED_CLUB.bank.accountNumber.replace(/\D/g, ""),
    },
  };
}

/** Creates the payment and returns TrueLayer's id plus the hosted payment page link. */
export async function createTrueLayerPayment(opts: {
  paymentId: string; // our lottery_payments id (also the idempotency key)
  reference: string;
  amountPence: number;
  payer: { name: string; email: string };
  returnUrl: string; // must be allow-listed in the TrueLayer Console
}) {
  const path = "/v3/payments";
  const body = JSON.stringify({
    amount_in_minor: opts.amountPence,
    currency: "GBP",
    payment_method: {
      type: "bank_transfer",
      provider_selection: { type: "user_selected" },
      beneficiary: beneficiary(opts.reference),
    },
    user: { name: opts.payer.name, email: opts.payer.email },
    metadata: { lottery_payment_id: opts.paymentId },
  });
  const signature = tlSigning.sign({
    kid: process.env.TRUELAYER_SIGNING_KEY_ID ?? "",
    privateKeyPem: privateKey(),
    method: "POST" as tlSigning.HttpMethod, // const enum: use the string so bundlers don't need to inline it
    path,
    headers: { "Idempotency-Key": opts.paymentId },
    body,
  });

  const res = await fetch(`${API()}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      "Idempotency-Key": opts.paymentId,
      "Tl-Signature": signature,
    },
    body,
    signal: AbortSignal.timeout(10000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`TrueLayer create payment failed: ${res.status} ${text.slice(0, 500)}`);
  const payment = JSON.parse(text) as { id: string; resource_token: string };

  const hash = new URLSearchParams({
    payment_id: payment.id,
    resource_token: payment.resource_token,
    return_uri: opts.returnUrl,
  });
  return { truelayerPaymentId: payment.id, payUrl: `${HPP()}/payments#${hash}` };
}

/** authorization_required, authorizing, authorized, executed, settled or failed. */
export async function getTrueLayerPaymentStatus(truelayerPaymentId: string) {
  const res = await fetch(`${API()}/v3/payments/${encodeURIComponent(truelayerPaymentId)}`, {
    headers: { Authorization: `Bearer ${await accessToken()}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`TrueLayer get payment failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
  const { status } = (await res.json()) as { status: string };
  return status;
}

/** Money has left the member's bank ("executed"), or reached a merchant account ("settled"). */
export const TRUELAYER_PAID = ["executed", "settled"];
export const TRUELAYER_FAILED = ["failed"];

/** Checks a webhook really came from TrueLayer. Throws if not. */
export async function verifyTrueLayerWebhook(opts: {
  signature: string | null; path: string; body: string; headers: Record<string, string>;
}) {
  if (!opts.signature) throw new Error("Missing Tl-Signature");
  const jku = tlSigning.extractJku(opts.signature);
  if (!jku || !WEBHOOK_JWKS_URLS.includes(jku)) throw new Error(`Untrusted jku: ${jku}`);
  const res = await fetch(jku, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`Couldn't fetch TrueLayer keys: ${res.status}`);
  tlSigning.verify({
    jwks: await res.text(),
    signature: opts.signature,
    method: "POST" as tlSigning.HttpMethod, // const enum: use the string so bundlers don't need to inline it
    path: opts.path,
    body: opts.body,
    headers: opts.headers,
  });
}
