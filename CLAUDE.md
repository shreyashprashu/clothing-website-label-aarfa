# Label Aarfa — Project Guide for Claude

A premium ethnic-wear e-commerce SPA for **Label Aarfa**, a Delhi-based couture house (est. **2019**, tagline *"Fashion Redefined"*). The site sells handcrafted kurtas, coord sets, and stitched suits. Tone is editorial, slow-luxury, restrained — think *"slow couture"*, not fast fashion.

This is a **relaunch** of the existing labelaarfa.com — the brand is real, product imagery is hot-linked from the live site.

## Tech stack

- **React 19** + **Vite 8** (JSX, no TypeScript)
- **Tailwind CSS v4** via `@tailwindcss/vite` (utility classes + lots of inline `style={{}}` for exact brand colors)
- **lucide-react** for all icons (always `strokeWidth={1.2 – 1.5}` — thin, never bold)
- **Supabase** (`@supabase/supabase-js`) — auth + Postgres + RLS
- **Razorpay** (Razorpay Node SDK on server, Checkout JS on client) — payments
- **Resend** — transactional email
- **Vercel Functions** (`api/*.js`) as the backend
- ESLint flat config (`eslint.config.js`)
- Primary host is **Vercel**, base path `/`. The legacy GitHub Pages workflow (`npm run deploy`) is dead — repurpose or delete.

## Scripts

```bash
npm run dev       # local dev
npm run build     # production build → dist/
npm run preview   # preview built site
npm run lint      # eslint
npm run deploy    # gh-pages -d dist (runs predeploy → build)
```

## File layout

```
src/
  App.jsx            All React UI (single file by design — see below)
  lib/
    supabase.js      Browser Supabase client (anon key, RLS-bound)
    api.js           fetch wrappers for /api/* + Razorpay Checkout loader
  main.jsx           Entry
  index.css          @import "tailwindcss"
  App.css            Legacy Vite template CSS — unused, safe to delete

api/                 Vercel Serverless Functions (Node.js runtime, ESM)
  _lib/
    supabase.js      Server Supabase client (service_role, bypasses RLS)
    email.js         Resend helpers — sendOrderConfirmation, sendContactMessage
    products.js      Server-side product price source of truth (mirrors src/App.jsx PRODUCTS)
  orders/
    create.js        POST: validate items + Razorpay order create + DB insert
    verify.js        POST: HMAC verify Razorpay signature → mark order paid → send email
  webhooks/
    razorpay.js      POST: async events (payment.captured, payment.failed, refund.processed)
  contact.js         POST: contact form → DB row + Resend email to ADMIN_EMAIL
  newsletter.js      POST: upsert newsletter_subscribers row

supabase/
  schema.sql         Paste-into-SQL-Editor schema with tables, triggers, RLS

public/              Static assets — see table below

SETUP.md             Step-by-step setup for Supabase, Razorpay, Resend, Vercel env vars
.env.example         All env vars with notes on which are public (VITE_*) vs server-only
```

The React app lives in a **single file** ([src/App.jsx](src/App.jsx), ~1700 lines) — deliberate. Sections are demarcated by big banner comments:

```
PRODUCTS — product catalog (display data + IMG-prefixed paths)
PALETTE — colors documented inline
CONTEXT — AppCtx, AppProvider (cart, wishlist, nav, Supabase session sync, signOut)
SEO — applySeo(page), per-page title/meta/JSON-LD updates
HEADER, MOBILE MENU, HERO, PRODUCT CARD
HOMEPAGE SECTIONS (CategoryPreview, EditorialBanner, SaleStrip, ValueProps, Newsletter)
CATEGORY PAGE, PRODUCT PAGE
CART DRAWER, SEARCH OVERLAY, AUTH MODAL (real Supabase OTP)
WISHLIST, CHECKOUT (Razorpay + COD), ABOUT, CONTACT
FOOTER, TOAST, ROUTER + APP
```

Keep this single-file structure unless a section grows past ~300 lines and there's a real reason to extract. Backend code (`api/*`) and small client libs (`src/lib/*`) are *expected* to live outside `App.jsx`.

### Static assets in `public/`

| File | Purpose |
|---|---|
| [public/logo.svg](public/logo.svg) | Full brand logo — LA monogram + "Label Aarfa" wordmark + "Fashion redefined" tagline. Wine `#5C1A22` on transparent. Use on light surfaces. |
| [public/logo-mark.svg](public/logo-mark.svg) | LA monogram only (no text). Used in the header next to the wordmark and in the mobile drawer. Wine on transparent. |
| [public/favicon.svg](public/favicon.svg) | Inverted favicon — cream LA on a rounded wine square. Designed to read well in browser tabs at 16/32 px. |
| [public/robots.txt](public/robots.txt) | Allows main crawlers + all major LLM bots (GPTBot, ClaudeBot, anthropic-ai, PerplexityBot, Google-Extended, Applebot-Extended, CCBot, etc.). Disallows `/cart`, `/checkout`, `/account`, `/api/`. |
| [public/sitemap.xml](public/sitemap.xml) | Static sitemap listing collections, pages, and all 16 products. URLs assume the eventual SSG/SSR URL scheme (`/products/<slug>`, `/collections/<slug>`) — **these don't resolve in the current SPA**; the file is a head-start for the planned migration. |
| [public/llms.txt](public/llms.txt) | Markdown index for LLM crawlers (Jeremy Howard's emerging convention). Lists collections, featured products with prices, brand facts, policies. |

## Design language

The look is **"warm pearl + deep wine + antique gold on soft black"** — Indian couture editorial. Think Sabyasachi catalogue meets Aritzia website.

### Color palette (all in hex, used as inline styles, not Tailwind tokens)

| Role | Hex | Where used |
|---|---|---|
| `--bg-base` warm pearl | `#FBF8F3` | page background, header, mobile drawers |
| `--bg-soft` champagne | `#F6F0E5` | elevated surfaces, sale strip, sidebar filter panel |
| `--bg-card` white | `#FFFFFF` | product cards (white card on warm bg = "morphous lift") |
| `--bg-cream` | `#EFE6D6` | secondary surfaces |
| `--ink` soft black | `#1F1A14` | all primary text, primary buttons, footer & dark sections |
| `--ink-soft` warm muted | `#6B5F4F` | body copy, secondary text |
| `--line` warm border | `#E8DDC9` | all borders/dividers (never pure gray) |
| `--accent` deep wine | `#7B1E28` | sale price, hover, eyebrow text, discount badges, selection highlight |
| `--gold` antique gold | `#B8924A` | dark-section accents (footer, editorial banner, newsletter), buy-now button |
| muted putty | `#A89888` | strikethrough/disabled prices |
| success green | `#2F6B3E` | "You save ₹X" |

**Never use** pure black `#000`, pure gray Tailwind tokens, or cool blues for chrome. Everything is warm.

### Typography

```
Display / headings: 'Cormorant Garamond', serif  (weights 300–600, italic available)
Body / UI:          'Inter', system-ui, sans-serif  (weights 300–700)
```

Loaded via Google Fonts inside a `<style>` block in `App()` ([src/App.jsx:1558](src/App.jsx)).

Conventions:
- **Headings** are always Cormorant, `fontWeight: 400` (not 700) — slim, editorial. Often use italic `<em>` for an accent word in the brand wine color.
- **Eyebrow labels** (e.g. "New Edit · 2026", "Fresh from the atelier"): tiny uppercase Inter, `tracking-[0.28em]` to `tracking-[0.32em]`, light weight, in wine `#7B1E28` or gold `#B8924A` on dark sections.
- **Buttons / nav links**: uppercase, `tracking-[0.22em]` to `tracking-[0.25em]`, font-light or font-medium, very small (11–12px).
- **Body copy**: Inter `font-light` (300), warm-muted color `#6B5F4F`, generous line-height.
- The brand wordmark "LABEL AARFA" is Cormorant 500, `tracking-[0.18em]`, often paired with a tiny gold/wine "Couture · Est. 2026" sub-line.

### Spacing & layout

- Max page width: `max-w-[1440px]` with horizontal padding `px-4 sm:px-6 lg:px-10`.
- Section vertical padding: `py-14 sm:py-20 lg:py-24` for major sections; `py-10 sm:py-14` for tighter ones.
- Grid: product grids are `grid-cols-2 lg:grid-cols-4` on home/sale and `grid-cols-2 lg:grid-cols-3` on category pages.
- Header is `sticky top-0 z-40`, three-column grid (`grid-cols-3`) with logo dead center.

### Corners, shadows, borders

- Border radius is **not a single token** — buttons/cards use `4px`, product cards and surfaces use `12px`, pill chips use `20px`, avatars/icon buttons use `50%`. Match neighboring elements when adding new UI.
- Shadows are soft and warm-toned, not flat black. The standard product-card hover lift: `0 12px 28px -10px rgba(31, 26, 20, 0.18)`. Resting: `0 2px 8px -2px rgba(31, 26, 20, 0.06)`.
- Borders are 1px, always color `#E8DDC9` on light surfaces, `rgba(246, 240, 229, 0.1–0.3)` on dark sections.

### Motion

Animations are defined in a `<style>` block at the bottom of `App()`. Use these utility classes — don't invent new ones casually:

```
animate-fadeIn       — 500ms ease-out
animate-slideUp      — 700ms cubic-bezier(0.22, 1, 0.36, 1)  ← hero text, toasts
animate-slideInRight — 380ms (cart drawer, filter sheet)
animate-slideInLeft  — 380ms (mobile menu)
animate-scaleIn      — 380ms (modals)
```

Hero crossfades on a 6.5s interval; announcement bar rotates messages every 4s. Image hover on product cards swaps to the second image over `1100ms`.

### Component patterns

- **ProductCard**: white card on warm background, hover swaps to second image, "Quick Add" reveals from below on desktop hover only, wishlist heart top-right, discount/new badge top-left.
- **Drawers** (cart, mobile menu, filters): full-height side panels over a `rgba(31, 26, 20, 0.55)` overlay. Cart and filters slide from right, menu from left.
- **Buttons**:
  - Primary: solid `#1F1A14` ink, white text, `borderRadius: '4px'`, uppercase tracked-out label.
  - Secondary: transparent with `1px solid #1F1A14` border, swaps to inverted on hover.
  - "Buy Now": gold `#B8924A` background with ink text — used only on PDP.
- **Forms**: white input on warm bg, `1px solid #E8DDC9`, 8px radius, focus border swaps to `#1F1A14` (handled by a global rule in the App-level `<style>` block).

## App architecture

- **Single Context** (`AppCtx`, `useApp()`) holds page, cart, wishlist, drawer/modal open states, user (Supabase `Session.user` or null), currency, toast, and `signOut()`. No Redux, no router library.
- **Routing** is a state-based switch in `Router()` — pages are `home | category | product | wishlist | checkout | about | contact`. `navigate(name, data)` scrolls top + closes mobile menu. URLs do not change on navigation.
- **Auth**: `AppProvider` hydrates the Supabase session on mount and subscribes to `onAuthStateChange`. Header User icon toggles between Sign-In (opens `AuthModal`) and Sign-Out (calls `signOut()`) based on `user`.
- **SEO updates** are driven imperatively by `applySeo(page)`, triggered by an effect on `page` change. It sets `document.title`, description/OG/Twitter/canonical meta tags, and injects/clears `Product` and `BreadcrumbList` JSON-LD blocks. Base `Organization`, `ClothingStore`, `WebSite` JSON-LD lives in [index.html](index.html).
- **Cart line key**: `${product.id}-${size}-${color}` ensures the same product in different sizes/colors lives as separate lines. Currently in React state only (no DB sync yet).
- **Multi-currency display only**: `CURRENCIES` map with INR base + rates; `formatPrice(inr, code)` is the single rendering helper. **Razorpay charges in INR**, regardless of what the user is viewing.
- **Product data** is hardcoded in the `PRODUCTS` array at the top of [src/App.jsx](src/App.jsx). Server-side pricing source of truth is [api/_lib/products.js](api/_lib/products.js) — keep these two in sync.

## Backend conventions

- **All money in paise** (INR × 100) once it crosses the API boundary. Display-only conversions happen client-side via `formatPrice`. Avoid floats.
- **Never trust client totals**. `api/orders/create` re-derives subtotal/shipping/total from `productById()` and the items it was sent. Client can be a stale browser or a hostile actor.
- **Server reads `process.env.*`, browser reads `import.meta.env.VITE_*`**. Only the `VITE_*` ones land in the client bundle.
  - Public-safe: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_RAZORPAY_KEY_ID`.
  - Server-only: `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RESEND_API_KEY`.
- **Razorpay flow** (`api/orders/create` → client opens Razorpay → `api/orders/verify`):
  1. Server creates a Razorpay Order + mirror row in `orders` (status `created`).
  2. Client opens Razorpay Checkout with the order id + key id from the server response.
  3. On `handler` callback, client POSTs the three razorpay_* fields to `/api/orders/verify`.
  4. Server HMAC-verifies signature, flips status to `paid`, fires confirmation email.
  5. Webhook (`api/webhooks/razorpay`) is a belt-and-braces backstop for `payment.captured` and async events. **Always idempotent.**
- **Webhooks need raw body** — `api/webhooks/razorpay.js` sets `config.api.bodyParser = false` and reads the raw stream to compute the HMAC. Don't `JSON.parse(req.body)` before verification.
- **RLS is on** for `profiles`, `addresses`, `orders`, `order_items`. Service role bypasses RLS — only use the service client from `api/_lib/supabase.js` server-side. Anon-key reads from the browser are limited to a user's own rows.
- **Errors**: API routes return `{ error: '...' }` with a non-2xx status. `src/lib/api.js` `post()` throws on non-OK, so callers can `try/catch` and `showToast(err.message)`.

## SEO conventions

The site is a client-rendered SPA — search bots that don't execute JS only see [index.html](index.html). To partially compensate:

1. **Baked-in head** ([index.html](index.html)): the homepage title, description, OG image, canonical, theme color, `Organization`, `ClothingStore`, and `WebSite` JSON-LD are all in the HTML at first byte. This is what GPTBot / ClaudeBot / Perplexity see if they don't execute JS.
2. **Per-page updates** via `applySeo` swap title/description/OG/canonical and add `Product` + `BreadcrumbList` JSON-LD when navigating to a product or category. Google with JS rendering picks these up.
3. **`llms.txt`** ([public/llms.txt](public/llms.txt)) gives LLM crawlers a static markdown index of products, brand facts, and prices — readable without JS.
4. **Known limitations** (not yet addressed):
   - URLs don't change on navigation (no `pushState`) — so social shares and bookmarks all point to `/`.
   - Sitemap URLs assume a future URL scheme that doesn't resolve today.
   - True SSG/SSR would require a Next.js / Astro / Remix migration. The TODO note in [public/sitemap.xml](public/sitemap.xml) and the SEO note in [index.html](index.html) anticipate this.

When adding a new page route, also update `applySeo` with its title, description, and canonical — otherwise it inherits the home-page meta.

## When making changes — tone & taste guardrails

1. **Don't make it louder.** This brand is quiet. Avoid bright primaries, heavy borders, big shadows, bold weights on headings, or chunky/rounded "fun" UI. If you find yourself reaching for `font-bold`, you probably want Cormorant at weight 400 instead.
2. **Stay in the palette.** Adding a new color means adding it to the palette comment in [src/App.jsx](src/App.jsx) and using it intentionally. Don't reach for default Tailwind grays/blues.
3. **Use the right "currency" of emphasis:** wine `#7B1E28` for sale/CTAs on light surfaces; gold `#B8924A` for accents on dark surfaces. Don't mix them.
4. **Icons stay thin.** `strokeWidth={1.2}` to `1.5`. Never `2`.
5. **Tracking on small uppercase text** — if you add a button or eyebrow label, give it `tracking-[0.18em]` to `tracking-[0.32em]` and `font-light` or `font-medium`. Untracked uppercase will look out of place.
6. **Match existing radii** (4 / 8 / 12 / 20 / 50%) — don't introduce a new one without reason.
7. **Mobile-first responsive.** Most components define both mobile and `sm:` / `lg:` variants for padding, font size, and grid columns. Maintain this — never assume desktop-only.
8. **Inline styles over Tailwind for brand colors.** The project already mixes Tailwind utilities for layout/typography with inline `style={{ color, backgroundColor, border }}` for exact hex values. Match that pattern — don't refactor to CSS variables unless asked.
9. **Single-file is intentional.** Don't preemptively split [src/App.jsx](src/App.jsx) into many small component files unless the user asks.
10. **Don't introduce TypeScript, a router library, or a state manager** without explicit ask.

## What's *not* in the codebase (don't assume)

- No backend / API — auth is OTP-simulated, checkout is form-only, cart is in-memory.
- No tests, no Storybook, no CI config.
- No `tailwind.config.js` — Tailwind v4 inline config via the Vite plugin, no theme extensions.
- No image optimization — images are remote URLs from labelaarfa.com.
