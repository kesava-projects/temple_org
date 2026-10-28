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
├── prettier.config.mjs       # Prettier configuration with Tailwind plugin
├── tsconfig.json             # TypeScript configuration (strict mode)
├── vitest.config.ts          # Vitest unit test runner config
├── prisma/
│   ├── schema.prisma         # PostgreSQL schema (Users, Better Auth, Events, Bookings, Payments, AuditLog)
│   └── seed.ts               # Database seeder (Initial Admin + Sample Published Event)
├── src/
│   ├── app/
│   │   ├── (public)/         # Public layout, Homepage, Events, About, Contact, Gallery, Policies
│   │   ├── (auth)/           # Devotee Login (/login), Staff Login (/admin/login), Staff Invite (/invite/[token])
│   │   ├── account/          # Devotee account layout & bookings (/account/bookings)
│   │   ├── admin/            # Admin layout (enforces requireAdmin()), Dashboard, Events, Bookings, Staff, Audit Log
│   │   ├── api/
│   │   │   └── auth/[...all] # Better Auth Next.js route handler
│   │   ├── globals.css       # Tailwind v4 styles & temple warm palette
│   │   └── layout.tsx        # Root HTML layout
│   ├── components/
│   │   ├── ui/               # shadcn/ui component primitives
│   │   ├── navbar.tsx        # Public temple navbar
│   │   ├── footer.tsx        # Public temple footer
│   │   ├── admin-nav.tsx     # Admin staff portal sidebar & navigation
│   │   └── account-nav.tsx   # Devotee account sidebar
│   ├── lib/
│   │   ├── auth.ts           # Better Auth server instance & plugins
│   │   ├── auth-client.ts    # Better Auth client instance
│   │   ├── prisma.ts         # Prisma Client singleton
│   │   └── utils.ts          # cn() class utility
│   ├── proxy.ts              # Edge route protection & strict security headers (CSP, HSTS, noindex) per Next.js 16 convention
│   ├── schemas/              # Shared Zod validation schemas
│   │   ├── auth.ts           # Login, OTP, and staff invite schemas
│   │   └── event.ts          # Event & Schedule creation/update schemas
│   └── server/               # Pure business logic services (thin UI pattern)
│       ├── auth/
│       │   ├── guards.ts     # requireAdmin(), requireUser(), getCurrentUser()
│       │   └── roles.ts      # ROLES constants & helpers (USER, ADMIN)
│       ├── audit/
│       │   └── audit-logger.ts # Append-only AuditLog service
│       ├── events/
│       │   ├── events.service.ts # Core Event & Schedule business logic with soft-delete
│       │   └── actions.ts    # Server actions for event CRUD, schedule toggles & image upload
│       └── media/
│           └── cloudinary.ts # Cloudinary upload & management service
└── tests/
    └── unit/
        ├── events.service.test.ts # Event service, Zod validation, paise prices & audit tests
        ├── guards.test.ts    # Auth guard tests
        ├── roles.test.ts     # Role boundary tests
        └── schemas.test.ts   # Zod schema validation tests
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
4. **Append-Only Audit Log**: Every administrative action, seed event, event creation, update, and archive is logged to `AuditLog`.
5. **Strict Money Handling**: All amounts are strictly modeled as integers in **paise** to eliminate floating point inaccuracies.
6. **Soft Delete / Archiving**: Events are never hard-deleted (Security Rule 6); archiving marks status as `ARCHIVED` and disables bookings on all associated schedules.
7. **Cloudinary Integration**: Signed media uploads with type verification and size boundaries.
