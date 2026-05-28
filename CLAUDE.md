# CLAUDE.md

Source of truth for the **Restaurant Ordering** app. Read this first — it should let you make any change without grepping the codebase.

---

## 1. Golden Rules (behavior)

These override speed. For trivial tasks use judgment, but never silently.

### 1.1 Think before coding
- State assumptions explicitly. If uncertain, **ask**.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.

### 1.2 Simplicity first
- Minimum code that solves the problem. Nothing speculative.
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If a senior engineer would call it overcomplicated, simplify.

### 1.3 Surgical changes
- Touch only what you must. Clean up only your own mess.
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.
- Remove imports/variables your changes orphaned; leave pre-existing dead code alone.

### 1.4 Goal-driven execution
Define success criteria. Loop until verified.
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan: `step → verify`.

### 1.5 Verify before reporting done
- `npm run type-check` must pass.
- `npm run lint` must pass.
- `npm test` must pass.
- For UI changes, also `npm run dev` and exercise the path in the browser.

---

## 2. Tech Stack

| Layer | Tech | Notes |
|---|---|---|
| Framework | **Next.js 16.2.6** (App Router) | ⚠ Breaking changes vs older versions — see §11 |
| Runtime | React **19.2.4** | Server Components default; `"use client"` only when needed |
| Language | TypeScript 5, `strict: true` | Path alias `@/*` → `src/*` |
| Styling | **Tailwind v4** via `@tailwindcss/postcss` | No `tailwind.config.*` file — config is in `globals.css` |
| DB | **SQLite** via Prisma 7 + `@prisma/adapter-better-sqlite3` | File `dev.db` at repo root |
| ORM | Prisma 7 (generated client at `src/generated/prisma`) | Driver adapter pattern — see §6 |
| State (client) | **Zustand 5** with `persist` middleware | Cart only; everything else is server-fetched |
| Validation | **Zod v4** (imported from `zod/v4`) | API boundaries only |
| Tests | Vitest 4 + jsdom + Testing Library | `__tests__/` at repo root |
| Lint | ESLint 9 (flat config) + `eslint-config-next` | Excludes `src/generated/**` |

Scripts (`package.json`):
```
dev          next dev
build        next build
start        next start
lint         eslint src
type-check   tsc --noEmit
seed         tsx scripts/seed.ts
db:push      prisma db push
db:studio    prisma studio
test         vitest run
test:watch   vitest
postinstall  prisma generate
```

---

## 3. Project Layout

```
RestaurantOrdering/
├── prisma/
│   └── schema.prisma              # DB models (sqlite)
├── scripts/
│   └── seed.ts                    # Seeds Product rows
├── __tests__/
│   ├── unit/                      # Pure logic tests (no DB)
│   └── integration/               # Full checkout flow
├── src/
│   ├── app/                       # Next.js App Router (routes & layouts)
│   │   ├── layout.tsx             # Root layout + NavBar
│   │   ├── page.tsx               # / → redirects to /menu
│   │   ├── globals.css            # Tailwind v4 import + body styles
│   │   ├── menu/page.tsx          # RSC: fetches menu via MenuRepo
│   │   ├── cart/page.tsx          # Renders <CartView/>
│   │   ├── orders/[orderId]/page.tsx
│   │   ├── appinfo/               # In-app architecture explorer (Mermaid)
│   │   └── api/
│   │       ├── menu/route.ts            GET    list products
│   │       ├── orders/route.ts          POST   place order (idempotent)
│   │       ├── orders/[orderId]/route.ts
│   │       │                            GET    fetch one order
│   │       ├── orders/[orderId]/timeline/route.ts
│   │       │                            GET    paginated events for order
│   │       └── events/route.ts          POST   emit a client event
│   ├── components/
│   │   └── NavBar.tsx             # Global navbar (reads cart count)
│   ├── features/                  # Vertical feature modules — see §4
│   │   ├── menu/
│   │   ├── cart/
│   │   ├── orders/
│   │   └── timeline/
│   ├── server/                    # Server-only code (never imported by client)
│   │   ├── db/client.ts           # Prisma client (singleton, HMR-safe)
│   │   ├── lib/logger.ts          # JSON line logger
│   │   ├── events/
│   │   │   ├── emit.ts            # emitEvent() — masks PII, writes via TimelineRepo
│   │   │   └── mask-pii.ts        # Email + phone regex masking
│   │   ├── repositories/          # DB I/O — pure data access, no business logic
│   │   │   ├── menu.repo.ts
│   │   │   ├── order.repo.ts
│   │   │   ├── timeline.repo.ts
│   │   │   └── idempotency.repo.ts
│   │   └── services/              # Business logic — orchestrates repos + events
│   │       ├── pricing.service.ts
│   │       ├── validation.service.ts
│   │       ├── idempotency.service.ts
│   │       └── order.service.ts   # Background status progression
│   ├── shared/                    # Isomorphic — types + pure utils
│   │   ├── types/                 # product, cart, order, timeline
│   │   └── utils/money.ts         # formatCents()
│   └── generated/prisma/          # ⚠ Auto-generated. Never edit. Excluded from ESLint.
└── dev.db                         # SQLite file (gitignored — created by db:push/seed)
```

### Directory rules
- **`src/server/**`** — server-only. Imports `node:crypto`, Prisma, `process.env`. Never import from a `"use client"` file.
- **`src/features/**`** — vertical slices. A feature owns its components, hooks, and store. Shared cross-feature types go in `src/shared/types`.
- **`src/shared/**`** — must be isomorphic (works server + client). No Node APIs, no React-DOM-only code.
- **`src/components/**`** — only truly global UI (e.g. `NavBar`). Anything feature-specific lives under `src/features/<feature>/components/`.
- **`src/generated/**`** — auto-generated by `prisma generate`. Excluded from lint. Never hand-edit.

---

## 4. Architecture Layers

```
 Browser (RSC + Client Components)
     │
     │  fetch / Server Action
     ▼
 app/api/**/route.ts   ← validate input (zod), call services, return JSON
     │
     ▼
 src/server/services   ← business logic (pricing, validation, idempotency, order flow)
     │
     ▼
 src/server/repositories  ← DB access (Prisma) — only place that touches `db`
     │
     ▼
 SQLite via @prisma/adapter-better-sqlite3
```

Side-channel: **events** are emitted from API routes and the worker via `emitEvent()` → `TimelineRepo.upsert()`. Always include a `correlationId`.

### Strict layering rules
- API routes **must not** call `db` directly — go through a repository.
- Services **must not** import from `app/` or `features/`.
- Repositories **must not** call services or emit events — they are pure I/O.
- Client components **must not** import from `src/server/**`.
- Events are emitted by API routes and services, **never** by repositories.

---

## 5. Database Schema (Prisma)

Source: `prisma/schema.prisma`. After edits run `npm run db:push` (dev) and `prisma generate` regenerates the client.

| Model | Purpose | Notes |
|---|---|---|
| `Product` | Menu item | `modifierGroups` stored as JSON string |
| `Order` | Placed order header | `idempotencyKey` is unique; status defaults to `"PENDING"` |
| `OrderItem` | Order line item | `modifiers` is a JSON snapshot — **never mutate** after creation; `onDelete: Cascade` |
| `TimelineEvent` | Append-only event log | `eventId` is PK so re-deliveries are idempotent via upsert |
| `IdempotencyRecord` | Checkout dedup | `response` JSON, 24h TTL |

**Money:** every monetary value is `Int` cents, suffixed `Cents` in DB / `InCents` in code. **Never use floats.** Helper: `formatCents()` in `src/shared/utils/money.ts`.

**JSON-as-string columns:** `Product.modifierGroups`, `OrderItem.modifiers`, `TimelineEvent.payload`, `IdempotencyRecord.response`. Always `JSON.stringify` on write, `JSON.parse` on read inside the repository — never leak the raw string above the repo layer.

---

## 6. Prisma Client (singleton pattern)

`src/server/db/client.ts`:
- Resolves `DATABASE_URL` (e.g. `file:./dev.db`) to an absolute path.
- Wires the **better-sqlite3 driver adapter** — required by Prisma 7 for SQLite.
- Caches the client on `globalThis` in dev to survive Next.js HMR.

Import as `import { db } from "@/server/db/client"`. Never construct a second `PrismaClient`.

---

## 7. API Contracts

All routes are Next 16 App Router `route.ts` handlers. Dynamic params come from `ctx.params` and are `await`ed (Next 16 change).

### `GET /api/menu`
Response: `{ products: Product[] }`

### `POST /api/orders`
Headers: `Idempotency-Key: <uuid>` (required, 400 if missing)
Body (zod-validated):
```ts
{ userId: string, items: CartItem[] (min 1), correlationId: string }
```
Flow:
1. Parse + zod-validate body → 400 on failure.
2. Run `validateOrderItems` against products → 400 on failure (also emits `VALIDATION_FAILED`).
3. `withIdempotency(key, ...)` wraps order creation:
   - Generate `orderId`
   - `calculatePricing(items)`
   - `OrderRepo.create(...)`
   - Emit `ORDER_PLACED` and `PRICING_CALCULATED` in parallel
   - Fire-and-forget `simulateOrderProcessing(...)` background task
   - Return `{ orderId }`
4. Respond `202` with `{ orderId }` (whether from cache or fresh).

### `GET /api/orders/[orderId]`
Response: `{ order: Order }` or `{ error }` 404.

### `GET /api/orders/[orderId]/timeline`
Query: `pageSize` (default 20, max 50) and `cursor` (eventId).
Response: `{ events: TimelineEvent[], nextCursor: string | null }`
Pagination is cursor-based on `timestamp` — `TimelineRepo.getByOrder` fetches `pageSize+1` to detect more pages.

### `POST /api/events`
Headers: `X-Correlation-Id`, `X-User-Id` (required, fallback to body fields).
Body: `{ type, source?, orderId?, payload? }`
Calls `emitEvent` (which masks PII and caps payload at 16 KB). Returns 201 or 400.

---

## 8. Domain Types (`src/shared/types`)

### `product.ts`
```ts
ModifierOption { id, name, priceInCents }
ModifierGroup  { id, name, required, min, max, options[] }
Product        { id, name, description, basePriceInCents, category, imageUrl?, modifierGroups[] }
```

### `cart.ts`
```ts
SelectedModifier { groupId, optionId, name, priceInCents }
CartItem         { cartItemId, productId, name, basePriceInCents, modifiers[], quantity }
CartPricing      { subtotalInCents, taxInCents, serviceFeeInCents, totalInCents }
```

### `order.ts`
```ts
OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "DELIVERED" | "FAILED"
Order { orderId, userId, items[], pricing, status, createdAt, updatedAt }
```

### `timeline.ts`
```ts
EventType = "CART_ITEM_ADDED" | "CART_ITEM_UPDATED" | "CART_ITEM_REMOVED"
          | "PRICING_CALCULATED" | "ORDER_PLACED" | "ORDER_STATUS_CHANGED"
          | "VALIDATION_FAILED"
EventSource = "web" | "api" | "worker"
TimelineEvent { eventId, timestamp, orderId|null, userId, type, source, correlationId, payload }
```

When you add a new value to any of these unions, search for the type and update every exhaustive switch / map (status badge config, event color map, etc.).

---

## 9. Features Map

### `features/menu`
- `components/MenuGrid.tsx` — groups by category
- `components/ProductCard.tsx` — card UI, opens `ModifierModal` if product has modifiers, emits `CART_ITEM_ADDED`
- `components/ModifierModal.tsx` — uses native `<dialog>` with `showModal()`
- `components/ModifierGroup.tsx` — radio (max=1) or checkbox (max>1) UI
- `hooks/useMenu.ts` — client-side `GET /api/menu`

### `features/cart`
- `store/cart.store.ts` — Zustand store, **persisted** under `cart-store` key. Holds `items[]` + a session-stable `correlationId`. `clear()` resets correlationId.
- `hooks/useCartPricing.ts` — **client-side** pricing mirror of `pricing.service.ts` (server is authoritative; this is for live UI). Keep formulas in sync.
- `components/CartView.tsx` — main cart UI; checkout calls `POST /api/orders` with a fresh `Idempotency-Key` UUID.
- `components/CartItemRow.tsx` — qty controls, edit modifiers, remove. Emits `CART_ITEM_REMOVED` / `CART_ITEM_UPDATED`.
- `components/PricingBreakdown.tsx` — read-only totals.

### `features/orders`
- `hooks/useOrder.ts` — **polls** `GET /api/orders/[orderId]` every 3 s until `DELIVERED` or `FAILED`.
- `components/OrderView.tsx` — header, summary, embedded timeline.
- `components/OrderStatusBadge.tsx` — `STATUS_CONFIG` map (update when adding an `OrderStatus`).

### `features/timeline`
- `hooks/useTimeline.ts` — paginated fetch with `loadMore()` cursor.
- `components/TimelineList.tsx` — list + load-more button.
- `components/TimelineEventCard.tsx` — color per `EventType` via `EVENT_COLORS` (update when adding event types).

---

## 10. Key Conventions

### 10.1 Money
- Always integer cents. Suffix `InCents` in TS, `Cents` in DB.
- Format only at the leaf via `formatCents(n)`.
- Never round in code other than `Math.round(subtotal * TAX_RATE)` (in `pricing.service.ts`).

### 10.2 Idempotency
- Checkout requires `Idempotency-Key`. Client must generate one per checkout attempt (UUID).
- Server stores `{key → response}` for 24h via `IdempotencyRepo`.
- The wrapper `withIdempotency(key, fn)` returns `{ result, fromCache }`. Wrap any side-effectful retried action the same way.

### 10.3 Correlation IDs
- The cart's `correlationId` ties together every event from a single shopping session.
- Send it on every `POST /api/events` (header `X-Correlation-Id`) and on `POST /api/orders` (body field).
- Server-side worker (status progression) reuses the order's stored `correlationId`.

### 10.4 Events
- All client → event writes go through `POST /api/events`.
- All server → event writes go through `emitEvent(...)` directly.
- `emitEvent` (a) caps payload at 16 KB (throws `PAYLOAD_TOO_LARGE`), (b) masks PII via `maskPII`, (c) upserts on `eventId` (replay-safe).
- Payloads are masked for emails (`a***@domain`) and US-style phone numbers. If you add new PII categories, extend `mask-pii.ts` and add a test.

### 10.5 Validation
- API request shape → **Zod** (at the route boundary). Use `safeParse`, return 400 with `issues`.
- Business validation (e.g. required modifier groups) → `validation.service.ts`, returns `ValidationError[]`.

### 10.6 Logging
- Use `logger.info | warn | error` from `src/server/lib/logger.ts`. Emits structured JSON lines.
- Always include identifying context (orderId, eventId, userId) as the first arg object.

### 10.7 State management
- Client state belongs in Zustand **only for cart**. Everything else (orders, timeline, menu after first render) is server-fetched and lives in component state.
- Use the `persist` middleware sparingly; only `cart-store` is persisted today.

### 10.8 Server vs Client Components
- Default to Server Components. Add `"use client"` only when you need state, effects, browser APIs, or event handlers.
- Pages that just load and pass props can be RSC (`menu/page.tsx`, `orders/[orderId]/page.tsx`).
- API fetching inside a client component uses `useEffect` + native `fetch`; cancel on unmount with a `cancelled` flag.

### 10.9 Polling
- Order page polls every 3 s, stops at terminal status. Use the same `TERMINAL_STATUSES` pattern if you add more polling.
- Always clear the timer in the cleanup function.

### 10.10 Tailwind
- v4. **No `tailwind.config.*`** — config is via `@import "tailwindcss"` in `globals.css`.
- Brand color: `orange-500` / `orange-600` hover.
- Cards: `rounded-2xl border border-gray-100 bg-white`.
- Pills/badges: `rounded-full text-xs font-semibold px-2 py-0.5`.

### 10.11 Naming
- Repositories: `XxxRepo` object literal with method functions (not classes).
- Services: lower-camelCase functions exported from `*.service.ts`.
- Hooks: `useXxx`.
- Components: `PascalCase` named exports.

---

## 11. Next.js 16 — what's different from your training data

- Route handler params are a `Promise` and must be `await`ed:
  ```ts
  export async function GET(_req: NextRequest, ctx: RouteContext<"/api/orders/[orderId]">) {
    const { orderId } = await ctx.params;
  }
  ```
- `RouteContext<"/path/[param]">` is a generated type — Next's TS plugin infers params from the path string.
- Page `params` and `searchParams` are also Promises (`const { orderId } = await params`).
- `next/font` is auto-applied; the Geist font is already wired in `layout.tsx` (no manual `Inter`/`Geist` import).
- ⚠ Always check `node_modules/next/dist/docs/` before assuming an older API still exists.

---

## 12. Environment Variables

`.env.example`:
```
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_MOCK_USER_ID=user-mock-001
TAX_RATE=0.08
SERVICE_FEE_CENTS=150
```
- `DATABASE_URL` — consumed by Prisma CLI (`prisma.config.ts`) and the runtime adapter.
- `NEXT_PUBLIC_*` is exposed to the browser. Don't put secrets here.
- `TAX_RATE` and `SERVICE_FEE_CENTS` are read by the **server** `pricing.service.ts`. The **client** `useCartPricing` has them hard-coded — keep both in sync if you change them.

---

## 13. Testing

- Runner: Vitest 4 + jsdom + `@testing-library/*`.
- Setup: `vitest.setup.ts` imports `@testing-library/jest-dom`.
- Layout:
  - `__tests__/unit/*.test.ts` — pricing, validation, mask-pii, idempotency, money, timeline, emit.
  - `__tests__/integration/checkout.test.ts` — exercises the full POST `/api/orders` path.
- Conventions:
  - Test business logic (services + utils) exhaustively; tests for components only where behavior is non-trivial.
  - When you add a new modifier rule, money formula, status, or event type → add a unit test in the same style.

Run a single test: `npx vitest run __tests__/unit/pricing.test.ts`.

---

## 14. Recipes (how to make changes)

### 14.1 Add a new page
1. Create `src/app/<route>/page.tsx`. Export `metadata` and the default component.
2. If the page is purely render-on-load, leave it as a Server Component and fetch data via a repository directly.
3. If it needs state or polling, render a `"use client"` view component from `features/<feature>/components/`.
4. Link to it from `NavBar.tsx` if it's part of the main nav.

### 14.2 Add a new feature module
1. Create `src/features/<name>/{components,hooks,store?}/`.
2. Cross-feature types go in `src/shared/types/<name>.ts`.
3. Server logic goes in `src/server/{services,repositories}/<name>.*.ts`.

### 14.3 Add a new API route
1. Create `src/app/api/<path>/route.ts`. Export `GET` / `POST` / etc.
2. For POST/PUT: parse JSON with `req.json()` inside try/catch (400 on parse failure), then `safeParse` with a Zod schema.
3. Call a service or repository — never `db` directly.
4. Return `NextResponse.json(payload, { status })`.
5. Add an integration test under `__tests__/integration/`.

### 14.4 Add a new domain type
1. Define interface in `src/shared/types/<file>.ts`.
2. If it gets persisted, add a Prisma model in `prisma/schema.prisma`, run `npm run db:push`, then `prisma generate` (or just reinstall — `postinstall` runs it).
3. Add a repository in `src/server/repositories/` that maps DB row ↔ shared type (handle JSON-as-string columns at this boundary).

### 14.5 Add a new event type
1. Add the literal to `EventType` in `src/shared/types/timeline.ts`.
2. Update `EVENT_COLORS` in `TimelineEventCard.tsx`.
3. Emit it from the appropriate layer: server → `emitEvent`, client → `POST /api/events`.
4. Add a unit test verifying it round-trips (and that PII is masked if applicable).

### 14.6 Add a new order status
1. Extend the `OrderStatus` union in `src/shared/types/order.ts`.
2. Add an entry to `STATUS_CONFIG` in `OrderStatusBadge.tsx`.
3. If terminal, add to `TERMINAL_STATUSES` in `useOrder.ts` so polling stops.
4. If part of automatic progression, append to `STATUS_FLOW` in `order.service.ts`.

### 14.7 Add a new product or category
1. Append to `scripts/seed.ts`.
2. Run `npm run seed`.
3. If it's a new category, optionally add a color in `CATEGORY_COLORS` (in `ProductCard.tsx`) — falls back to gray if missing.

### 14.8 Add a new server service
1. Create `src/server/services/<name>.service.ts`. Export functions, not a class.
2. Services orchestrate repositories + events; they never import from `features/` or `app/`.
3. Unit test with mocked repositories or against the real `db` if the test is in `__tests__/integration/`.

### 14.9 Add a new repository method
1. Add the function to the existing `XxxRepo` object literal.
2. Convert all JSON-string columns at this boundary.
3. Map `null` ↔ `undefined` for optional fields when needed.

### 14.10 Change pricing rules
1. Update `pricing.service.ts` (server, authoritative).
2. Update `useCartPricing.ts` (client mirror) — keep formulas identical.
3. Update `__tests__/unit/pricing.test.ts`.
4. If exposing new fields, extend `CartPricing` in `src/shared/types/cart.ts` and update `PricingBreakdown.tsx`.

### 14.11 Add a new global UI element
- If shared by every page → `src/components/`.
- If used by one feature → `src/features/<feature>/components/`.

---

## 15. Pitfalls / Gotchas

- **JSON columns** — never let raw JSON strings escape a repository. Always parse on read, stringify on write.
- **Client/server pricing drift** — `useCartPricing` is a mirror of `pricing.service`. The server result is authoritative; the client value is only for live UI.
- **`Idempotency-Key`** — required on `POST /api/orders`. The client generates one per checkout attempt (`uuid()` in `CartView`).
- **PII** — anything written through `emitEvent` is auto-masked. If you log directly via `logger`, you are responsible for masking.
- **Payload size** — events fail with `PAYLOAD_TOO_LARGE` over 16 KB; keep event payloads small.
- **HMR & Prisma** — the `globalCache._db` pattern is mandatory; don't bypass it.
- **Generated client** — `src/generated/prisma/**` is regenerated by `postinstall`. Never edit; never import partially (use the top-level files).
- **Next 16 params** — always `await ctx.params` / `await params` in route handlers and pages.
- **Tailwind v4** — no `tailwind.config.*`. Configure tokens via CSS, not JS.
- **Zod import** — use `zod/v4` subpath (project pins v4 API), not `"zod"` root.
- **Worker is in-process** — `simulateOrderProcessing` is fire-and-forget `setTimeout`. Status progression is **lost on server restart**. Don't rely on it for anything beyond demo behavior.

---

## 16. When in doubt

- Code reuse > new abstraction.
- Server Component > Client Component.
- Repository > inline `db` call.
- Zod at the boundary > defensive checks deep in services.
- Integer cents > anything floating point.
- Ask before adding a dependency.
