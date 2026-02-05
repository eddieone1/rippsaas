# Production Deployment - Quick Start

## 🚀 5-Minute Deployment Checklist

### 1. Set Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Required:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
CRON_SECRET=generate-random-32-char-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
```

### 2. Run Database Migrations

1. Go to Supabase Dashboard → SQL Editor
2. Run migrations in order:
   - `001_initial_schema.sql`
   - `005_add_branding_fields.sql`
   - `006_add_client_count_range.sql`
   - `007_add_membership_types.sql`
   - `008_add_tour_completion_tracking.sql`
   - `009_add_intervention_effectiveness_tracking.sql`
   - `010_add_coach_role_and_org_invites.sql`
   - `011_add_external_member_mappings.sql`
   - `012_add_coach_assignments.sql`
   - `013_add_coach_actions.sql`

### 3. Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Configure build settings (auto-detected)
4. Deploy

### 4. Configure Stripe Webhook

1. Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events: `customer.subscription.*`, `invoice.payment_*`
4. Copy webhook secret to Vercel env vars

### 5. Verify Deployment

- [ ] Homepage loads
- [ ] Signup works
- [ ] Login works
- [ ] Dashboard loads
- [ ] API routes respond

---

## 🔧 Generate CRON_SECRET

```bash
openssl rand -hex 32
```

Copy output to `CRON_SECRET` in Vercel.

---

## ✅ Verify Before Deploying

Run verification script:

```bash
./scripts/verify-deployment.sh
```

---

## 📚 Full Documentation

- **Complete Guide:** `docs/PRODUCTION_DEPLOYMENT.md`
- **Gotchas:** `docs/DEPLOYMENT_GOTCHAS.md`
- **Migration Script:** `scripts/run-migrations.sh`

---

## 🆘 Quick Troubleshooting

**App crashes:** Check environment variables in Vercel
**Database errors:** Verify migrations ran successfully
**Webhooks fail:** Check `STRIPE_WEBHOOK_SECRET` matches Stripe
**Jobs don't run:** Verify `CRON_SECRET` is set

---

**Ready?** Follow the checklist above and deploy! 🚀
