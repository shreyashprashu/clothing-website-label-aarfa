# Label Aarfa — production setup

The app is wired for **Supabase** (DB + auth), **Razorpay** (payments), and **Resend** (email).
Mocks are gone — these features only work once you have real credentials for each.

If you skip a service, the corresponding feature will fail gracefully with a toast, but the rest of the site keeps working.

---

## 1. Supabase — database + auth + OTP

1. Create a project at <https://supabase.com/dashboard> (free tier is fine to start).
2. Once provisioned, open **SQL Editor** → **New query** → paste the contents of [supabase/schema.sql](supabase/schema.sql) → **Run**. This creates all tables, RLS policies, the live-inventory functions (`try_decrement_stock`, `increment_stock`), and the trigger that auto-creates a `profiles` row on signup. Re-running this file is safe — every `CREATE` / `INSERT` is idempotent (`on conflict do nothing` on the stock seed, so you can re-run the script after schema edits without wiping your live counts).
3. **Project Settings → API**: copy these three values:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` *(server-only, never exposed)*
4. **Authentication → Sign In / Up → Email**: keep enabled. Toggle off **Confirm email** (we use OTP, not magic links).
5. **Authentication → Email Templates → "Magic Link"**: replace the body's `{{ .ConfirmationURL }}` link with the literal `{{ .Token }}` so users receive a 6-digit code instead of a clickable link. (Supabase delivers both via the same template.)
6. *(Optional)* **Authentication → SMTP Settings**: by default Supabase rate-limits emails to ~3/hr from their shared sender. For production, plug in your own SMTP — easiest is the same Resend account from §3 (host: `smtp.resend.com`, port 465, user: `resend`, password: your Resend API key).

---

## 2. Razorpay — payments

1. Create an account at <https://dashboard.razorpay.com>. You can integrate fully in **Test Mode** without KYC; KYC + activation is required only before going live.
2. **Account & Settings → API Keys → Generate Test Key**:
   - `Key Id` (starts with `rzp_test_`) → both `VITE_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_ID`
   - `Key Secret` → `RAZORPAY_KEY_SECRET` *(server-only)*
3. **Account & Settings → Webhooks → Add New Webhook**:
   - URL: `https://<your-vercel-domain>/api/webhooks/razorpay`
   - Active events: `payment.captured`, `payment.failed`, `refund.processed`
   - Set a webhook secret → `RAZORPAY_WEBHOOK_SECRET`
4. Test flow uses these card numbers: <https://razorpay.com/docs/payments/payments/test-card-details/> (e.g. `4111 1111 1111 1111` with any future expiry + CVV).
5. When ready for real money: **Activate Account**, generate **Live Keys**, swap the env vars in Vercel.

---

## 3. Resend — transactional email

1. Create an account at <https://resend.com>.
2. **API Keys → Create API Key** → `RESEND_API_KEY` *(server-only)*.
3. **Domains → Add Domain**: enter `labelaarfa.com` (or any domain you own), then add the DNS records Resend shows you (SPF + DKIM, usually with your registrar). Wait for verification.
4. Set `FROM_EMAIL` to `"Label Aarfa <care@labelaarfa.com>"` once the domain is verified.
5. **Until verification is done**, use Resend's shared sender: `FROM_EMAIL="Label Aarfa <onboarding@resend.dev>"`. Useful for local testing.

---

## 4. Vercel — environment variables

In your project on Vercel → **Settings → Environment Variables**, add every variable from [.env.example](.env.example) with real values. Set the scope to **Production**, **Preview**, and **Development** unless you have a reason not to.

Anything starting with `VITE_` is **public** and ends up in the client bundle (the anon Supabase key is safe because of RLS; the Razorpay Key Id is safe because the secret is server-only).

After editing env vars, redeploy the project — Vercel only injects them at build time.

---

## 5. Local development

```bash
cp .env.example .env.local
# fill in real values (or just the Supabase ones to test auth)

npm install
npm run dev
```

API routes also work locally via the [Vercel CLI](https://vercel.com/docs/cli):

```bash
npm i -g vercel
vercel dev
```

`vercel dev` serves both the Vite frontend and the `api/*` serverless functions at the same origin, mirroring production.

---

## 6. Smoke test checklist

Once env vars are in place and the site is redeployed:

- [ ] Open the site, click the user icon, enter your email, click **Send OTP**. Check inbox for the 6-digit code. Enter it. Toast: "Signed in successfully". User icon turns wine-coloured.
- [ ] Add a product to cart, go to checkout, fill the address form, pick **Cash on Delivery**, click Pay. Should land on the success screen and a new row should appear in Supabase `orders` with status `cod_confirmed`.
- [ ] Same flow but pick **UPI / Card / Wallet**. Razorpay modal opens. Pay with test card `4111 1111 1111 1111`. After payment, success screen + Supabase order is now `paid` + `paid_at` is set.
- [ ] Open the same product page again — the stock count should have dropped by what you just bought (live from `/api/inventory` after checkout).
- [ ] Open a product, click "Pay", then **close the Razorpay modal without paying**. Refresh — the stock should be back where it started (cancel-on-dismiss released the reservation via `/api/orders/cancel`).
- [ ] Order-confirmation email should arrive with the product thumbnail, the **LA-XXXXXXXX** order ref, and the chosen colour next to size. Admin email at `ADMIN_EMAIL` should arrive with the colour shown as a wine "COLOUR: X" pill.
- [ ] **Back-button check on iOS Safari** — open the site → tap into a product → tap browser back. You should land on the previous page (not exit the site). Tap back again until you reach home; only then should back exit the tab.
- [ ] **Deep-link check** — paste `https://www.labelaarfa.com/products/<some-slug>` directly into a new tab. Should resolve to the product page, not 404. (This requires `vercel.json` to be deployed.)
- [ ] Submit the contact form on `/contact`. Check Supabase `contact_messages` table and your `ADMIN_EMAIL` inbox.
- [ ] Submit the newsletter form in the footer. Check Supabase `newsletter_subscribers` table.

---

## 7. What is **not** done yet

| Feature | Status | Where it goes when you're ready |
|---|---|---|
| Phone-number OTP | Disabled (TRAI/DLT registration burden) | Wire MSG91 or Fast2SMS through `api/auth/send-sms-otp.js` once you have DLT clearance. |
| Abandoned-cart cleanup cron | Manual | Vercel Cron hitting an endpoint that finds `orders.status='created'` older than 30 min and calls the same `releaseStockForOrder` helper the webhook uses. The Razorpay modal-dismiss path already covers the common case via `/api/orders/cancel`; a cron is the belt-and-braces for tab-crash scenarios. |
| Shipping integration | Manual | Shiprocket or Delhivery API + webhook for tracking updates. |
| Invoices / GST | Manual | Razorpay Invoices or a separate tool like Sleek/Zoho. |

---

## 8. Costs at small scale

- Supabase free tier: 500 MB DB, 50k MAU, 2 GB egress/mo — enough for hundreds of orders/month.
- Razorpay: 2% per transaction (cards/UPI/netbanking, India). No monthly fee.
- Resend free tier: 3,000 emails/mo, 100/day. Above that, $20/mo.
- Vercel Hobby: covers the static site + serverless functions for a small store.

Effective burn at launch: roughly free until you cross the free tiers.
