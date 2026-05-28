"use client";

import { useEffect, useState } from "react";
import { MermaidChart } from "./MermaidChart";

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5
        bg-orange-500 hover:bg-orange-600 active:scale-95
        text-white text-sm font-semibold rounded-full shadow-lg
        transition-all duration-200
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M7 11V3M3 7l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      App Architecture
    </button>
  );
}

// ─── colour legend ────────────────────────────────────────────────────────────
const LAYER = {
  client:  "bg-orange-50 border-orange-300 text-orange-800",
  server:  "bg-blue-50  border-blue-300  text-blue-800",
  api:     "bg-green-50 border-green-300 text-green-800",
  service: "bg-violet-50 border-violet-300 text-violet-800",
  db:      "bg-gray-50  border-gray-300  text-gray-800",
};

const BADGE = {
  client:  "bg-orange-100 text-orange-700",
  server:  "bg-blue-100   text-blue-700",
  api:     "bg-green-100  text-green-700",
  service: "bg-violet-100 text-violet-700",
  db:      "bg-gray-100   text-gray-700",
};

// ─── data ─────────────────────────────────────────────────────────────────────

const FOLDER_TREE = [
  { indent: 0, path: "src/", note: "everything lives here" },
  { indent: 1, path: "app/", note: "Next.js App Router — pages + API routes" },
  { indent: 2, path: "api/menu/route.ts", badge: "api", note: "GET /api/menu → all products" },
  { indent: 2, path: "api/events/route.ts", badge: "api", note: "POST /api/events → persist cart event" },
  { indent: 2, path: "api/orders/route.ts", badge: "api", note: "POST /api/orders → place order" },
  { indent: 2, path: "api/orders/[orderId]/route.ts", badge: "api", note: "GET → fetch single order" },
  { indent: 2, path: "api/orders/[orderId]/timeline/route.ts", badge: "api", note: "GET → paginated event log" },
  { indent: 2, path: "menu/page.tsx", badge: "server", note: "Server Component — fetches DB, renders MenuGrid" },
  { indent: 2, path: "cart/page.tsx", badge: "server", note: "Server Component wrapper — exports metadata, renders CartView" },
  { indent: 2, path: "orders/[orderId]/page.tsx", badge: "server", note: "Server Component — resolves params, renders OrderView" },
  { indent: 2, path: "appinfo/page.tsx", badge: "server", note: "This page" },
  { indent: 1, path: "features/", note: "domain-scoped UI — each folder = one feature" },
  { indent: 2, path: "menu/", note: "ProductCard, ModifierModal, ModifierGroup, MenuGrid, useMenu" },
  { indent: 2, path: "cart/", note: "CartView, CartItemRow, PricingBreakdown, cart.store (Zustand), useCartPricing" },
  { indent: 2, path: "orders/", note: "OrderView, OrderStatusBadge, useOrder (polling hook)" },
  { indent: 2, path: "timeline/", note: "TimelineList, TimelineEventCard, useTimeline (paginated)" },
  { indent: 1, path: "server/", note: "server-only — never imported by client components" },
  { indent: 2, path: "db/client.ts", badge: "db", note: "Prisma singleton (hot-reload safe)" },
  { indent: 2, path: "repositories/", badge: "db", note: "menu · order · timeline · idempotency — thin DB wrappers" },
  { indent: 2, path: "services/", badge: "service", note: "pricing · order · idempotency · validation — pure business logic" },
  { indent: 2, path: "events/emit.ts", badge: "service", note: "emitEvent() — payload size check, PII mask, then upsert" },
  { indent: 2, path: "events/mask-pii.ts", badge: "service", note: "strips emails + phone numbers before persisting" },
  { indent: 2, path: "lib/logger.ts", note: "structured JSON logger (server-side only)" },
  { indent: 1, path: "shared/", note: "isomorphic — safe to import on client or server" },
  { indent: 2, path: "types/", note: "Product · CartItem · Order · TimelineEvent (TypeScript interfaces)" },
  { indent: 2, path: "utils/money.ts", note: "formatCents() — single Intl.NumberFormat instance, reused" },
  { indent: 1, path: "components/NavBar.tsx", badge: "client", note: "sticky nav, reads cart item count from Zustand" },
];

const API_ENDPOINTS = [
  {
    method: "GET", path: "/api/menu",
    desc: "Returns all 7 products including modifier groups",
    request: "—",
    response: "{ products: Product[] }",
    notes: "Served from SQLite via MenuRepo; menu page fetches this server-side so the browser never calls it",
  },
  {
    method: "POST", path: "/api/events",
    desc: "Persists a single timeline event fired from the browser",
    request: "{ type, source, payload } + headers X-Correlation-Id, X-User-Id",
    response: "201 { ok: true }",
    notes: "orderId may be null for pre-checkout cart events. Payload capped at 16 KB; PII masked before write.",
  },
  {
    method: "POST", path: "/api/orders",
    desc: "Places an order; recalculates pricing server-side",
    request: "Header: Idempotency-Key  Body: { userId, items, correlationId }",
    response: "202 { orderId }",
    notes: "Validates required modifiers, recalculates pricing (ignores client totals), fires ORDER_PLACED + PRICING_CALCULATED events, starts async status simulation.",
  },
  {
    method: "GET", path: "/api/orders/:orderId",
    desc: "Fetches a single order with all its items",
    request: "—",
    response: "200 { order: Order } | 404",
    notes: "Polled every 3 s by useOrder() until status is DELIVERED or FAILED",
  },
  {
    method: "GET", path: "/api/orders/:orderId/timeline",
    desc: "Paginated append-only event log for an order",
    request: "Query: pageSize (max 50), cursor (eventId for keyset pagination)",
    response: "200 { events: TimelineEvent[], nextCursor: string|null }",
    notes: "Events sorted by timestamp ascending. cursor points to the last seen eventId.",
  },
];

const EVENTS = [
  { type: "CART_ITEM_ADDED",     source: "web",    when: "User clicks Add to Cart",              orderId: "null (pre-order)" },
  { type: "CART_ITEM_UPDATED",   source: "web",    when: "User edits modifiers on a cart item",   orderId: "null (pre-order)" },
  { type: "CART_ITEM_REMOVED",   source: "web",    when: "User removes item from cart",            orderId: "null (pre-order)" },
  { type: "PRICING_CALCULATED",  source: "api",    when: "POST /orders — server pricing run",      orderId: "set" },
  { type: "ORDER_PLACED",        source: "api",    when: "POST /orders — order row created",       orderId: "set" },
  { type: "ORDER_STATUS_CHANGED",source: "worker", when: "Async simulation step fires",            orderId: "set" },
  { type: "VALIDATION_FAILED",   source: "api",    when: "POST /orders — modifier rules violated", orderId: "null" },
];

const DB_SCHEMA_MERMAID = `
erDiagram
    Product {
        String id PK
        String name
        String description
        Int    basePriceInCents
        String category
        String modifierGroups  "JSON – ModifierGroup[]"
    }
    Order {
        String   id             PK
        String   userId
        String   correlationId
        String   status         "PENDING | CONFIRMED | PREPARING | READY | DELIVERED | FAILED"
        Int      subtotalCents
        Int      taxCents
        Int      serviceFeeCents
        Int      totalCents
        String   idempotencyKey "unique, nullable"
        DateTime createdAt
        DateTime updatedAt
    }
    OrderItem {
        String id               PK
        String orderId          FK
        String productId
        String name
        Int    basePriceInCents
        String modifiers        "JSON – SelectedModifier[]"
        Int    quantity
    }
    TimelineEvent {
        String   eventId        PK
        DateTime timestamp
        String   orderId        FK "nullable"
        String   userId
        String   type
        String   source         "web | api | worker"
        String   correlationId
        String   payload        "JSON – masked"
    }
    IdempotencyRecord {
        String   key            PK
        String   response       "JSON"
        DateTime expiresAt      "TTL 24 h"
        DateTime createdAt
    }
    Order ||--o{ OrderItem      : contains
    Order ||--o{ TimelineEvent  : logs
`;

const CHECKOUT_SEQUENCE_MERMAID = `
sequenceDiagram
    actor U as User
    participant B as Browser (Client)
    participant SC as Server Component
    participant API as API Route
    participant SVC as Service Layer
    participant DB as SQLite

    U->>B: opens /menu
    B->>SC: page request
    SC->>DB: MenuRepo.getAll()
    DB-->>SC: Product[]
    SC-->>B: HTML (server-rendered, no JS needed)

    U->>B: Customize → select protein → Add to Cart
    B->>B: useCartStore.addItem() (Zustand, localStorage)
    B-->>API: POST /api/events  CART_ITEM_ADDED
    API->>DB: TimelineRepo.upsert()

    U->>B: navigates to /cart → clicks Place Order
    B-->>API: POST /api/orders  Idempotency-Key header
    API->>SVC: validateOrderItems()
    API->>SVC: calculatePricing()
    API->>DB: OrderRepo.create()
    API->>DB: TimelineRepo.upsert() x2
    API-->>B: 202 { orderId }
    B->>B: clear cart, redirect /orders/orderId

    loop poll every 3 s until DELIVERED
        B-->>API: GET /api/orders/:id
        API->>DB: OrderRepo.findById()
        DB-->>API: Order
        API-->>B: { order }
        B->>B: update status badge
    end

    Note over API,DB: async setTimeout chain (fire-and-forget)
    DB-->>DB: PENDING→CONFIRMED→PREPARING→READY→DELIVERED
    DB-->>DB: TimelineRepo.upsert() ORDER_STATUS_CHANGED x4
`;

// ─── sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ id, emoji, title, sub }: { id: string; emoji: string; title: string; sub: string }) {
  return (
    <div id={id} className="pt-10 pb-4 border-b border-gray-200 mb-6 scroll-mt-16">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
        <span>{emoji}</span> {title}
      </h2>
      <p className="text-gray-500 mt-1 text-sm">{sub}</p>
    </div>
  );
}

type BadgeKey = keyof typeof BADGE;

function Badge({ kind, label }: { kind: BadgeKey; label?: string }) {
  return (
    <span className={`text-xs font-mono font-semibold px-1.5 py-0.5 rounded ${BADGE[kind]}`}>
      {label ?? kind}
    </span>
  );
}

function LayerBox({ kind, title, items }: { kind: BadgeKey; title: string; items: string[] }) {
  return (
    <div className={`border-2 rounded-xl p-4 ${LAYER[kind]}`}>
      <div className="flex items-center gap-2 mb-3">
        <Badge kind={kind} />
        <span className="font-bold text-sm">{title}</span>
      </div>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item} className="text-xs font-mono bg-white/60 rounded px-2 py-0.5">{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex justify-center items-center my-1">
      <div className="flex flex-col items-center">
        <div className="w-px h-4 bg-gray-400" />
        <div className="size-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-400" />
      </div>
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET:  "bg-blue-100 text-blue-700",
    POST: "bg-green-100 text-green-700",
  };
  return (
    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${colors[method] ?? "bg-gray-100 text-gray-700"}`}>
      {method}
    </span>
  );
}

// ─── main view ────────────────────────────────────────────────────────────────

export function AppInfoView() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggle = (key: string) => setOpenSection((prev) => (prev === key ? null : key));

  return (
    <div className="max-w-5xl mx-auto px-4 pb-20">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="py-10 border-b border-gray-200 mb-2">
        <h1 className="text-4xl font-black text-gray-900">App Architecture</h1>
        <p className="text-gray-500 mt-2 max-w-2xl">
          A complete reference for the Restaurant Ordering app: every layer from SQLite to React,
          with diagrams, file trees, API contracts, and data models.
        </p>

        {/* nav pills */}
        <nav className="flex flex-wrap gap-2 mt-6" aria-label="Jump to section">
          {[
            ["#layers",    "Layers"],
            ["#files",     "Files"],
            ["#database",  "Database"],
            ["#checkout",  "Checkout flow"],
            ["#api",       "API"],
            ["#frontend",  "Frontend"],
            ["#events",    "Events"],
            ["#state",     "State"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="text-sm font-medium px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-orange-400 hover:text-orange-600 transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 my-6">
        {(Object.keys(BADGE) as BadgeKey[]).map((k) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-sm border ${LAYER[k]}`} />
            <span className="text-xs text-gray-500 capitalize">{k}</span>
          </div>
        ))}
      </div>

      {/* ── 1. Architecture layers ────────────────────────────────────────── */}
      <SectionHeader id="layers" emoji="🏗" title="Architecture Layers"
        sub="How a request travels from the browser all the way to SQLite and back." />

      <div className="max-w-lg mx-auto">
        <LayerBox kind="client" title="Browser — React Client Components"
          items={[
            "MenuGrid  ProductCard  ModifierModal",
            "CartView  CartItemRow  PricingBreakdown",
            "OrderView  TimelineList  TimelineEventCard",
            "NavBar  (reads Zustand cart store)",
          ]} />
        <Arrow />
        <LayerBox kind="server" title="Next.js Server Components  (no JS sent to browser)"
          items={[
            "menu/page.tsx  — fetches DB directly",
            "cart/page.tsx  — server wrapper + metadata",
            "orders/[orderId]/page.tsx  — resolves params",
          ]} />
        <Arrow />
        <LayerBox kind="api" title="API Route Handlers  (Next.js edge-compatible)"
          items={[
            "GET  /api/menu",
            "POST /api/events",
            "POST /api/orders",
            "GET  /api/orders/:id",
            "GET  /api/orders/:id/timeline",
          ]} />
        <Arrow />
        <LayerBox kind="service" title="Service Layer  (pure business logic)"
          items={[
            "pricing.service  — integer-cent math, tax, fee",
            "validation.service  — required modifier checks",
            "idempotency.service  — withIdempotency() wrapper",
            "order.service  — async status simulation",
            "events/emit.ts  — 16 KB guard + PII mask",
          ]} />
        <Arrow />
        <LayerBox kind="db" title="Repository Layer  (Prisma queries, no business logic)"
          items={[
            "menu.repo  order.repo  timeline.repo  idempotency.repo",
          ]} />
        <Arrow />
        <LayerBox kind="db" title="SQLite  (dev.db — Prisma 7 + better-sqlite3)"
          items={[
            "Product  Order  OrderItem  TimelineEvent  IdempotencyRecord",
          ]} />
      </div>

      {/* ── 2. File tree ─────────────────────────────────────────────────── */}
      <SectionHeader id="files" emoji="📁" title="Folder Structure"
        sub="Every file annotated with what it does and which layer it belongs to." />

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {FOLDER_TREE.map((row, i) => (
          <div
            key={row.path}
            className={`flex items-start gap-3 px-4 py-1.5 text-sm font-mono border-b border-gray-50 last:border-0
              ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
            style={{ paddingLeft: `${row.indent * 20 + 16}px` }}
          >
            <span className="text-gray-700 shrink-0">{row.path}</span>
            {row.badge && <Badge kind={row.badge as BadgeKey} />}
            <span className="text-gray-400 text-xs mt-0.5 font-sans">{row.note}</span>
          </div>
        ))}
      </div>

      {/* ── 3. Database ──────────────────────────────────────────────────── */}
      <SectionHeader id="database" emoji="🗄" title="Database Schema"
        sub="Five tables in SQLite, managed by Prisma 7. JSON columns store complex nested data as strings." />

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {[
          { name: "Product", pk: "id (string)", cols: ["name, description, category", "basePriceInCents (Int)", "modifierGroups (JSON string)"], note: "Populated once by npm run seed. ModifierGroups stored as JSON because nesting depth varies per product." },
          { name: "Order", pk: "id (uuid)", cols: ["userId, correlationId, status", "subtotalCents, taxCents, serviceFeeCents, totalCents", "idempotencyKey (unique, nullable)", "createdAt, updatedAt"], note: "Pricing stored as flat ints (cents). correlationId links the order back to its pre-order cart events." },
          { name: "OrderItem", pk: "id (uuid)", cols: ["orderId (FK → Order)", "productId, name, basePriceInCents", "modifiers (JSON string)", "quantity (Int)"], note: "Snapshot of what was in the cart at checkout. modifiers is a frozen JSON array — never mutated." },
          { name: "TimelineEvent", pk: "eventId (caller-supplied)", cols: ["timestamp (DateTime)", "orderId (nullable FK)", "userId, type, source, correlationId", "payload (JSON string, PII masked)"], note: "Append-only. Caller provides eventId so re-delivered events are silently ignored (upsert with $setOnInsert / update: {})." },
          { name: "IdempotencyRecord", pk: "key (string)", cols: ["response (JSON string)", "expiresAt (TTL 24 h)", "createdAt"], note: "No native TTL in SQLite — expiresAt is checked on every read. A cron job or restart clears stale rows." },
        ].map((table) => (
          <div key={table.name} className={`border-2 rounded-xl p-4 ${LAYER.db}`}>
            <div className="flex items-center gap-2 mb-2">
              <Badge kind="db" label="table" />
              <span className="font-bold font-mono text-sm">{table.name}</span>
              <span className="text-xs text-gray-400 font-mono ml-auto">PK: {table.pk}</span>
            </div>
            <ul className="space-y-0.5 mb-3">
              {table.cols.map((c) => (
                <li key={c} className="text-xs font-mono bg-white/70 rounded px-2 py-0.5">{c}</li>
              ))}
            </ul>
            <p className="text-xs text-gray-500">{table.note}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <p className="text-sm font-semibold text-gray-600 mb-4">Entity Relationship Diagram</p>
        <MermaidChart chart={DB_SCHEMA_MERMAID} />
      </div>

      {/* ── 4. Checkout flow ─────────────────────────────────────────────── */}
      <SectionHeader id="checkout" emoji="🔄" title="Request Lifecycle — Checkout"
        sub="End-to-end sequence: browse menu → add to cart → place order → watch status update." />

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <MermaidChart chart={CHECKOUT_SEQUENCE_MERMAID} />
      </div>

      <div className="mt-4 grid sm:grid-cols-3 gap-3">
        {[
          { title: "correlationId", desc: "Generated once when the Zustand store is initialised. Attached to every cart event and the POST /orders body — links pre-order cart events to the final order in the timeline." },
          { title: "Server-side pricing", desc: "The browser calculates a live price preview, but the server recalculates everything from scratch on POST /orders and discards the client total. Prevents price tampering." },
          { title: "Idempotency", desc: "The cart page generates a one-time UUID as the Idempotency-Key header. If the user double-submits or a network retry fires, the second call returns the cached orderId with no duplicate order created." },
        ].map((card) => (
          <div key={card.title} className={`border-2 rounded-xl p-4 ${LAYER.service}`}>
            <p className="font-bold text-sm mb-1">{card.title}</p>
            <p className="text-xs text-gray-600 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* ── 5. API reference ─────────────────────────────────────────────── */}
      <SectionHeader id="api" emoji="🔌" title="API Reference"
        sub="All five route handlers. Every endpoint validates input with Zod before touching the database." />

      <div className="space-y-3">
        {API_ENDPOINTS.map((ep) => {
          const key = `${ep.method}-${ep.path}`;
          const isOpen = openSection === key;
          return (
            <div key={key} className={`border-2 rounded-xl overflow-hidden ${LAYER.api}`}>
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-green-100/50 transition-colors"
                onClick={() => toggle(key)}
              >
                <MethodBadge method={ep.method} />
                <code className="text-sm font-mono text-gray-800">{ep.path}</code>
                <span className="text-sm text-gray-500 ml-2 hidden sm:block">{ep.desc}</span>
                <span className="ml-auto text-gray-400">{isOpen ? "▲" : "▼"}</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 grid sm:grid-cols-3 gap-4 border-t border-green-200 pt-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Request</p>
                    <p className="text-xs font-mono text-gray-700 bg-white/70 rounded p-2">{ep.request}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Response</p>
                    <p className="text-xs font-mono text-gray-700 bg-white/70 rounded p-2">{ep.response}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Notes</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{ep.notes}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 6. Frontend components ───────────────────────────────────────── */}
      <SectionHeader id="frontend" emoji="⚛️" title="Frontend Component Map"
        sub="Server Components run zero JS in the browser. Client Components add interactivity." />

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Server */}
        <div className={`border-2 rounded-xl p-5 ${LAYER.server}`}>
          <div className="flex items-center gap-2 mb-4">
            <Badge kind="server" label="Server Component" />
            <span className="text-xs text-gray-500">no JS shipped, can query DB directly</span>
          </div>
          {[
            { name: "menu/page.tsx", note: "Calls MenuRepo.getAll() at render time. Passes products[] as props to MenuGrid." },
            { name: "cart/page.tsx", note: "Thin wrapper that exports metadata and renders <CartView />." },
            { name: "orders/[orderId]/page.tsx", note: "Awaits params, renders <OrderView orderId={id} />." },
          ].map((c) => (
            <div key={c.name} className="mb-3 bg-white/60 rounded-lg p-3">
              <p className="font-mono text-xs font-bold text-blue-700">{c.name}</p>
              <p className="text-xs text-gray-600 mt-1">{c.note}</p>
            </div>
          ))}
        </div>

        {/* Client */}
        <div className={`border-2 rounded-xl p-5 ${LAYER.client}`}>
          <div className="flex items-center gap-2 mb-4">
            <Badge kind="client" label="Client Component" />
            <span className="text-xs text-gray-500">&apos;use client&apos;: interactive, hooks allowed</span>
          </div>
          {[
            { name: "MenuGrid + ProductCard", note: "Renders product grid. ProductCard fires POST /api/events on Add to Cart." },
            { name: "ModifierModal", note: "Native <dialog> element. Radio for single-select groups, checkbox for multi-select. Blocks confirm until all required groups are filled." },
            { name: "CartView + CartItemRow", note: "Reads Zustand store. CartItemRow has inline quantity stepper and fires CART_ITEM_UPDATED / REMOVED events." },
            { name: "OrderView", note: "Polls GET /api/orders/:id every 3 s (useOrder hook) until terminal status. Renders TimelineList." },
            { name: "TimelineList + TimelineEventCard", note: "Fetches paginated timeline. Each card expand/collapses to show raw payload JSON." },
            { name: "NavBar", note: "Sticky. Reads item count from Zustand so the cart badge updates without a page reload." },
          ].map((c) => (
            <div key={c.name} className="mb-3 bg-white/60 rounded-lg p-3">
              <p className="font-mono text-xs font-bold text-orange-700">{c.name}</p>
              <p className="text-xs text-gray-600 mt-1">{c.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 7. Event system ──────────────────────────────────────────────── */}
      <SectionHeader id="events" emoji="📡" title="Event System"
        sub="Seven event types flow through a single POST /api/events endpoint into the TimelineEvent table." />

      <div className="overflow-x-auto rounded-2xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {["Event type", "Source", "Fired when", "orderId"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EVENTS.map((ev, i) => (
              <tr key={ev.type} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                <td className="px-4 py-2.5">
                  <code className={`text-xs font-mono font-bold px-2 py-0.5 rounded
                    ${ev.source === "web" ? BADGE.client : ev.source === "worker" ? BADGE.service : BADGE.api}`}>
                    {ev.type}
                  </code>
                </td>
                <td className="px-4 py-2.5">
                  <Badge
                    kind={ev.source === "web" ? "client" : ev.source === "worker" ? "service" : "api"}
                    label={ev.source}
                  />
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-600">{ev.when}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{ev.orderId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        <div className={`border-2 rounded-xl p-4 ${LAYER.service}`}>
          <p className="font-bold text-sm mb-1">Deduplication</p>
          <p className="text-xs text-gray-600">Each event has a server-generated <code className="font-mono">eventId</code> (UUID). The repository uses an <code className="font-mono">upsert</code> that only inserts when the eventId is new and ignores duplicates. Re-delivering the same event is safe.</p>
        </div>
        <div className={`border-2 rounded-xl p-4 ${LAYER.service}`}>
          <p className="font-bold text-sm mb-1">PII Masking</p>
          <p className="text-xs text-gray-600"><code className="font-mono">mask-pii.ts</code> runs on every payload before it is written. Regex patterns strip email addresses and US phone numbers. The raw user data never reaches the database.</p>
        </div>
      </div>

      {/* ── 8. State management ──────────────────────────────────────────── */}
      <SectionHeader id="state" emoji="🧠" title="Client State — Zustand Cart Store"
        sub="One store, persisted to localStorage. No Provider, no reducers, no boilerplate." />

      <div className={`border-2 rounded-xl p-6 ${LAYER.client}`}>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">State shape</p>
            <div className="space-y-2">
              {[
                { field: "items: CartItem[]", note: "Array of items in the cart. Persisted to localStorage under the key cart-store." },
                { field: "correlationId: string", note: "UUID created when the store is first initialised (or after clear()). Links all cart events to the eventual order." },
              ].map((f) => (
                <div key={f.field} className="bg-white/60 rounded-lg p-3">
                  <code className="text-xs font-mono font-bold text-orange-700 block mb-1">{f.field}</code>
                  <p className="text-xs text-gray-600">{f.note}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Actions</p>
            <div className="space-y-2">
              {[
                { action: "addItem(item)", note: "Generates a new cartItemId (UUID), appends to items[]." },
                { action: "updateItem(id, patch)", note: "Merges patch into the matching item. Used by the edit-modifiers flow." },
                { action: "removeItem(id)", note: "Filters out the item by cartItemId." },
                { action: "clear()", note: "Empties items[] and regenerates correlationId — ready for the next checkout." },
              ].map((a) => (
                <div key={a.action} className="bg-white/60 rounded-lg p-3">
                  <code className="text-xs font-mono font-bold text-orange-700 block mb-1">{a.action}</code>
                  <p className="text-xs text-gray-600">{a.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-orange-200 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Derived state: useCartPricing()</p>
          <p className="text-xs text-gray-600">
            This hook reads <code className="font-mono">items</code> and computes subtotal/tax/fee/total on every render.
            It is <strong>not stored</strong> in the Zustand slice; stored pricing would go stale if an item&apos;s quantity changes.
            The server always recalculates on checkout regardless.
          </p>
        </div>
      </div>

      {/* ── footer ───────────────────────────────────────────────────────── */}
      <div className="mt-16 pt-8 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400">
          Next.js 16 · React 19 · TypeScript · Prisma 7 · SQLite · Zustand · Zod · Tailwind v4 · Vitest
        </p>
      </div>

      <ScrollToTopButton />
    </div>
  );
}
