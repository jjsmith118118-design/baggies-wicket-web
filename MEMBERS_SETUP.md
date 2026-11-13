# Members area – setup guide

This adds a members area at `/members` where parents can log in, add their children,
pay subs, buy club items and see their payment history. Committee admins get a
"who's paid" view with one-click reminder emails and a CSV download.

**How it fits together**

- **Supabase** (free) stores accounts, children and orders, and sends the login emails.
- **Stripe** takes the card payments. Money goes to the club's bank account.
- **Vercel** hosts the site, as now, and runs the small payment functions in `/api`.

Follow the steps in order. Do everything in **test mode** first; nothing here can
take real money until you add live Stripe keys to Production in step 6.

---

## 1. Put the code on a test branch (not main)

1. In GitHub, open the repo and click the branch dropdown (it says **main**).
2. Type `members-area` and choose **Create branch: members-area from main**.
3. Make sure **members-area** is selected, then **Add file → Upload files**.
4. Drag in the contents of the zip, keeping the folders as they are, and commit
   to the `members-area` branch.

Vercel will build a preview automatically. It won't work fully until steps 2–4 are done.

## 2. Create the Supabase project (test)

1. Sign up at supabase.com using a **club email address**, not a personal one.
2. Create a new project, e.g. `kbcc-members-test`, in region **London (eu-west-2)**.
3. Go to **SQL Editor → New query**, paste the whole of `supabase/schema.sql`, and click **Run**.
4. Go to **Table Editor → products** and set your real prices and age groups.
   Prices are in pence (8000 = £80). Untick `active` on anything you don't sell.
5. Go to **Authentication → URL Configuration**:
   - **Site URL**: `https://www.kingstonbagpuizecc.co.uk`
   - **Redirect URLs**: add `https://www.kingstonbagpuizecc.co.uk/**` and
     `https://*.vercel.app/**` (so login links work on preview sites).
6. Go to **Project Settings → API** and note the **Project URL**, the **anon public** key,
   and the **service_role** key. The service_role key is secret: never share it or put it in GitHub.

## 3. Create the Stripe account (test mode)

1. Sign up at stripe.com with the club email and choose the club as the business.
   You can leave bank details until you go live.
2. Make sure **Test mode** is switched on (toggle at the top right).
3. Go to **Developers → API keys** and note the **Secret key** (starts `sk_test_`).

## 4. Add the keys to Vercel

In Vercel, go to **Project → Settings → Environment Variables**. Add each of these,
ticking **Preview only** for now:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |
| `STRIPE_SECRET_KEY` | Stripe `sk_test_…` key |

Then go to **Deployments**, find the latest `members-area` deployment and click **⋯ → Redeploy**.
Keys only take effect on a fresh build.

## 5. Test it

Open the preview link and go to `/members`.

1. Enter your email, then click the link in the login email.
2. Add your details and a child, then go to **Pay subs & buy kit** and add items.
3. Pay with the Stripe test card **4242 4242 4242 4242**, any future expiry date, and any CVC.
   Try **4000 0000 0000 0002** to see a declined card.
4. You should land back on **My family** with the payment in your history.
5. Make yourself an admin: in Supabase, open the **SQL Editor** and run
   `update public.profiles set is_admin = true where email = 'your@email';`
   Then refresh the page, and a **Committee** tab appears.

**Webhook (recommended before going live).** Payments are confirmed when a parent
lands back on the site. The webhook is a safety net for parents who close the tab
mid-payment. In Stripe, go to **Developers → Webhooks → Add endpoint**:

- **URL**: `https://<your-site>/api/stripe-webhook`
- **Events**: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
  `checkout.session.expired`, `charge.refunded`

Copy the **Signing secret** (`whsec_…`) into Vercel as `STRIPE_WEBHOOK_SECRET`, then redeploy.

> Preview sites are password-protected by Vercel, which blocks Stripe. To test the webhook
> on a preview, go to **Vercel → Settings → Deployment Protection → Protection Bypass for Automation**,
> create a secret, and add `?x-vercel-protection-bypass=<secret>` to the end of the webhook URL.
> Use the branch's stable preview address, the one containing `git-members-area`.

## 6. Go live

1. **Stripe**: complete account activation, including club details and bank account. Switch
   off test mode, copy the **live** secret key, and create a live webhook pointing to
   `https://www.kingstonbagpuizecc.co.uk/api/stripe-webhook`.
2. **Supabase**: either reuse the test project (clear out test orders first) or create a
   separate live project and run `schema.sql` again.
3. **Login emails**: Supabase's built-in email sender only allows a handful of emails per hour,
   which is fine for testing but not for a whole club. Go to **Authentication → Emails → SMTP Settings**
   and connect an email provider such as Resend or Brevo (both have free tiers).
4. **Vercel**: add the same variables with **Production** ticked, using the live values.
5. In GitHub, open a **Pull request** from `members-area` into `main` and merge it. Vercel
   will publish the site.

---

## Things you'll change each season

- `api/_lib/rules.ts`: `CURRENT_SEASON` and the junior age groups. This one file is used by both
  the website and the payment server, so they always agree.
- Supabase **products** table: add next season's memberships (e.g. "Junior Membership 2028",
  season `2028`) and untick `active` on the old ones.

## Membership pricing rules

- **Junior memberships:** set `age_group` to an age group (e.g. `U9`) for a specific price, or leave
  it empty (null) to cover every junior who doesn't have a specific one.
- **Adult memberships:** set `age_group` to exactly `Adult`. Adults choose between all active adult
  memberships, such as playing or social.
- **Sibling discounts:** on a junior membership, fill in `price_2nd_child_pence` and
  `price_3rd_child_pence` (the 3rd rate applies to the 3rd child and every one after). Leave both
  empty for no discount. The server counts the family's memberships already **paid** this season
  plus what's in the basket. The most expensive membership is charged at full price, and the rest
  get the sibling rates. This works even if children are paid for weeks apart, and nobody can get
  the reduced rate without a full-price child on their account. Adults are never discounted and
  don't count towards the sibling total.
- **Family rate with an adult membership:** tick `unlocks_family_rate` on an adult membership
  (by default only Adult Playing). If the family has that membership in their basket or already
  paid this season, their 1st child is charged the 2nd-child rate. Other children keep their usual
  sibling rates.
- Each order records the full price and which child number it was, so you can see every discount
  given in the committee view and in Supabase.

## Privacy

You're storing parents' contact details and children's names and dates of birth. Before
launch, add a short privacy notice explaining what's collected and why, and limit admin
access to the committee members who need it. Parents can see only their own family. This is
enforced by the database itself, not just the website.

---

## 100 Club lottery

Members pick numbers from 1–100 at `/members/100-club`. Each number costs **£12, paid once, for 12 months
of draws**. Every month the committee runs the draw from **100 Club admin**: 1st prize £20, 2nd prize £12.
Prices, prizes and the hold time live in **`api/_lib/hundredClub.ts`**. The club's bank details, promoter and licence live in **`api/_lib/clubDetails.ts`**.

### 1. Fill in the club details

Open `api/_lib/clubDetails.ts` on GitHub (click the file, then the pencil icon) and replace every `TODO`. Code updates never include this file, so your details won't be overwritten:

- **bank**: the club's sort code and account number. Members who aren't using pay-by-bank see these.
- **promoter**, **licensingAuthority** and **licenceNumber**: a society lottery must show these. They appear in the rules on the page.

### 2. Create the database tables

In Supabase, go to **SQL Editor → New query**, paste the whole of `supabase/006_hundred_club.sql`, and click **Run**.

### 3. Payments

**Bank transfer (works straight away).** When a member chooses numbers, the site holds them for 3 days (to allow time for manual reconciliation)
and gives them a unique reference such as `KBCC100-7QX4MZ`. They pay the club by bank transfer using that
reference. A committee member then matches the reference on the bank statement and clicks **Mark paid**
in **100 Club admin**. The numbers go into the draw immediately. Use **Cancel** to release numbers that
were never paid for.

**TrueLayer pay-by-bank (optional, recommended).** With TrueLayer, members tap **Pay by bank**, choose their bank
and approve the payment in their banking app. The amount and reference are already filled in, the money goes
straight into the club's bank account, and the payment confirms itself without anyone checking the statement.

1. Sign up at console.truelayer.com with the club email. You start in **sandbox** (test) mode.
2. In the Console's app settings, note the **client_id** and **client_secret**. The secret is shown only once.
3. Make a signing key pair. In Terminal, run:
   ```
   openssl ecparam -genkey -name secp521r1 -noout -out ec512-private-key.pem
   openssl ec -in ec512-private-key.pem -pubout -out ec512-public-key.pem
   ```
   Upload `ec512-public-key.pem` in the Console's payments settings (signing keys) and note the **Key ID** it gives you.
   Keep the private key file secret, and never put it in GitHub.
4. In the Console's allowed redirect URIs, add `https://www.kingstonbagpuizecc.co.uk/members/100-club`
   and your preview address, for example `https://<branch-preview>.vercel.app/members/100-club`.
5. In the Console's webhook settings, set the webhook URI to `https://<your-site>/api/truelayer-webhook`.
   The site checks every webhook against TrueLayer's published signing keys.
6. Add these in Vercel (Preview only to start with):

   | Name | Value |
   |---|---|
   | `TRUELAYER_CLIENT_ID` | client_id |
   | `TRUELAYER_CLIENT_SECRET` | client_secret |
   | `TRUELAYER_SIGNING_KEY_ID` | The Key ID from step 3, in lowercase (the Console shows it in capitals) |
   | `TRUELAYER_SIGNING_PRIVATE_KEY` | The whole contents of `ec512-private-key.pem` |
   | `TRUELAYER_ENV` | Leave unset for sandbox; `live` for real payments |
   | `SITE_URL` | The site address with no path, e.g. `https://www.kingstonbagpuizecc.co.uk` (your preview address while testing) |

7. Redeploy, then buy a number on the preview site. TrueLayer's sandbox offers mock test banks
   that approve the payment without real money.
8. To go live, complete TrueLayer's business verification, switch the Console to **Live**, create live
   keys (steps 2–5 again) and set `TRUELAYER_ENV` to `live` in Vercel's Production settings.

If the TrueLayer keys aren't set, or TrueLayer is down, members are automatically shown the bank transfer details instead.
If a member hasn't added their name yet, they're asked to add it first, because TrueLayer needs the payer's name.

### 4. Running the monthly draw

In **100 Club admin**, choose the month and click **Run the draw**. The site picks two different numbers at
random, using a cryptographically secure random generator, from every number that is paid up on the day.
Each month can be drawn only once. The list of numbers in the draw is saved with the result, so it can be
checked later. Members see the winners as "first name and initial". Once you've paid the winners, click
**Mark prizes paid**.

### Renewals

A number is in the draw for 12 months from the day its payment is confirmed. In the last 30 days, members
see a **Renew** button. Renewing early adds another 12 months to the end of the current year. After a
number expires, the holder has 30 days to renew before it becomes available to anyone else.

---

## Pay by bank for subs and kit

When TrueLayer is switched on (the same settings as the 100 Club), the **Pay subs & buy kit** basket shows
two buttons: **Pay by card** (Stripe, as before) and **Pay by bank** (TrueLayer). Prices, sibling discounts,
the committee view, CSV downloads and Discord notifications work the same way for both.

1. In Supabase, run `supabase/007_pay_by_bank.sql` (SQL Editor → New query → paste → Run). It only adds
   columns, and existing orders are marked as card payments.
2. In the TrueLayer Console, add one more **redirect URI**: your site address followed by `/members`
   (for example `https://www.kingstonbagpuizecc.co.uk/members`, plus the preview address while testing).
3. Redeploy.

**Refunds:** a bank payment goes straight into the club's account, so there's no one-click refund like
Stripe's. The treasurer refunds by normal bank transfer, then changes the order's `status` to `refunded`
in Supabase (Table Editor → orders). Bank orders show "by bank" and their reference in the committee's
**Recent payments** list.

---

## Discord notifications for the 100 Club

Every confirmed 100 Club payment (pay-by-bank, or a bank transfer marked paid by the committee) is posted to
Discord with the numbers, amount, member (first name and initial) and reference.

In Vercel → Settings → Environment Variables, add `DISCORD_100CLUB_WEBHOOK_URL` (type **Secret**) with the
Discord webhook address for the channel you want. If it isn't set, 100 Club payments go to the same channel
as subs and kit (`DISCORD_WEBHOOK_URL`). Preview sites label their posts **[TEST]**.
