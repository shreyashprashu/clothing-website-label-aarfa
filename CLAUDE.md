# Label Aarfa — Project Guide for Claude

A premium ethnic-wear e-commerce SPA for **Label Aarfa**, a Delhi-based couture house (est. **2019**, tagline *"Fashion Redefined"*). The site sells handcrafted kurtas, coord sets, and stitched suits. Tone is editorial, slow-luxury, restrained — think *"slow couture"*, not fast fashion.

This is a **relaunch** of the existing labelaarfa.com — the brand is real, product imagery sits in `public/images/products/` with responsive WebP variants generated at build time.

## Tech stack

- **React 19** + **Vite 8** (JSX, no TypeScript), bundled via Rolldown (Vite 8's default)
- **Tailwind CSS v4** via `@tailwindcss/vite` (utility classes + lots of inline `style={{}}` for exact brand colors)
- **lucide-react** for all icons (always `strokeWidth={1.2 – 1.5}` — thin, never bold)
- **Supabase** (`@supabase/supabase-js`) — auth (email OTP + Google OAuth), Postgres, RLS
- **Razorpay** (Razorpay Node SDK on server, Checkout JS on client) — payments
- **Resend** — transactional email, sent FROM `care@labelaarfa.com` (verified domain)
- **sharp** (devDep) — generates responsive WebP variants in a one-time / prebuild script
- **Vercel Functions** (`api/*.js`) as the backend
- ESLint flat config (`eslint.config.js`)
- Primary host is **Vercel**, base path `/`. Hostinger holds the DNS for `labelaarfa.com` (including Resend's DKIM/SPF/MX records).

## Scripts

```bash
npm run dev       # local dev
npm run images    # one-time WebP variant generation (idempotent, mtime-aware)
npm run build     # production build → dist/ (runs npm run images first via prebuild)
npm run preview   # preview built site
npm run lint      # eslint
npm run deploy    # gh-pages -d dist (legacy, mostly unused — primary deploy is Vercel)
```

## File layout

```
src/
  App.jsx            All React UI (single file by design — see below, ~2700 lines)
  lib/
    supabase.js      Browser Supabase client (anon key, RLS-bound)
    api.js           fetch wrappers for /api/* + Razorpay Checkout loader. post() accepts optional bearer token.
  main.jsx           Entry
  index.css          @import "tailwindcss"
  App.css            Legacy Vite scaffold CSS — unused, safe to delete

api/                 Vercel Serverless Functions (Node.js runtime, ESM)
  _lib/
    supabase.js      Server Supabase client (service_role, bypasses RLS)
    email.js         Resend helpers — sendOrderConfirmation, sendOrderAdminNotification,
                     sendContactMessage, sendNewsletterWelcome. esc() helper for XSS-safe HTML.
    products.js      Server-side product price source of truth (mirrors src/App.jsx PRODUCTS)
    promos.js        Promo code registry + validatePromo() — server is final authority
  orders/
    create.js        POST: JWT-verify userId, server-derive prices, validate promo,
                     Razorpay order create + atomic DB insert
    verify.js        POST: HMAC verify Razorpay signature → atomic flip to paid → send emails
  webhooks/
    razorpay.js      POST: async events (payment.captured, payment.failed, refund.processed)
                     — atomic .neq('status','paid') means only the winner of the race emails
  contact.js         POST: contact form → DB row + Resend email to ADMIN_EMAIL
  newsletter.js      POST: upsert newsletter_subscribers row + sendNewsletterWelcome on fresh signups
  geo.js             GET: returns visitor's country (Vercel ip header), suggested currency,
                     fresh INR-base FX rates (Frankfurter, cached 6h), markupInr

scripts/
  optimize-images.mjs  One-time pipeline: for every JPEG under public/images/products/,
                       emits .400.webp / .800.webp / .1280.webp via sharp at quality 82.
                       Skips files whose webp already exists with a newer mtime.

supabase/
  schema.sql         Paste-into-SQL-Editor schema. Idempotent (CREATE IF NOT EXISTS / ALTER ADD
                     COLUMN IF NOT EXISTS). Tables: profiles, addresses, orders, order_items,
                     user_carts, wishlist_items, newsletter_subscribers, contact_messages.
                     RLS: own-only SELECT/INSERT/UPDATE on profiles + addresses + own orders.
                     Trigger handle_new_user auto-inserts profile row + maps Google metadata.

public/              Static assets — see table below
  info/              Standalone HTML policy pages (privacy / terms / returns) for Google
                     OAuth verification crawler + non-JS clients

SETUP.md             Step-by-step setup for Supabase, Razorpay, Resend, Vercel env vars
.env.example         All env vars with notes on which are public (VITE_*) vs server-only
```

The React app lives in a **single file** ([src/App.jsx](src/App.jsx), ~3280 lines) — deliberate. Sections are demarcated by big banner comments:

```
PRODUCTS — product catalog with categories: premium | coords | pakistani | unstitched | premium-legacy
           Helpers: uniqueByGroup() collapses colour peers; peersOf(product) returns same-groupId siblings.
PALETTE — colors documented inline
CURRENCIES + INTL_MARKUP_INR + PROMOS — pricing constants, client-mirror of api/_lib/promos
SUPPORTS_HOVER + ProductImage — responsive <picture> wrapper with WebP srcset
CART HELPERS — cartKey(productId,size), stripCart, hydrateCart (auto-dedupes legacy color keys), mergeCarts
CONTEXT — AppCtx, AppProvider (cart, wishlist, nav, Supabase session sync, cartSyncReadyRef, signOut)
SEO — applySeo(page), per-page title/meta/JSON-LD updates
HEADER, AnnouncementBar, IntlPricingNotice (non-INR persistent strip), MOBILE MENU
HERO (uses premium hero images, slide-specific CTA target), PRODUCT CARD (with colour-swatch dots + Sold Out treatment)
HOMEPAGE SECTIONS — Hero, CollectionsScroller (Galoir-style horizontal tile scroller),
                    CategoryPreview × 4 (Premium / Pakistani / Coords / Unstitched),
                    EditorialBanner, ClientDiaries (Celebrity highlight + Our Events + Reviews mosaic),
                    ValueProps, Newsletter
CATEGORY PAGE — handles 'premium' specially to include sold-out 'premium-legacy' archive
                with in-stock items sorted first.
PRODUCT PAGE — colour swatch picker (navigates to peer product), Sold Out replaces Add-to-Bag with
               "Sold Out" + Save-for-Later, with copy nudging to the active Premium edit.
CART DRAWER, SEARCH OVERLAY (popular tags updated to Premium/Pakistani/Coord/Unstitched),
AUTH MODAL (email OTP + Google OAuth, no phone OTP), WISHLIST, CHECKOUT (Razorpay only), ABOUT, CONTACT
FOOTER (Shop column includes all four active collection links), TOAST, ROUTER + APP
```

Keep this single-file structure unless a section grows past ~300 lines and there's a real reason to extract. Backend code (`api/*`) and small client libs (`src/lib/*`) are *expected* to live outside `App.jsx`.

### Static assets in `public/`

| File | Purpose |
|---|---|
| [public/logo.svg](public/logo.svg) | Full brand logo — LA monogram + "Label Aarfa" wordmark + "Fashion redefined" tagline. Wine `#5C1A22` on transparent. |
| [public/logo-mark.svg](public/logo-mark.svg) | LA monogram only (no text). Used in header next to wordmark + mobile drawer. |
| [public/favicon.svg](public/favicon.svg) | Inverted favicon — cream LA on a rounded wine square. |
| [public/icons.svg](public/icons.svg) | Inline icon sprite (kept for reference; lucide-react does the heavy lifting). |
| [public/images/products/](public/images/products/) | ~150 source JPEGs + matching WebP variants (`.400.webp`, `.800.webp`, `.1280.webp`). Naming convention: legacy items keep their original WordPress-export names; new inventory uses `premium-N-K.jpg`, `coord-Nx-K.jpg`, `pakistani-N-K.jpg`, `unstitched-N-K.jpg` where `N` is the product number, `K` is the image index, and `x` (a/b/c/d/e) marks colour variants. Mobile cards download ~30 KB instead of ~108 KB. |
| [public/images/diaries/](public/images/diaries/) | Client Diaries imagery — `event-1.jpg … event-6.jpg`, `review-1.jpg … review-20.jpg`, `celebrity.jpg`. Same WebP pipeline. |
| [public/logo-email.png](public/logo-email.png), [public/logo-mark-email.png](public/logo-mark-email.png) | Raster PNG versions of the brand mark used in transactional emails (Gmail/Outlook don't reliably render SVG). Generated by sharp from the SVGs — re-run the snippet in CLAUDE-internal notes when the logo design changes. |
| [public/info/privacy.html](public/info/privacy.html), [terms.html](public/info/terms.html), [returns.html](public/info/returns.html) | Standalone HTML mirrors of the in-app policy pages. Needed because the SPA serves the same `index.html` at every path — Google's OAuth verifier and other non-JS crawlers couldn't see distinct policy content otherwise. Keep these in sync when policy copy changes. |
| [public/robots.txt](public/robots.txt) | Allows main crawlers + all major LLM bots (GPTBot, ClaudeBot, anthropic-ai, PerplexityBot, Google-Extended, Applebot-Extended, CCBot, etc.). Disallows `/cart`, `/checkout`, `/account`, `/api/`. |
| [public/sitemap.xml](public/sitemap.xml) | Static sitemap listing collections, pages, and all 16 products. URLs assume the eventual SSG/SSR URL scheme — **these don't resolve in the current SPA**. |
| [public/llms.txt](public/llms.txt) | Markdown index for LLM crawlers. Lists collections, featured products with prices, brand facts, policies. |
| [public/404.html](public/404.html) | Fallback for direct URL hits on the SPA — redirects to home. |

## Image pipeline

Mobile users were the bottleneck pre-WebP. The pipeline:

1. **`scripts/optimize-images.mjs`** reads every `.jpe?g` / `.png` under `public/images/products/` **and** `public/images/diaries/` and writes `<name>.400.webp`, `<name>.800.webp`, `<name>.1280.webp` next to the original via `sharp` at quality 82. Idempotent on mtime — re-runs are cheap.
2. **`prebuild` script** runs it automatically before every `vite build`, so a fresh photo dropped in `public/images/products/` is picked up on the next deploy.
3. **`<ProductImage>` component** (top of [src/App.jsx](src/App.jsx)) emits a `<picture>` with WebP `srcset`, JPEG fallback, intrinsic `width`/`height` for zero CLS, and `decoding="async"`. Touch devices skip the hover-swap second image entirely (gated on a module-level `SUPPORTS_HOVER` flag using `matchMedia('(hover:hover) and (pointer:fine)')`).
4. **Hero LCP image** is preloaded in [index.html](index.html) via `<link rel="preload" as="image" imagesrcset=…>` so the largest paint starts before JS parses.
5. **Vite bundle splitting** ([vite.config.js](vite.config.js)) puts `react` + `react-dom` and `@supabase/supabase-js` in their own chunks so they cache across deploys.

## Design language

The look is **"warm pearl + deep wine + antique gold on soft black"** — Indian couture editorial. Think Sabyasachi catalogue meets Aritzia website.

### Color palette (all in hex, used as inline styles, not Tailwind tokens)

| Role | Hex | Where used |
|---|---|---|
| `--bg-base` warm pearl | `#FBF8F3` | page background, header, mobile drawers |
| `--bg-soft` champagne | `#F6F0E5` | elevated surfaces, sale strip, sidebar filter panel, intl-pricing strip |
| `--bg-card` white | `#FFFFFF` | product cards (white card on warm bg = "morphous lift") |
| `--bg-cream` | `#EFE6D6` | secondary surfaces |
| `--ink` soft black | `#1F1A14` | all primary text, primary buttons, footer & dark sections |
| `--ink-soft` warm muted | `#6B5F4F` | body copy, secondary text |
| `--line` warm border | `#E8DDC9` | all borders/dividers (never pure gray) |
| `--accent` deep wine | `#7B1E28` | sale price, hover, eyebrow text, discount badges, intl-fee notice |
| `--gold` antique gold | `#B8924A` | dark-section accents (footer, editorial banner, newsletter), buy-now button, "Welcome" check ring |
| muted putty | `#A89888` | strikethrough/disabled prices |
| success green | `#2F6B3E` | "You save ₹X", order status, newsletter inline confirmation |

**Never use** pure black `#000`, pure gray Tailwind tokens, or cool blues for chrome. Everything is warm.

### Typography

```
Display / headings: 'Cormorant Garamond', serif  (weights 300–600, italic available)
Body / UI:          'Inter', system-ui, sans-serif  (weights 300–700)
```

Loaded via a real `<link rel="stylesheet">` in [index.html](index.html) `<head>` — **not** a CSS `@import` inside a React `<style>` block (that was render-blocking). `preconnect` to `fonts.googleapis.com` + `fonts.gstatic.com` is in the same `<head>`.

Conventions:
- **Headings** are always Cormorant, `fontWeight: 400` (not 700) — slim, editorial. Often use italic `<em>` for an accent word in the brand wine color.
- **Eyebrow labels** (e.g. "New Edit · 2026", "Fresh from the atelier"): tiny uppercase Inter, `tracking-[0.28em]` to `tracking-[0.32em]`, light weight, in wine `#7B1E28` or gold `#B8924A` on dark sections.
- **Buttons / nav links**: uppercase, `tracking-[0.22em]` to `tracking-[0.25em]`, font-light or font-medium, very small (11–12px).
- **Body copy**: Inter `font-light` (300), warm-muted color `#6B5F4F`, generous line-height.
- The brand wordmark "LABEL AARFA" is Cormorant 500, `tracking-[0.18em]`, often paired with a tiny gold/wine "Fashion Redefined · Est. 2019" sub-line.

### Spacing & layout

- Max page width: `max-w-[1440px]` with horizontal padding `px-4 sm:px-6 lg:px-10`.
- Section vertical padding: `py-14 sm:py-20 lg:py-24` for major sections; `py-10 sm:py-14` for tighter ones.
- Grid: product grids are `grid-cols-2 lg:grid-cols-4` on home/sale and `grid-cols-2 lg:grid-cols-3` on category pages.
- Header is `sticky top-0 z-40`, three-column grid with logo dead center. `<AnnouncementBar>` + `<IntlPricingNotice>` (non-INR only) stack above it inside the sticky region.
- Hero on mobile uses **`flex flex-col`** (not `grid`) — implicit grid auto-tracks collapsed the image panel on iOS Safari. Above `lg:` it switches to `grid lg:grid-cols-12` with a 7/5 split.

### Corners, shadows, borders

- Border radius is **not a single token** — buttons/cards use `4px`, product cards and surfaces use `12px`, pill chips use `20px`, avatars/icon buttons use `50%`. Match neighboring elements when adding new UI.
- Shadows are soft and warm-toned, not flat black. The standard product-card hover lift: `0 12px 28px -10px rgba(31, 26, 20, 0.18)`. Resting: `0 2px 8px -2px rgba(31, 26, 20, 0.06)`.
- Borders are 1px, always color `#E8DDC9` on light surfaces, `rgba(246, 240, 229, 0.1–0.3)` on dark sections.

### Motion

Animations are defined in a `<style>` block at the bottom of `App()`. Use these utility classes:

```
animate-fadeIn       — 500ms ease-out  (account dropdown, confirmation panels)
animate-slideUp      — 700ms cubic-bezier(0.22, 1, 0.36, 1)  (hero text, toasts)
animate-slideInRight — 260ms (cart drawer, filter sheet)
animate-slideInLeft  — 260ms (mobile menu)
animate-scaleIn      — 380ms (modals)
.page-enter          — 420ms cubic-bezier(0.22, 1, 0.36, 1)  (route transition, no will-change)
```

**Hero crossfades on a 6.5s interval; AnnouncementBar rotates messages every 4s. Both tick handlers bail early if `document.hidden` is true** — mobile browsers throttle setIntervals in backgrounded tabs and fire a burst on return, which was causing long-session lag.

Product-card hover swaps to the second image over 1100ms — **only on devices that report `(hover: hover) and (pointer: fine)`**. Touch devices don't render the second image at all (saves ~70 KB / card on mobile).

### Component patterns

- **ProductCard**: white card on warm background, hover-swap (desktop only), Quick-Add reveals from below on desktop hover, wishlist heart top-right, discount/new badge top-left.
- **Drawers** (cart, mobile menu, filters): full-height side panels over a `rgba(31, 26, 20, 0.55)` overlay. Cart and filters slide from right, menu from left.
- **Buttons**:
  - Primary: solid `#1F1A14` ink, white text, `borderRadius: '4px'`, uppercase tracked-out label.
  - Secondary: transparent with `1px solid #1F1A14` border, swaps to inverted on hover.
  - "Buy Now": gold `#B8924A` background with ink text — used only on PDP.
- **Forms**: white input on warm bg, `1px solid #E8DDC9`, 8px radius, focus border swaps to `#1F1A14` (global rule in App-level `<style>`).

## App architecture

- **Single Context** (`AppCtx`, `useApp()`) holds page, cart, wishlist, drawer/modal open states, user (Supabase `Session.user` or null), currency, toast, and `signOut()`. No Redux, no router library.
- **Routing** is a state-based switch in `Router()` — `home | category | product | wishlist | orders | checkout | about | contact | info`. `navigate(name, data)` scrolls top + closes mobile menu. URLs do not change on navigation (known limitation).
- **Auth**: `AppProvider` hydrates the Supabase session on mount, subscribes to `onAuthStateChange`. Sign-in methods: **email OTP** and **Google OAuth**. Phone OTP is disabled (DLT/TRAI registration friction). Sign-in hydration runs effects gated on `user?.id` change: upserts the `profiles` row with Google metadata, fetches the default address, merges DB wishlist + cart with local.
- **Cart line key**: `${productId}-${size}` — color was removed when the swatch UI went away. `hydrateCart()` always recomputes the key on read, so legacy color-keyed rows in localStorage or `user_carts` auto-dedupe.
- **Cart cross-device sync**: `user_carts` (JSONB blob) is the source of truth when signed in. Sign-in merges DB with local (MAX qty for shared keys); every subsequent cart change upserts to DB. The merge waits on `cartSyncReadyRef` so the empty initial state doesn't overwrite saved data.
- **Cart on sign-out**: `signOut()` **synchronously** wipes local state (`setCart([])`, `setWishlist([])`, `setCartOpen(false)`, `setDefaultAddress(null)`) AND wipes localStorage (cart, cart-owner, wishlist, wishlist-owner), THEN awaits `supabase.auth.signOut()`. DB-side `user_carts` row is preserved (sync ref short-circuited before wipe), so a re-login restores the saved cart.
- **Multi-currency display only**: `CURRENCIES` map with INR base + rates; `formatPrice(inr, code)` is the single rendering helper. **Razorpay charges in INR**, regardless of what the user is viewing. International visitors see an `<IntlPricingNotice>` strip below the announcement bar and a per-product notice on the PDP, explaining the `INTL_MARKUP_INR` (currently ₹5,000) service fee added at checkout.
- **Product data** is hardcoded in the `PRODUCTS` array at the top of [src/App.jsx](src/App.jsx). Server-side pricing + image lookup is [api/_lib/products.js](api/_lib/products.js) — keep these two in sync (id, name, price, sizes, stock, plus the `image` filename used to build email thumbnails). `productImageUrl(id)` returns the absolute hosted URL so emails render across inboxes.
- **Colour-variant model**: instead of nested variants, colour peers are sibling products that share a `groupId`. The category grid collapses peers via `uniqueByGroup()`; ProductCard shows tiny swatch dots; ProductPage shows full clickable circles that `navigate()` to the peer's product id. Cart treats every (productId, size) as its own SKU (so Pink M and Black M never collide).
- **Sold Out treatment**: `stock === 0` everywhere disables add-to-bag UI: ProductCard hides the desktop Quick-Add overlay, swaps the new/sale badge for a "Sold Out" chip, applies a 40% grayscale filter to the image, and skips the colour-dot click swap. ProductPage replaces the action buttons with a disabled "Sold Out" + "Save for Later", and points the user to the active Premium edit.
- **Premium archive**: the legacy 16 products live under `category: 'premium-legacy'` with `stock: 0`. The `/collections/premium` slug merges `premium` (active) + `premium-legacy` (archived), then sorts so in-stock items appear first. All other category slugs exclude `premium-legacy` to keep listings honest. Direct product URLs still resolve so old wishlists / share-links don't 404.

## Backend conventions

- **All money in paise** (INR × 100) once it crosses the API boundary. Display-only conversions happen client-side via `formatPrice`. Avoid floats.
- **Never trust client totals**. `api/orders/create` re-derives subtotal/shipping/total from `productById()`, the items it was sent, and the validated promo. Client can be a stale browser or a hostile actor.
- **JWT-verified userId**: `api/orders/create` reads the `Authorization: Bearer <token>` header and calls `sb.auth.getUser(bearer)`. Client-sent `userId` is treated as a hint and overridden by the verified one (or set to null for guests).
- **Server reads `process.env.*`, browser reads `import.meta.env.VITE_*`**. Only the `VITE_*` ones land in the client bundle.
  - Public-safe: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_RAZORPAY_KEY_ID`.
  - Server-only: `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RESEND_API_KEY`, `FROM_EMAIL`, `ADMIN_EMAIL`.
- **Razorpay flow** (`api/orders/create` → client opens Razorpay → `api/orders/verify`):
  1. Server creates a Razorpay Order + mirror row in `orders` (status `created`).
  2. Client opens Razorpay Checkout with the order id + key id from the server response.
  3. On `handler` callback, client POSTs the three razorpay_* fields to `/api/orders/verify`.
  4. Server HMAC-verifies signature (`crypto.timingSafeEqual` on hex strings), **atomically** flips status `created → paid` via `.neq('status', 'paid')`, fires confirmation + admin emails.
  5. Webhook (`api/webhooks/razorpay`) is the safety net for browser crashes / flaky networks. Same atomic update — whichever path flips status first owns the email send. The other path no-ops.
- **Emails**: `FROM_EMAIL` defaults to `onboarding@resend.dev` (Resend's shared sender, only delivers to the account email). Production should set `FROM_EMAIL=Label Aarfa <care@labelaarfa.com>` after verifying the domain in Resend. `ADMIN_EMAIL` defaults to `label.arfa@gmail.com` (where order + contact-form notifications land — direct, bypassing the Hostinger forwarder). The forwarder routes inbound mail at `care@labelaarfa.com` to the same Gmail. **Branded templates**: `brandHeader()` in `api/_lib/email.js` injects the LA monogram PNG (`/logo-mark-email.png`) + wordmark + tagline above every transactional email. Order confirmation and admin notification rows include a 72×90 (customer) / 56×70 (admin) product thumbnail by URL — fetched via `productImageUrl(line.product_id)` on the server. If the lookup fails (legacy product missing from the mirror), a soft cream tile renders instead of a broken-image icon.
- **Promo codes**: `api/_lib/promos.js` is the source of truth. Client mirrors the list in `src/App.jsx` for instant feedback while typing, but `api/orders/create` re-runs `validatePromo()` and rejects with 400 if invalid. `firstOrderOnly` flag is enforced via a count of the user's prior `paid`/`cod_confirmed`/`shipped`/`delivered` orders (guests are exempt — no stable identity to count against). `WELCOME10` = 10% off, INR-only, first-order-only. Order rows persist `promo_code` (text) + `discount_paise` (int) for receipts and emails.
- **Newsletter**: `api/newsletter` upserts `newsletter_subscribers`, and on **fresh** signups (status was missing or != active) sends `sendNewsletterWelcome({ to })` — an HTML email with the WELCOME10 code in a dashed callout. Re-subscribing an already-active address returns `{ ok: true, alreadySubscribed: true }` and silently skips the welcome email; the client renders a different "You're already with us" panel that doesn't dangle the 10% code again.
- **RLS is on** for `profiles`, `addresses`, `orders`, `order_items`. Service role bypasses RLS — only use the service client from `api/_lib/supabase.js` server-side. Anon-key reads from the browser are limited to a user's own rows. `profiles` has SELECT, INSERT, UPDATE policies all gated on `auth.uid() = id` (INSERT matters because the client's sign-in upsert hits the INSERT branch when the trigger-created row is missing).
- **Errors**: API routes return `{ error: '...' }` with a non-2xx status. `src/lib/api.js` `post()` throws on non-OK, so callers can `try/catch` and `showToast(err.message)`.

## Pricing & international

- **Domestic (INR)**: free shipping over ₹2,999, else ₹99.
- **International (any non-INR currency)**: flat ₹5,000 service/shipping markup (`INTL_MARKUP_INR`), no domestic shipping fee.
- **Server-authoritative intl detection**: `api/orders/create` checks `x-vercel-ip-country`. If the request is from outside India, intl pricing is forced regardless of what the client claims as `currency` (anti-VPN-arbitrage).
- **Visibility for non-INR visitors**: `<IntlPricingNotice>` strip lives in the sticky header (warm cream bg, wine accent, Globe icon). PDP shows the same notice under the price block. Cart drawer and checkout summary include a separate "International service" line. Customer can't reach checkout without seeing the fee at least twice.
- **No COD**. Payment methods are UPI / card / wallet (all via Razorpay). The `payment_method` column still allows `cod` for legacy rows but the UI doesn't offer it.

## SEO conventions

The site is a client-rendered SPA — search bots that don't execute JS only see [index.html](index.html). To partially compensate:

1. **Baked-in head** ([index.html](index.html)): homepage title, description, OG image, canonical, theme color, `Organization`, `ClothingStore`, and `WebSite` JSON-LD all in the HTML at first byte. LCP hero image is preloaded with `<link rel="preload" as="image" imagesrcset=…>`.
2. **Per-page updates** via `applySeo` swap title / description / OG / canonical and add `Product` + `BreadcrumbList` JSON-LD when navigating to a product or category. Google with JS rendering picks these up.
3. **`llms.txt`** ([public/llms.txt](public/llms.txt)) gives LLM crawlers a static markdown index of products, brand facts, and prices — readable without JS.
4. **Standalone HTML policy pages** at `/info/privacy.html`, `/info/terms.html`, `/info/returns.html`. These are what Google's OAuth verifier crawls (it doesn't execute JS, so the SPA's policy routes look identical to home). **Keep these in sync with `POLICIES` in App.jsx when copy changes.**
5. **Known limitations** (not yet addressed):
   - URLs don't change on navigation (no `pushState`) — social shares and bookmarks all point to `/`.
   - Sitemap URLs assume a future URL scheme that doesn't resolve today.
   - True SSG/SSR would require a Next.js / Astro / Remix migration.

When adding a new page route, also update `applySeo` with its title, description, and canonical — otherwise it inherits the home-page meta.

## When making changes — tone & taste guardrails

1. **Don't make it louder.** This brand is quiet. Avoid bright primaries, heavy borders, big shadows, bold weights on headings, or chunky/rounded "fun" UI. If you find yourself reaching for `font-bold`, you probably want Cormorant at weight 400 instead.
2. **Stay in the palette.** Adding a new color means adding it to the palette comment in [src/App.jsx](src/App.jsx) and using it intentionally. Don't reach for default Tailwind grays/blues.
3. **Use the right "currency" of emphasis:** wine `#7B1E28` for sale/CTAs on light surfaces; gold `#B8924A` for accents on dark surfaces. Don't mix them.
4. **Icons stay thin.** `strokeWidth={1.2}` to `1.5`. Never `2`.
5. **Tracking on small uppercase text** — if you add a button or eyebrow label, give it `tracking-[0.18em]` to `tracking-[0.32em]` and `font-light` or `font-medium`. Untracked uppercase will look out of place.
6. **Match existing radii** (4 / 8 / 12 / 20 / 50%) — don't introduce a new one without reason.
7. **Mobile-first responsive.** Most components define both mobile and `sm:` / `lg:` variants for padding, font size, and grid columns. The hero uses flex on mobile, grid on lg+ — match that pattern when adding sticky layouts that need to feel right on iOS Safari.
8. **Inline styles over Tailwind for brand colors.** The project already mixes Tailwind utilities for layout/typography with inline `style={{ color, backgroundColor, border }}` for exact hex values. Match that pattern — don't refactor to CSS variables unless asked.
9. **All product images go through `<ProductImage>`** — never write a raw `<img src=".../products/...jpeg">`. The helper handles WebP srcset, sizes hint, lazy-loading, intrinsic dimensions, and object-fit. SVG logos in `public/` are exempt.
10. **Single-file is intentional.** Don't preemptively split [src/App.jsx](src/App.jsx) into many small component files unless the user asks.
11. **Don't introduce TypeScript, a router library, or a state manager** without explicit ask.
12. **Editorial details matter:** unboxing video required for damage claims, 24-hour window, no refunds (coupon or exchange only), no cancellations after placement. When writing policy copy, defer to the user's exact wording — they care about the legal precision.

## What's in the codebase

- Full backend: orders, payments (Razorpay only), webhooks, contact form, newsletter with welcome email, geo + FX rates, promo validation.
- Supabase auth with email OTP + Google OAuth. Phone OTP disabled.
- RLS-protected user-owned tables (profiles, addresses, orders, order_items, wishlist_items, user_carts).
- Image pipeline (sharp → WebP variants) for both `public/images/products/` **and** `public/images/diaries/`.
- `<ProductImage>` responsive helper used for product imagery, hero, collections scroller, diaries grids.
- Four-category catalogue: **Premium** (luxury line + legacy archive sold-out), **Co-ord Sets** (Solid Farshi in 5 colourways), **Pakistani Ready-to-Wear**, **Unstitched Collection** (Karachi prints + party-wear set). Galoir-style horizontal CollectionsScroller right under the hero.
- Colour-variant model via `groupId` peers; ProductCard shows swatch dots, ProductPage shows full picker.
- Sold Out state cascades through ProductCard, ProductPage, and category sorting (in-stock first).
- Client Diaries section: featured "Celebrity Spotted" editorial card + Our Events 3-col grid + Client Reviews 4-col mosaic.
- Branded transactional emails: brand-mark PNG header on every email, per-line product thumbnails in order confirmation and admin notification.
- Sign-in hydration with cross-account-leak guards (owner-tagged cart/wishlist in localStorage).
- Cross-device cart sync via `user_carts` JSONB blob.
- International pricing visibility throughout the journey.
- Promo codes (WELCOME10) with first-order enforcement.
- Standalone HTML policy pages for OAuth crawler + non-JS clients.
- Vercel manualChunks for vendor/supabase split.
- Sticky header with announcement bar + intl-pricing strip.
- Mobile-perf: paused carousel intervals when tab is hidden, hover-swap skipped on touch, intrinsic image dimensions to kill CLS.
- Robust sign-out that wipes local cart/wishlist synchronously while preserving DB rows for re-login.

## What's *not* in the codebase (don't assume)

- No tests, no Storybook, no CI config.
- No `tailwind.config.js` — Tailwind v4 inline via the Vite plugin.
- No URL-based routing — single-state router, no `pushState`, no Next.js / Astro / Remix yet.
- No phone-OTP authentication (intentionally removed due to TRAI/DLT registration burden).
- No COD payment method (intentionally removed from UI; column kept for legacy rows).
- No size-based exchanges (refund/exchange policy is damage-only, with mandatory unboxing video).
- No SSG/SSR — true crawler-rendered HTML would require a framework migration.
