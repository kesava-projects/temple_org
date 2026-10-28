# Sri Venkateswara Temple Organization - Production Deployment & Operations Guide

This guide details the end-to-end production deployment, custom domain configuration, OAuth credential registration, payment gateway webhooks, and disaster recovery procedures for the Temple Organization platform.

---

## 1. Hosting Architecture Overview

- **Hosting Platform**: [Vercel](https://vercel.com/) (Next.js App Router, Turbopack, Serverless Functions)
- **Primary Serverless Region**: `bom1` (Mumbai, India) for minimal latency to temple devotees
- **Edge Runtime**: Next.js Edge Proxy for global security headers, routing guards, and rate limiting
- **Database**: PostgreSQL (v15+) hosted on AWS RDS / Neon / Supabase with connection pooling
- **CI/CD**: GitHub Actions automated pipeline enforcing lint, strict typecheck, 59 unit tests, and production builds on push/PR

---

## 2. Environment Variables & Secret Configuration

All production secrets must be securely configured in the **Vercel Project Dashboard** (under **Settings ➔ Environment Variables**). Do NOT commit production credentials to version control.

### Core Application & Auth

| Variable | Description | Example / Format | Required |
|---|---|---|:---:|
| `DATABASE_URL` | PostgreSQL connection string (use pooled endpoint with `?pgbouncer=true` if using PgBouncer) | `postgresql://user:pass@ep-cool-pooler.ap-south-1.aws.neon.tech/temple?sslmode=require` | **YES** |
| `DIRECT_URL` | Non-pooled direct database URL for running migrations | `postgresql://user:pass@ep-cool.ap-south-1.aws.neon.tech/temple?sslmode=require` | Optional (Prisma migrations) |
| `NEXT_PUBLIC_SITE_URL` | Canonical public URL of the temple website without trailing slash | `https://temple.org` | **YES** |
| `BETTER_AUTH_URL` | Base URL for Better Auth authentication callbacks | `https://temple.org` | **YES** |
| `BETTER_AUTH_SECRET` | 32+ character high-entropy cryptographic secret | Generate via `openssl rand -hex 32` | **YES** |
| `INITIAL_ADMIN_EMAIL` | Email of initial chief administrator created during database seed | `head.trustee@temple.org` | **YES** |

### OAuth 2.0 Providers

| Variable | Provider | Notes | Required |
|---|---|---|:---:|
| `GOOGLE_CLIENT_ID` | Google OAuth | Devotees & Staff | **YES** |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | Generated in Google Cloud Console | **YES** |
| `FACEBOOK_CLIENT_ID` | Facebook Login | Devotees | **YES** |
| `FACEBOOK_CLIENT_SECRET` | Facebook Login | Generated in Meta for Developers | **YES** |
| `APPLE_CLIENT_ID` | Sign in with Apple | Service ID (e.g. `org.temple.auth`) | **YES** |
| `APPLE_TEAM_ID` | Sign in with Apple | 10-character Apple Team ID | **YES** |
| `APPLE_KEY_ID` | Sign in with Apple | 10-character Key ID for Private Key | **YES** |
| `APPLE_PRIVATE_KEY` | Sign in with Apple | Raw `.p8` private key contents | **YES** |
| `MICROSOFT_CLIENT_ID` | Microsoft Entra ID | Staff Portal Login | **YES** |
| `MICROSOFT_CLIENT_SECRET` | Microsoft Entra ID | Generated in Azure Portal | **YES** |

### Payments (Razorpay INR)

| Variable | Description | Environment | Required |
|---|---|---|:---:|
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay Key ID exposed to client modal | `rzp_live_...` | **YES** |
| `RAZORPAY_KEY_ID` | Server-side Razorpay Key ID | `rzp_live_...` | **YES** |
| `RAZORPAY_KEY_SECRET` | Server-side Razorpay Secret Key | Generated in Razorpay Dashboard | **YES** |
| `RAZORPAY_WEBHOOK_SECRET` | HMAC SHA-256 secret for verifying webhook payloads | Custom secure string configured in Razorpay Webhooks | **YES** |

### Media, Communications & Security

| Variable | Service | Description | Required |
|---|---|---|:---:|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary | Temple media cloud name | **YES** |
| `CLOUDINARY_API_KEY` | Cloudinary | API Key for signed uploads | **YES** |
| `CLOUDINARY_API_SECRET` | Cloudinary | API Secret | **YES** |
| `RESEND_API_KEY` | Resend | API key for transactional email confirmations and 48h staff invites | **YES** |
| `EMAIL_FROM` | Resend | Verified sender domain (e.g. `Sri Venkateswara Temple <info@temple.org>`) | **YES** |
| `MSG91_AUTH_KEY` | MSG91 | Auth key for transactional SMS confirmations and devotee OTP | **YES** |
| `MSG91_SENDER_ID` | MSG91 | 6-character registered DLT Sender Header (e.g. `TEMPLE`) | **YES** |
| `MSG91_OTP_TEMPLATE_ID` | MSG91 | Registered DLT Template ID for OTP dispatch | **YES** |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis | REST URL for distributed sliding window rate limiting | **YES** |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis | REST Bearer Token for Upstash Redis | **YES** |
| `SENTRY_DSN` | Sentry | Sentry ingestion DSN for real-time error tracking | **YES** |

---

## 3. Custom Domain & DNS Configuration

To point the temple's official domain (e.g., `temple.org`) to Vercel:

### A. Vercel Domain Setup
1. In the Vercel Dashboard, navigate to **Project Settings ➔ Domains**.
2. Add both `temple.org` and `www.temple.org`.
3. Select **Redirect `temple.org` to `www.temple.org`** (or vice versa according to temple marketing guidelines).

### B. DNS Records Configuration (at Domain Registrar / Cloudflare / Route 53)

Configure the following records with your authoritative DNS provider:

| Record Type | Host / Name | Value / Target | TTL | Purpose |
|---|---|---|---|---|
| **A** | `@` (apex) | `76.76.21.21` | Auto / 300 | Vercel Global Edge IP |
| **CNAME** | `www` | `cname.vercel-dns.com.` | Auto / 300 | Canonical WWW host |
| **CAA** | `@` | `0 issue "letsencrypt.org"` | 3600 | Optional: Certificate Authority Authorization |

> [!NOTE]
> If using Cloudflare DNS, set the proxy status to **DNS only (Grey Cloud)** during initial SSL issuance by Let's Encrypt / Vercel to allow automated HTTP-01 challenge completion.

---

## 4. OAuth 2.0 Provider Configuration & Redirect URIs

Configure the exact redirect URIs in each respective developer console:

### 1. Google Cloud Console
- Console: [Google Cloud APIs & Services ➔ Credentials](https://console.cloud.google.com/apis/credentials)
- **Authorized JavaScript origins**:
  - `https://temple.org`
  - `https://www.temple.org`
- **Authorized redirect URIs**:
  - `https://temple.org/api/auth/callback/google`
  - `https://www.temple.org/api/auth/callback/google`

### 2. Facebook / Meta for Developers
- Console: [developers.facebook.com ➔ Facebook Login ➔ Settings](https://developers.facebook.com/)
- **Valid OAuth Redirect URIs**:
  - `https://temple.org/api/auth/callback/facebook`
  - `https://www.temple.org/api/auth/callback/facebook`

### 3. Apple Developer Portal
- Console: [developer.apple.com ➔ Certificates, Identifiers & Profiles](https://developer.apple.com/)
- **Identifiers ➔ Services IDs**: Configure your Service ID (e.g. `org.temple.auth`)
- **Domains and Subdomains**: `temple.org`, `www.temple.org`
- **Return URLs**:
  - `https://temple.org/api/auth/callback/apple`
  - `https://www.temple.org/api/auth/callback/apple`

### 4. Microsoft Azure Entra ID (Staff Only)
- Console: [portal.azure.com ➔ Microsoft Entra ID ➔ App registrations](https://portal.azure.com/)
- **Authentication ➔ Platform configurations ➔ Web**:
- **Redirect URIs**:
  - `https://temple.org/api/auth/callback/microsoft`
  - `https://www.temple.org/api/auth/callback/microsoft`

---

## 5. Razorpay Production Webhook Setup

Razorpay webhooks are the **single source of truth** for payment settlement (Security Rule 4).

1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com/) and toggle from **Test Mode** to **Live Mode**.
2. Navigate to **Settings ➔ Webhooks ➔ Add New Webhook**.
3. **Webhook URL**:
   ```
   https://temple.org/api/webhooks/razorpay
   ```
4. **Secret**: Enter a strong random secret. Copy this value and set it as `RAZORPAY_WEBHOOK_SECRET` in Vercel.
5. **Alert Email**: Enter `tech@temple.org` to receive notifications if delivery fails.
6. **Active Events**: Select the following required events:
   - `order.paid`
   - `payment.captured`
   - `payment.failed`
7. Save the webhook. The application verifies incoming webhooks using SHA-256 HMAC cryptographic signatures against the raw body payload.

---

## 6. Database Migrations, Seeding & Backup Strategy

### A. Initial Production Migration
In production, run database migrations using the Prisma CLI:
```bash
# Apply pending migrations to production PostgreSQL
npx prisma migrate deploy

# Seed initial administrative user and inaugural event
pnpm db:seed
```

### B. Automated Daily Backup Strategy
1. **Automated Snapshots**: Enable daily automated snapshots with a 30-day retention window on your PostgreSQL host (AWS RDS / Neon / Supabase).
2. **Point-In-Time Recovery (PITR)**: Enable Continuous Write-Ahead Logging (WAL) archiving to allow restoring to any second within the retention window.
3. **Offsite Logical Backup (pg_dump)**:
   A scheduled GitHub Actions or Cron job executing nightly:
   ```bash
   pg_dump -Fc --no-acl --no-owner -d "$DATABASE_URL" > "temple_db_$(date +%Y%m%d).dump"
   aws s3 cp "temple_db_$(date +%Y%m%d).dump" s3://temple-backups-vault/postgres/
   ```

### C. Rollback Procedures
- **Vercel Instant Rollback**: In the Vercel Deployments dashboard, select the previous stable deployment and click **Instant Rollback**.
- **Database Schema Rollback**:
  If a migration causes issues:
  1. Restore the snapshot immediately prior to migration.
  2. Revert the application deployment on Vercel.
  3. All monetary transactions in `Booking` and `Payment` tables have append-only `AuditLog` records to audit any state discrepancies.

---

## 7. Production Pre-Flight Checklist

Before launching to devotees and donors:

- [ ] **Database Connection**: `DATABASE_URL` is set with SSL enabled and connection pool limits configured.
- [ ] **First Admin Seeded**: Run `pnpm db:seed` with `INITIAL_ADMIN_EMAIL` configured.
- [ ] **Better Auth Secret**: Generated with `openssl rand -hex 32` and set on Vercel.
- [ ] **Custom Domain**: Apex `A` and `www` `CNAME` records verified with valid SSL certificate.
- [ ] **OAuth Consoles**: Production redirect URIs registered and approved for Google, Facebook, Apple, and Microsoft.
- [ ] **Razorpay Live Mode**: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` set in Live mode. Webhook endpoint active.
- [ ] **Transactional Email**: Resend domain DNS records (DKIM, SPF, DMARC) verified.
- [ ] **SMS DLT Registration**: MSG91 Sender ID and transactional OTP template approved by Indian telecom regulators.
- [ ] **Rate Limiting**: Upstash Redis connected and verified with active token.
- [ ] **Error Monitoring**: Sentry DSN verified receiving test exception events.
- [ ] **Automated CI**: GitHub Actions workflow green across lint, typecheck, tests, and build.
- [ ] **Security Headers**: HSTS, CSP, X-Frame-Options, and `X-Robots-Tag: noindex` verified on `/admin`.
