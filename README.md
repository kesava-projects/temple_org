# Sri Venkateswara Temple Organization Portal

Production-ready web platform for the temple organization featuring public event discovery, admin event management, paid puja booking with Razorpay, OAuth 2.0 authentication with Better Auth, invite-only staff governance, and audit logging.

---

## 🛠 Fixed Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, strict mode TypeScript, Node LTS)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Form & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Database & ORM**: PostgreSQL + [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [Better Auth](https://www.better-auth.com/) with Prisma adapter + `admin`, `twoFactor` (TOTP), and `phoneNumber` (OTP) plugins
- **OAuth Providers**: Google, Facebook, Apple (Devotees); Google / Microsoft (Staff)
- **Payments**: Razorpay (INR) with server-side order generation, webhook signature verification, and idempotent updates
- **Media**: Cloudinary
- **Communication**: Resend (Transactional Email), MSG91 (Transactional SMS/OTP)
- **Security & Rate Limiting**: Upstash Redis + Next.js Edge Middleware
- **Testing**: Vitest (Unit), Playwright (E2E)
- **Package Manager**: `pnpm`

---

## 📁 Project Structure

```
temple-org/
├── .env.example              # Documented environment variables template
├── components.json           # shadcn/ui configuration
├── eslint.config.mjs         # ESLint 9 configuration
├── next.config.ts            # Next.js configuration
├── package.json              # Scripts & dependencies
├── playwright.config.ts      # Playwright E2E configuration
├── prettier.config.mjs       # Prettier configuration with Tailwind plugin
├── tsconfig.json             # TypeScript configuration (strict mode)
├── vitest.config.ts          # Vitest unit test runner config
├── prisma/
│   ├── schema.prisma         # PostgreSQL schema (Users, Better Auth, Events, Bookings, Payments, AuditLog)
│   └── seed.ts               # Database seeder (Initial Admin + Sample Published Event)
├── src/
│   ├── app/
│   │   ├── (public)/         # Public layout, Homepage, Events, Event Detail (/events/[slug]), Book (/events/[slug]/book), Confirmation (/booking/[id]/confirmation), About, Contact, Gallery, Policies
│   │   ├── (auth)/           # Devotee Login (/login), Staff Login (/admin/login), Staff Invite (/invite/[token])
│   │   ├── account/          # Devotee account layout & bookings (/account/bookings, /account/bookings/[id])
│   │   ├── admin/            # Admin layout (enforces requireAdmin()), Dashboard, Events, Bookings (CSV & refund), Payments, Staff, Audit Log
│   │   ├── api/
│   │   │   ├── auth/[...all] # Better Auth Next.js route handler
│   │   │   └── webhooks/
│   │   │       └── razorpay/ # Razorpay raw-body HMAC webhook handler
│   │   ├── globals.css       # Tailwind v4 styles & temple warm palette
│   │   ├── layout.tsx        # Root HTML layout
│   │   ├── robots.ts         # Search engine crawler policies
│   │   └── sitemap.ts        # Dynamic sitemap with static and published event URLs
│   ├── components/
│   │   ├── ui/               # shadcn/ui component primitives
│   │   ├── navbar.tsx        # Public temple navbar with language switcher & mobile drawer
│   │   ├── footer.tsx        # Public temple footer
│   │   ├── mobile-nav.tsx    # Responsive mobile drawer navigation
│   │   ├── booking-checkout-form.tsx # Devotee reservation & Razorpay client checkout
│   │   ├── print-receipt-button.tsx  # Printable puja receipt trigger
│   │   ├── contact-form.tsx  # Devotee inquiry client form
│   │   ├── json-ld.tsx       # Schema.org structured data (HinduTemple & Event)
│   │   ├── language-switcher.tsx # English / Telugu i18n switcher
│   │   ├── admin-nav.tsx     # Admin staff portal sidebar & navigation
│   │   ├── account-nav.tsx   # Devotee account sidebar
│   │   └── admin/
│   │       ├── export-csv-button.tsx   # Admin bookings CSV streaming export
│   │       ├── refund-booking-button.tsx # Admin refund with reason & audit logging
│   │       ├── archive-event-button.tsx # Admin soft-delete archive trigger
│   │       ├── schedule-toggle-button.tsx # Admin schedule slot bookable toggle
│   │       └── event-form.tsx          # Admin event create/edit form
│   ├── lib/
│   │   ├── auth.ts           # Better Auth server instance & plugins
│   │   ├── auth-client.ts    # Better Auth client instance
│   │   ├── prisma.ts         # Prisma Client singleton
│   │   ├── utils.ts          # cn() and currency formatting helpers
│   │   └── i18n/             # Internationalization dictionaries & config (EN, TE)
│   ├── proxy.ts              # Edge route protection & strict security headers (CSP, HSTS, noindex) per Next.js 16 convention
│   ├── schemas/              # Shared Zod validation schemas
│   │   ├── auth.ts           # Login, OTP, and staff invite schemas
│   │   ├── booking.ts        # Booking creation, payment verification & refund schemas
│   │   └── event.ts          # Event & Schedule creation/update schemas
│   └── server/               # Pure business logic services (thin UI pattern)
│       ├── auth/
│       │   ├── guards.ts     # requireAdmin(), requireUser(), getCurrentUser()
│       │   └── roles.ts      # ROLES constants & helpers (USER, ADMIN)
│       ├── audit/
│       │   └── audit-logger.ts # Append-only AuditLog service
│       ├── bookings/
│       │   ├── bookings.service.ts # Seat reservation (15-min hold), idempotent payment confirmation, refund & CSV export
│       │   └── actions.ts    # Server actions for reservations, verification, refunds, CSV
│       ├── events/
│       │   ├── events.service.ts # Core Event & Schedule business logic with soft-delete
│       │   └── actions.ts    # Server actions for event CRUD, schedule toggles & image upload
│       ├── media/
│       │   └── cloudinary.ts # Cloudinary upload & management service
│       ├── notifications/
│       │   └── communications.ts # Resend transactional email & MSG91 SMS dispatch
│       └── payments/
│           └── razorpay.ts   # Razorpay order generation, HMAC verification, refund
└── tests/
    ├── e2e/
    │   └── booking-flow.spec.ts   # Playwright E2E booking & checkout tests
    └── unit/
        ├── bookings.service.test.ts # Reservation, hold expiry, idempotent confirmation & refund tests
        ├── events.service.test.ts # Event service, Zod validation, paise prices & audit tests
        ├── guards.test.ts    # Auth guard tests
        ├── i18n.test.ts      # Dictionary completeness and fallback tests
        ├── public-events.test.ts # Devotee query filtering (PUBLISHED only) tests
        ├── razorpay.test.ts  # Cryptographic signature & order creation tests
        ├── roles.test.ts     # Role boundary tests
        ├── schemas.test.ts   # Zod schema validation tests
        └── sitemap.test.ts   # Sitemap generation tests
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: LTS (v20+ recommended)
- **pnpm**: `corepack enable pnpm` or `npm install -g pnpm`
- **PostgreSQL**: Local PostgreSQL or cloud instance (Supabase, Neon, AWS RDS)

### 2. Environment Setup
Copy the environment template and provide your database credentials:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` and `INITIAL_ADMIN_EMAIL` are configured.

### 3. Generate Prisma Client & Run Seeder
```bash
# Generate Prisma Client types
pnpm db:generate

# Push schema to PostgreSQL database (when database is available)
pnpm db:push

# Seed the initial admin user & sample event
pnpm db:seed
```

### 4. Running the Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view the temple homepage.
- Devotee Portal: [http://localhost:3000/login](http://localhost:3000/login)
- Staff Admin Portal: [http://localhost:3000/admin](http://localhost:3000/admin) (Redirects to `/admin/login` if unauthenticated)

---

## 🧪 Testing & Verification

```bash
# Run unit test suite (Vitest)
pnpm test

# Run strict TypeScript typecheck
pnpm typecheck

# Run ESLint check
pnpm lint
```

---

## 🛡️ Security Architecture Highlights
1. **`requireAdmin()` Server Guard**: Every admin layout, page, and mutation calls `requireAdmin()` on the server first.
2. **Deactivation Invalidation**: Direct DB checks ensure deactivating an admin terminates their access immediately.
3. **No Indexing on Admin**: Middleware injects `X-Robots-Tag: noindex, nofollow` on all `/admin` routes.
4. **Append-Only Audit Log**: Every administrative action, seed event, event creation, update, refund, and archive is logged to `AuditLog`.
5. **Strict Money Handling**: All amounts are strictly calculated on the server from the database in **paise** to eliminate client manipulation and floating point inaccuracies (Security Rule 3).
6. **Seat Reservation & Hold Expiry**: Pending bookings lock available capacity within an interactive database transaction for 15 minutes (`expiresAt`), preventing overselling (Security Rule 5).
7. **Razorpay HMAC Webhook Source of Truth**: Webhooks verify the raw request body with SHA-256 HMAC and idempotently update booking statuses to prevent double-confirmation (Security Rule 4).
8. **Devotee Access Boundaries & Unguessable Guest Tokens**: Devotees access only their own bookings; guest bookings require a 64-character unguessable secret token (`guestToken`) for receipt viewing (Security Rule 2).
9. **Soft Delete / Archiving**: Events are never hard-deleted (Security Rule 6); archiving marks status as `ARCHIVED` and disables bookings on all associated schedules.
10. **Cloudinary Integration**: Signed media uploads with type verification and size boundaries.
