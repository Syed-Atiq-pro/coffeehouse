# Coffee House — Phase 1

Customer/staff auth + profile foundation for the coffee shop platform, built on React + TypeScript + Tailwind CSS v4 + Supabase.

## What's built so far

- Supabase project provisioned (Postgres DB, Auth, Row Level Security)
- Database schema: profiles, stores, products, customization options, orders, order items, loyalty transactions, rewards
- RLS policies: customers only see their own data; staff/admin see everything; catalog data is staff-write-only
- Sign up / Sign in / Sign out
- Protected dashboard showing profile, loyalty tier, points, spending

## Setup

```bash
npm install
cp .env.example .env   # already filled in for this project — see note below
npm run dev
```

The `.env` file already contains this project's live Supabase URL and anon key, so you can run it immediately. If you ever create a new Supabase project, update `.env` with the new values (find them in Supabase dashboard → Settings → API).

## Project structure

```
src/
  lib/supabase.ts        Supabase client setup
  contexts/AuthContext.tsx   Auth state, sign up/in/out, profile loading
  components/ProtectedRoute.tsx   Redirects to /login if not authenticated
  pages/Login.tsx
  pages/Signup.tsx
  pages/Dashboard.tsx
```

## Design tokens (in src/index.css @theme block)

- Espresso `#2A1810`, Cream `#F6EFE4`, Caramel `#B9793B`, Burgundy `#6B2A2A`, Sage `#7C8A6E`
- Fraunces (display/headlines) + Inter (body)

## What's NOT built yet (next phases)

- Menu browsing + drink customization + cart
- Order placement + real-time order tracking
- Digital customer card + QR generation/verification
- Payments (Razorpay) — needs your API keys, will be stubbed cleanly
- Email (Resend) — needs your API key
- Admin/staff dashboards
- Loyalty point awarding logic (schema exists, no business logic wired yet)

## Notes on cost

Everything here runs on Supabase's free tier. Payment and email providers (Razorpay, Resend) have their own free tiers for testing — we'll wire those in when you're ready and have accounts set up.

## Phase 2 — Menu, customization, cart

- Live menu pulled from Supabase: 6 categories, 11 products, size/milk/sweetness/topping customization
- Product customization modal with live price calculation
- Client-side cart (persists only for the session — Phase 3 will move it server-side at checkout)
- Cart page with quantity editing and line removal

### New files
```
src/lib/types.ts                Shared Product/Cart types
src/contexts/CartContext.tsx    Cart state: add/remove/quantity/subtotal
src/components/CustomizeModal.tsx  Drink customization UI
src/pages/Menu.tsx              Category tabs + product grid
src/pages/Cart.tsx              Cart review page
```

### What's NOT built yet
- Checkout is a disabled button — Phase 3 wires up order creation, price validation server-side, and payment
- Cart doesn't persist across page refresh yet (in-memory only)

## Phase 3 — Order placement + real-time tracking

- **Server-side pricing**: a Postgres function (`create_order`) re-computes every price from the database — it never trusts totals sent from the browser. This closes the "client can fake the price" hole.
- **Checkout page**: pickup time (ASAP or scheduled), order summary, places the order via RPC
- **Real-time order tracking**: subscribes to Postgres changes on the specific order — when staff (in a later phase) updates status, the customer's screen updates without a refresh
- **Order history**: list of past orders, tap through to tracking
- **Loyalty**: points awarded automatically (₹10 = 1 point) and reflected on the dashboard immediately

### Important: payment is mocked right now
Orders are marked `paid` immediately on creation — there's no real payment gateway wired in yet. This was a deliberate simplification so ordering + tracking could be built and tested end-to-end. When you're ready to add Razorpay:
1. You'll need a Razorpay account (free to create, take a few minutes to verify)
2. We'll change `create_order` to insert with `payment_status = 'pending'`, add a Razorpay checkout step, and verify payment via webhook before confirming

### New files
```
src/pages/Checkout.tsx        Pickup time + order summary + place order
src/pages/OrderTracking.tsx   Live status timeline via Supabase Realtime
src/pages/OrderHistory.tsx    List of past orders
```

### New database objects
```
create_order(store_id, pickup_time, items)   Security-definer function, server-side pricing
orders table added to realtime publication
```

### What's NOT built yet
- Real payment (Razorpay)
- Staff-side order dashboard (staff can't yet see/update incoming orders — that's Phase 5 per the original plan, or we can pull it forward if you want a demo of the full loop sooner)
- Digital customer card + QR
- Cancel-order flow

## Phase 4 — Staff order dashboard

- **Kanban-style board**: New → Confirmed → Preparing → Ready → Completed, with a Cancel option at any non-final stage
- **Live updates**: subscribes to all changes on the `orders` table — a new order placed by a customer appears on the staff board instantly, and any status change staff make is what powers the customer's real-time tracking page from Phase 3
- **Today's sales** total shown in the header
- Route `/staff` is gated by a new `StaffRoute` guard — customers are redirected to their own dashboard if they try to visit it

### How to test this (you'll need a staff account)

Sign up normally in the app first (this creates a `customer` profile), then promote that account to staff directly in the database:

```sql
update profiles set role = 'staff' where id = 'paste-your-user-id-here';
```

Find your user id in Supabase Dashboard → Authentication → Users, or run:
```sql
select id, full_name from profiles;
```

There's intentionally no in-app way for a customer to make themselves staff — that has to be a deliberate action by whoever owns the database.

### New files
```
src/components/StaffRoute.tsx   Route guard: staff/manager/admin only
src/pages/StaffOrders.tsx       Kanban board, live order feed, status controls
```

### What's NOT built yet
- Digital customer card + QR verification
- Inventory management (ingredient stock, auto-unavailable when out of stock)
- Admin analytics dashboard
- Real payment (Razorpay)
- Multi-store selection (currently assumes one store)

## Phase 5 — Digital customer card + QR verification

- **Customer card page** (`/card`): shows photo, name, member ID, loyalty tier, points, and a QR code — styled as an actual wallet-style card
- **Photo upload**: goes to a **private** Supabase Storage bucket (`avatars`), not public — only the owner and staff can view it (enforced by storage RLS, not just app logic)
- **QR code security**: encodes an opaque `qr_token` (random UUID), never the customer's real ID. Customers can regenerate it anytime (e.g. if they think someone screenshotted their card) — the old code stops working immediately
- **Download as PNG**: card renders to an image client-side and downloads — no server round-trip needed
- **Staff verification** (`/staff/verify`): staff enter/paste a scanned QR value, a security-definer function looks up the customer and returns only the fields needed to verify them (name, photo, tier, points) — it does not expose the full `profiles` table

### On camera scanning
This phase uses **manual entry** for the QR value (paste from any QR scanner app) rather than embedding a live camera scanner in the browser. That's a deliberate scope cut — live camera scanning is very doable next (via a library like `html5-qrcode`) but adds meaningful complexity (camera permissions, mobile Safari quirks) for a feature you can test correctly today by scanning with any phone's camera app and pasting the result.

### One manual action recommended (free, 1 click)
Supabase flagged that **leaked password protection** is off — this checks new passwords against known breached-password lists (via HaveIBeenPwned) at signup, for free. It's an Auth setting, not something a SQL migration can toggle. Turn it on here: Supabase Dashboard → your project → Authentication → Policies/Settings → "Leaked password protection".

### New database objects
```
profiles.qr_token, qr_token_updated_at    Opaque QR identifier, regeneratable
regenerate_qr_token()                     Customer can rotate their own token
staff_lookup_by_qr(token)                 Staff-only, minimal-exposure lookup
storage bucket: avatars (private)         Owner + staff read; owner-only write
```

### New files
```
src/components/PhotoUpload.tsx   Upload to private storage bucket
src/pages/CustomerCard.tsx       Card display, QR, download, regenerate
src/pages/StaffVerify.tsx        QR lookup for staff
```

### What's NOT built yet
- Live camera QR scanning (manual paste works now; camera scan is a follow-up)
- Identity verification / ID document upload (section 9 of original spec)
- Birthday automation, inventory management, admin analytics
- Real payment (Razorpay)

## Phase 6 — Identity verification

- Customers can upload an ID document (Government ID, Driving License, Passport, College ID, Other) via `/verify-identity`
- Documents go to a **private** storage bucket (`id-documents`) — file size capped at 8MB, JPG/PNG/PDF only
- **Even the customer who uploaded it can't read the file back** — only staff can. Customers only see their verification *status* (pending/verified/rejected), matching the "don't expose ID documents" requirement from the spec
- Staff review queue at `/staff/verification-queue`: view document (via short-lived signed URL, expires in 5 minutes), approve or reject with a reason
- Approving/rejecting automatically updates `profiles.identity_verified` via a database trigger — no app code needed to keep that flag in sync
- This flag is what birthday-reward eligibility will check against (Phase 7)

### New database objects
```
identity_verifications table (RLS: own-insert, own-or-staff-select, staff-update)
profiles.identity_verified boolean
sync_identity_verified_flag() trigger — auto-updates the flag on status change
storage bucket: id-documents (private, staff-read-only, 8MB cap, jpg/png/pdf only)
```

### New files
```
src/pages/IdentityVerification.tsx      Customer: upload + status
src/pages/StaffVerificationQueue.tsx    Staff: review, approve/reject
```

## Phase 7 — Birthday automation + in-app notifications

- **Daily scheduled job** (via `pg_cron`, runs at 00:05 server time): finds identity-verified customers whose birthday is today, creates a one-per-year reward, and drops a notification
- **Anti-abuse built in**: reward requires `identity_verified = true` (Phase 6), one reward per customer per calendar year (DB unique constraint), redemption is single-use and staff-gated
- **Redemption**: on the staff verify screen (`/staff/verify`), a birthday-eligible customer shows a "Redeem birthday reward" button — clicking it marks that year's reward used
- **Notifications page** (`/notifications`): customers see their birthday message (and this is the foundation for order-status and reward notifications later)

### Important: no real email/SMS yet
This is **in-app only** — no email/SMS is sent. Real email (Resend, per your original spec) needs an account and API key from you. Once you have that, the same `create_todays_birthday_rewards()` function is the right place to add an HTTP call via `pg_net` to trigger the email — the notification/reward logic doesn't need to change.

### New database objects
```
notifications table
birthday_rewards table (unique per customer per year)
create_todays_birthday_rewards()   scheduled daily via pg_cron
redeem_birthday_reward(customer_id)   staff-only, single-use
staff_lookup_by_qr — extended with identity_verified + birthday_reward_available
```

### New files
```
src/pages/Notifications.tsx   Customer notification list
```

## Phase 8 — Inventory management

- **Ingredients table**: 8 seeded ingredients (beans, milk, syrups, cups, etc.) with current/minimum quantity, supplier, cost
- **Recipe mapping** (`product_ingredients`): each drink is linked to what it consumes — e.g. a Cappuccino uses 18g beans, 150ml milk, 1 cup
- **Automatic deduction**: a database trigger (`trg_deduct_inventory`) fires on every order item — no app code has to remember to do this, so it can't be bypassed by a buggy frontend
- **Automatic "out of stock"**: separate from the staff-controlled `is_available` toggle — a product goes to `out_of_stock = true` the moment its recipe needs more of an ingredient than is on hand. `create_order` now blocks ordering anything out of stock, and the customer menu shows "Currently unavailable" instead of hiding the item (matches your original spec)
- **Staff inventory page** (`/staff/inventory`): stock status badges (In stock / Low stock / Out of stock), one-click restock, every change logged to `inventory_transactions`

### Verification note
I confirmed the trigger and its function are correctly installed and enabled, and validated the deduction arithmetic in an isolated rolled-back test — but I have not yet run a **real** order through the live app to watch stock drop end-to-end, since no customer account exists in the database yet. Recommended first real test once you sign up: order a Cappuccino, then check `/staff/inventory` — Espresso Beans, Whole Milk, and Cups should all have dropped by the recipe amount.

### New database objects
```
ingredients, product_ingredients, inventory_transactions tables
products.out_of_stock boolean (auto-computed, separate from staff-controlled is_available)
recompute_product_stock(product_id)
deduct_inventory_on_order()  — trigger on order_items insert
restock_ingredient(ingredient_id, amount, reason)  — staff-only
create_order — updated to also check out_of_stock
```

### New files
```
src/pages/StaffInventory.tsx   Stock levels, restock UI
```

## Phase 9 — Admin analytics dashboard

- **New role tier**: analytics are **manager/admin only**, not plain staff (cashiers/baristas can run orders and inventory but don't see revenue by default) — enforced by a new `is_admin()` check, separate from `is_staff()`
- `/admin/analytics`: revenue, order count, avg order value, new/active customers, low-stock count, a revenue-over-time line chart, top-5-products bar chart, and loyalty point/birthday-redemption stats
- Date range toggle: 7 / 30 / 90 days
- All figures come from security-definer SQL functions that check `is_admin()` internally — the numbers can't be queried by a customer or regular staff account even if they guessed the RPC endpoint

### New database objects
```
is_admin()                                    manager/admin only
admin_sales_summary(from, to)
admin_daily_sales(from, to)
admin_top_products(from, to, limit)
admin_loyalty_stats(from, to)
admin_low_stock_count()
```

### New files
```
src/components/AdminRoute.tsx   Manager/admin-only route guard
src/pages/AdminAnalytics.tsx    Dashboard with recharts visualizations
```

### Note on bundle size
Adding `recharts` grew the JS bundle noticeably (analytics page pulls in a charting library). It still works fine, but if load time on the customer-facing pages ever matters, the fix is lazy-loading the AdminAnalytics route with `React.lazy()` so customers never download chart code they don't need. Flagging this now rather than silently letting it grow across phases.

## Phase 10 — Everything except payments

Covers: bundle-size fix, promotions/coupons, gift cards, referrals, multi-store, PWA, live camera QR scanning.

### Bundle size fix
Every route is now lazy-loaded (`React.lazy` + `Suspense`). A customer's browser no longer downloads the analytics charting library, the QR camera scanner, or any staff/admin code — those only load when someone actually visits those routes. Main shared bundle dropped from ~890KB to ~448KB.

### Promotions & coupons
- Staff/admin create coupons at `/admin/promotions` (name, percent or fixed discount, minimum order)
- Customers apply a code at checkout — **discount is recalculated server-side** in `validate_coupon()`, never trusted from the browser
- Enforces: active window (start/end date), usage limit (total + per-customer), minimum order — all checked in the database, not just the UI

### Gift cards
- `/gift-cards`: purchase a card (₹1–₹10,000, presets at ₹200/500/1000/2000), get a shareable code
- Redeemable at checkout — balance is deducted server-side, atomically, capped at both the card's balance and the order total
- Payment for the gift card itself is mocked, same simplification as regular orders

### Referral program
- Every customer gets an auto-generated referral code (`/referrals`)
- New signups can enter a friend's code (optional field on the signup form)
- When the referred customer's **first order** completes, both people get 50 bonus points automatically — enforced by a database trigger watching `total_orders` flip from 0 to 1, so it can't be gamed by repeat orders or client-side timing
- **Known limitation**: if your Supabase project requires email confirmation before login, the referral code won't apply at signup time (no active session yet to call the RPC) — it fails silently rather than blocking signup. Worth testing once you have a real account.

### Multi-store
- 3 stores now seeded; customers pick one at checkout
- Staff/admin manage stores at `/admin/stores` (add, toggle active/inactive)
- Staff order dashboard still shows all orders regardless of store — a "filter by my store" feature would need staff-to-store assignment, which isn't built (flagging as a gap, not silently skipping it)

### PWA
- Installable as a home-screen app (manifest + service worker via `vite-plugin-pwa`)
- App shell is cached for fast repeat loads; **all Supabase API calls are explicitly set to network-only** — menu, orders, and stock data are never served stale from cache, since a cached "in stock" status could let someone order something unavailable
- Icons generated from a simple coffee-cup mark (192px, 512px, apple-touch-icon) — replace `public/icon.svg` with real branding whenever you have it

### Live camera QR scanning
- Staff verify screen (`/staff/verify`) now has a "Scan with camera" button using the device camera, falling back gracefully to the existing manual paste field if camera access fails or isn't available
- Uses `html5-qrcode`, lazy-loaded only when a staff member actually opens the scanner

### New database objects
```
promotions, coupons, coupon_redemptions tables
validate_coupon(code, subtotal) — server-side discount calculation
gift_cards table
purchase_gift_card(...), validate_gift_card(code)
referrals table, profiles.referral_code, profiles.referred_by
generate_referral_code(), apply_referral_code(code)
award_referral_bonus() — trigger on profiles, fires on first completed order
create_order — extended to accept coupon + gift card codes
3 stores seeded (was 1)
```

### New files
```
src/pages/AdminPromotions.tsx
src/pages/GiftCards.tsx
src/pages/Referrals.tsx
src/pages/AdminStores.tsx
src/components/QrScanner.tsx
public/icon.svg, icon-192.png, icon-512.png, apple-touch-icon.png
```

### What's genuinely still missing
- **Real payment (Razorpay)** — every "purchase" in this app (orders, gift cards) is mocked as instantly paid. This is the single biggest gap between this project and something you could actually charge real customers through. Needs your Razorpay account + API keys.
- **Real email/SMS** — notifications are in-app only (Resend integration point is documented in Phase 7)
- **Staff-to-store assignment** — all staff see all stores' orders
- **Full test suite** — none of this has automated tests yet (unit/integration/e2e, per your original spec's section 72)


## Product image pipeline

`products.image_url` is resolved by `src/lib/productImages.ts`. It supports complete browser URLs and Supabase Storage object paths. Storage paths are converted to short-lived signed URLs, with a public-URL fallback. Successful resolutions and in-flight requests are cached to avoid duplicate Storage calls.

Set `VITE_PRODUCT_IMAGE_BUCKET` when `image_url` contains a Storage path. The default is `product-images`.

## AI layer
The production AI layer uses a Vercel serverless endpoint at `/api/ai` and keeps `AI_GATEWAY_API_KEY` server-side. Set these Vercel environment variables for Production/Preview as needed:
- `AI_GATEWAY_API_KEY`
- `AI_MODEL` (optional)
- `SUPABASE_URL` (or existing `VITE_SUPABASE_URL`)
- `SUPABASE_ANON_KEY` (or existing `VITE_SUPABASE_ANON_KEY`)

Routes:
- `/ai` — authenticated AI Coffee Concierge grounded in the live catalog
- `/staff/copilot` — staff/manager/admin AI operations copilot

Never put an AI provider secret or Supabase service-role key in client-side `VITE_*` variables.
