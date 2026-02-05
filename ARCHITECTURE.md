# MVP Architecture Proposal
## Retention Intelligence SaaS

---

## 1. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Dashboard  │  │   Members    │  │  Campaigns   │     │
│  │   (SSR)      │  │   (SSR)      │  │  (SSR)       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Next.js App Router + React Server Components               │
│  Tailwind + shadcn/ui components                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/API Routes
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER (Next.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  /api/members│  │ /api/risk    │  │/api/campaigns│     │
│  │  /api/insights│ │ /api/webhooks│  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Route Handlers (app/api/**/route.ts)                       │
│  - Auth middleware                                           │
│  - Request validation (Zod)                                 │
│  - Business logic                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Prisma Client
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│  ┌────────────────────────────────────────────────────┐    │
│  │              PostgreSQL Database                    │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │    │
│  │  │  Gyms    │  │ Members  │  │Campaigns │         │    │
│  │  │  Users   │  │  Risk    │  │Interventions│      │    │
│  │  └──────────┘  └──────────┘  └──────────┘         │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Prisma ORM                                                  │
│  - Schema definition (prisma/schema.prisma)                  │
│  - Migrations (prisma/migrations/)                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Scheduled Jobs
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKGROUND JOBS LAYER                      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ Risk Calc    │  │ Sync Jobs    │                        │
│  │ (Cron)       │  │ (Webhooks)   │                        │
│  └──────────────┘  └──────────────┘                        │
│                                                              │
│  Next.js API Routes + External Cron (Vercel Cron)           │
│  OR Simple in-process scheduler (node-cron)                │
└─────────────────────────────────────────────────────────────┘
```

**Key Architectural Decisions:**
- **Monolithic Next.js app** - Single codebase, no microservices overhead
- **API Routes as backend** - No separate backend server needed
- **Server Components by default** - Minimal client-side JS, faster loads
- **Prisma for type safety** - Auto-generated types, migrations, queries
- **PostgreSQL** - Reliable, ACID-compliant, perfect for relational data

---

## 2. Folder Structure

### Current vs Proposed Structure

**Your Current Structure (Already Good!):**
```
app/
├── (auth)/              ✅ Auth routes (login, signup)
├── (protected)/         ✅ Protected routes (dashboard, members, etc.)
├── api/                 ✅ API routes (backend)
└── onboarding/          ✅ Onboarding flow

components/              ✅ React components
lib/                     ✅ Utilities (Supabase clients)
supabase/migrations/     ✅ Database migrations
```

**Proposed Additions:**
```
lib/
├── prisma.ts            ➕ Prisma client singleton
└── risk/                ➕ Risk calculation logic
    ├── calculate.ts
    └── rules.ts

prisma/                  ➕ Prisma schema & migrations
├── schema.prisma
└── migrations/

app/api/
└── cron/                ➕ Background job routes
    └── risk-calculation/
        └── route.ts
```

**No Changes Needed:**
- ✅ `app/` structure (already perfect)
- ✅ `components/` organization (already good)
- ✅ `lib/` utilities (just add Prisma)
- ✅ API route structure (just migrate queries)

### Target Folder Structure

```
gym-retention-saas/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   ├── signup/
│   │   └── layout.tsx
│   ├── (protected)/             # Protected route group
│   │   ├── dashboard/           # Main dashboard
│   │   ├── members/             # Member management
│   │   ├── campaigns/           # Campaign management
│   │   ├── insights/            # Analytics/insights
│   │   ├── settings/            # Settings
│   │   └── layout.tsx           # Protected layout with auth check
│   ├── api/                     # API Routes (Backend)
│   │   ├── auth/                # Auth endpoints
│   │   ├── members/             # Member CRUD
│   │   ├── risk/                # Risk calculation
│   │   ├── campaigns/           # Campaign management
│   │   ├── insights/            # Analytics endpoints
│   │   └── webhooks/            # External webhooks (Mindbody, Glofox)
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing/redirect
│
├── components/                  # React Components
│   ├── ui/                      # shadcn/ui components
│   ├── dashboard/               # Dashboard-specific
│   ├── members/                 # Member-specific
│   ├── campaigns/               # Campaign-specific
│   └── layout/                   # Layout components (Navbar, etc.)
│
├── lib/                         # Shared utilities
│   ├── prisma.ts                # Prisma client singleton
│   ├── auth.ts                  # Auth utilities
│   ├── risk/                    # Risk calculation logic
│   │   ├── calculate.ts         # Core risk algorithm
│   │   └── rules.ts             # Risk rules
│   ├── integrations/            # External integrations
│   │   ├── mindbody.ts
│   │   └── glofox.ts
│   └── utils.ts                 # General utilities
│
├── prisma/                      # Prisma schema & migrations
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Migration files
│
├── types/                       # TypeScript types
│   ├── database.ts              # Generated Prisma types
│   └── api.ts                   # API request/response types
│
├── middleware.ts                # Next.js middleware (auth)
│
├── .env.local                   # Environment variables
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## 3. Frontend vs Backend Responsibilities

### Frontend (app/, components/)
**Responsibilities:**
- ✅ **UI rendering** - Server Components + Client Components where needed
- ✅ **User interactions** - Forms, buttons, modals
- ✅ **Data display** - Tables, charts, dashboards
- ✅ **Client-side validation** - Form validation (Zod schemas)
- ✅ **Navigation** - Routing, protected routes
- ✅ **Optimistic updates** - For better UX

**What it DOES NOT do:**
- ❌ Business logic (risk calculation, data processing)
- ❌ Database queries (except through API)
- ❌ External API calls (except through API routes)
- ❌ Authentication logic (handled by middleware + API)

### Backend (app/api/)
**Responsibilities:**
- ✅ **Business logic** - Risk calculation, member scoring
- ✅ **Database operations** - All Prisma queries
- ✅ **External integrations** - Mindbody, Glofox API calls
- ✅ **Data validation** - Server-side Zod validation
- ✅ **Authentication** - Session checks, role verification
- ✅ **Background jobs** - Risk recalculation, data sync
- ✅ **Webhooks** - Receiving data from gym software

**What it DOES NOT do:**
- ❌ UI rendering (except API responses)
- ❌ Client-side state management
- ❌ Browser-specific logic

### Shared (lib/)
**Responsibilities:**
- ✅ **Pure functions** - Risk calculation algorithms
- ✅ **Type definitions** - Shared TypeScript types
- ✅ **Utilities** - Date formatting, validation helpers
- ✅ **Constants** - Risk thresholds, business rules

---

## 4. Why This Architecture is Correct for a Bootstrapped SaaS

### ✅ **Speed to Market**
- **Single codebase** - No context switching between frontend/backend repos
- **Next.js API Routes** - No separate backend server to deploy/maintain
- **TypeScript + Prisma** - Type safety catches errors at dev time, not runtime
- **Server Components** - Less client JS = faster pages = better UX

### ✅ **Cost Efficiency**
- **Single deployment** - One Vercel/Netlify deployment (free tier viable)
- **PostgreSQL** - Supabase free tier or Railway $5/month
- **No infrastructure overhead** - No Docker, Kubernetes, or server management
- **Serverless scaling** - Pay only for what you use

### ✅ **Developer Experience**
- **Prisma migrations** - Database changes are versioned and reversible
- **Auto-generated types** - `prisma generate` gives you full type safety
- **Hot reload** - Next.js dev server = instant feedback
- **Clear separation** - Frontend vs backend is obvious from folder structure

### ✅ **MVP-Focused**
- **No over-engineering** - No microservices, message queues, or complex patterns
- **API-first** - Easy to add mobile app later without refactoring
- **Simple background jobs** - Vercel Cron or node-cron, not Celery/Redis
- **Direct database access** - Prisma client, no abstraction layers

### ✅ **Scalability Path**
- **API routes** - Can extract to separate Next.js API routes or standalone server later
- **Database** - PostgreSQL scales vertically and horizontally
- **Background jobs** - Can move to Inngest/Trigger.dev when needed
- **Caching** - Can add Redis layer later if needed

### ✅ **Risk Calculation Focus**
- **Pure functions** - Risk logic in `lib/risk/` is testable and portable
- **Database triggers** - Can add PostgreSQL functions for real-time risk updates
- **Scheduled jobs** - Daily risk recalculation via cron
- **Webhook support** - Real-time updates from gym software

---

## 5. Technology Stack Rationale

### **Next.js (App Router)**
- ✅ Server Components = faster initial loads
- ✅ API Routes = backend in same codebase
- ✅ Built-in optimizations (images, fonts, etc.)
- ✅ Deploy anywhere (Vercel, Netlify, self-hosted)

### **TypeScript**
- ✅ Type safety prevents bugs
- ✅ Better IDE autocomplete
- ✅ Self-documenting code

### **Tailwind + shadcn/ui**
- ✅ Rapid UI development
- ✅ Consistent design system
- ✅ Copy-paste components, customize as needed
- ✅ No CSS-in-JS runtime overhead

### **PostgreSQL**
- ✅ Reliable, battle-tested
- ✅ Rich data types (JSON, arrays, timestamps)
- ✅ Full-text search built-in
- ✅ ACID compliance for financial data

### **Prisma**
- ✅ Type-safe database access
- ✅ Migration management
- ✅ Great DX (Prisma Studio for debugging)
- ✅ No raw SQL needed (but can use if needed)

### **Auth: NextAuth.js (Recommended for New Projects)**

**Why NextAuth.js:**
- ✅ Built for Next.js (perfect integration)
- ✅ Multiple providers (email/password, OAuth)
- ✅ Session management handled
- ✅ Middleware integration
- ✅ Free, open-source
- ✅ Easy to add social logins later

**Current Setup: Supabase Auth**
- ✅ Already working in your codebase
- ✅ Free tier sufficient for MVP
- ✅ RLS policies integrated
- ✅ No migration needed if keeping Supabase

**Recommendation:**
- **If migrating:** Use NextAuth.js for cleaner separation
- **If keeping Supabase:** Keep Supabase Auth (it's working!)
- **Hybrid approach:** Keep Supabase Auth + Add Prisma for database (best of both worlds)

**For MVP:** Keep Supabase Auth if it's working. Migrate to NextAuth.js only if you need features Supabase doesn't provide.

### **Background Jobs: Vercel Cron (Recommended)**
**Why Vercel Cron:**
- ✅ Free with Vercel deployment
- ✅ No infrastructure to manage
- ✅ Cron syntax (familiar)
- ✅ Built-in monitoring

**Alternative: node-cron** (if self-hosting)
- ✅ Simple, lightweight
- ✅ Runs in-process
- ❌ Requires always-on server

**For MVP: Vercel Cron** - Zero setup, free

---

## 6. Data Flow Example: "Who is at risk?"

```
1. User opens Dashboard (app/(protected)/dashboard/page.tsx)
   ↓
2. Server Component fetches data via API
   ↓
3. API Route (app/api/risk/calculate/route.ts)
   - Validates auth
   - Calls lib/risk/calculate.ts
   - Queries database via Prisma
   - Returns at-risk members
   ↓
4. Dashboard displays MembersAtRiskTable component
   ↓
5. User clicks "Send Campaign" → triggers API route
   ↓
6. Background job (Vercel Cron) runs daily:
   - Recalculates risk scores
   - Updates database
   - Sends notifications if needed
```

---

## 7. Migration Path from Current Supabase Setup

### Current State Analysis
You're currently using:
- ✅ Supabase Auth (working)
- ✅ Supabase PostgreSQL (with RLS policies)
- ✅ Next.js App Router (already correct)
- ✅ API Routes structure (already correct)

### Migration Strategy: Hybrid Approach (Recommended)

**Option A: Keep Supabase Auth + Add Prisma for Database**
- ✅ Keep Supabase Auth (no changes needed)
- ✅ Add Prisma pointing to same Supabase PostgreSQL database
- ✅ Gradually migrate API routes from Supabase client → Prisma client
- ✅ Keep RLS policies in database (Prisma respects them)

**Benefits:**
- Minimal disruption to auth flow
- Get Prisma type safety for database queries
- Can migrate incrementally (route by route)
- Keep Supabase dashboard for auth management

**Option B: Full Migration to NextAuth.js + Prisma**
- Migrate auth from Supabase → NextAuth.js
- Migrate database queries from Supabase → Prisma
- More work upfront, but cleaner long-term

**Recommendation for MVP:** **Option A** - Keep Supabase Auth, add Prisma for database queries. This gives you:
- Type safety (Prisma)
- Existing auth (no changes)
- Incremental migration (low risk)
- Best of both worlds

### Migration Steps (Option A)

1. **Install Prisma**
   ```bash
   npm install prisma @prisma/client
   npx prisma init
   ```

2. **Point Prisma to Supabase PostgreSQL**
   ```env
   # .env.local
   DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres"
   ```

3. **Generate Prisma schema from existing database**
   ```bash
   npx prisma db pull
   npx prisma generate
   ```

4. **Create Prisma client singleton** (`lib/prisma.ts`)
   ```typescript
   import { PrismaClient } from '@prisma/client'

   const globalForPrisma = globalThis as unknown as {
     prisma: PrismaClient | undefined
   }

   export const prisma = globalForPrisma.prisma ?? new PrismaClient()

   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
   ```

5. **Migrate API routes incrementally**
   - Start with one route (e.g., `/api/members`)
   - Replace Supabase queries with Prisma queries
   - Keep auth checks using Supabase
   - Test thoroughly before moving to next route

6. **Update middleware** (keep Supabase auth check)
   - Keep current Supabase middleware
   - Prisma doesn't replace auth, only database queries

---

## 8. Implementation Plan

### Phase 1: Add Prisma (Keep Supabase Auth)
1. **Install Prisma**
   ```bash
   npm install prisma @prisma/client
   npx prisma init
   ```

2. **Connect to existing Supabase database**
   - Copy connection string from Supabase dashboard
   - Update `DATABASE_URL` in `.env.local`
   - Run `npx prisma db pull` to introspect schema
   - Run `npx prisma generate` to create client

3. **Create Prisma client singleton**
   - Create `lib/prisma.ts` (see migration steps above)

### Phase 2: Migrate API Routes (Incremental)
1. **Start with `/api/members`** (simplest)
   - Replace Supabase queries with Prisma
   - Keep auth checks using Supabase
   - Test thoroughly

2. **Continue with other routes**
   - `/api/campaigns`
   - `/api/insights`
   - `/api/interventions`

3. **Keep Supabase for auth**
   - No changes to auth flow
   - Keep middleware as-is

### Phase 3: Set up Background Jobs
1. **Create cron job route** (`app/api/cron/risk-calculation/route.ts`)
   - Protected with Vercel Cron secret
   - Recalculates risk scores daily
   - Updates database via Prisma

2. **Configure Vercel Cron** (`vercel.json`)
   ```json
   {
     "crons": [{
       "path": "/api/cron/risk-calculation",
       "schedule": "0 2 * * *"
     }]
   }
   ```

### Phase 4: UI Improvements (Optional)
1. **Set up shadcn/ui** (if not already done)
   ```bash
   npx shadcn-ui@latest init
   ```

2. **Add components as needed**
   - Tables, forms, modals from shadcn/ui

### Current API Routes Status
Your existing API routes are well-structured:
- ✅ `/api/members` - Member CRUD
- ✅ `/api/campaigns` - Campaign management
- ✅ `/api/insights` - Analytics
- ✅ `/api/interventions` - Risk tracking
- ✅ `/api/webhooks` - External integrations

**Migration priority:** Start with `/api/members` → `/api/campaigns` → `/api/insights`

---

## Summary

This architecture is:
- ✅ **Simple** - No unnecessary complexity
- ✅ **Fast** - Server Components, optimized queries
- ✅ **Type-safe** - TypeScript + Prisma
- ✅ **Scalable** - Can grow without major refactoring
- ✅ **Cost-effective** - Free/low-cost hosting options
- ✅ **MVP-focused** - Only what you need to answer "Who is at risk, why, and what should we do today?"
