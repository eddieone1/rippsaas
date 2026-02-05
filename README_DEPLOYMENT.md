# Production Deployment Summary

## 📋 Quick Reference

### Environment Variables Required

All must be set in **Vercel Dashboard → Environment Variables**:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJ...` |
| `NEXT_PUBLIC_APP_URL` | Production domain | `https://your-domain.com` |
| `CRON_SECRET` | Secret for cron jobs | `generate-random-32-chars` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_live_...` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...` |
| `RESEND_API_KEY` | Resend API key | `re_...` |

### Database Migrations

Run in Supabase SQL Editor in this order:

1. `001_initial_schema.sql`
2. `005_add_branding_fields.sql`
3. `006_add_client_count_range.sql`
4. `007_add_membership_types.sql`
5. `008_add_tour_completion_tracking.sql`
6. `009_add_intervention_effectiveness_tracking.sql`
7. `010_add_coach_role_and_org_invites.sql`
8. `011_add_external_member_mappings.sql`
9. `012_add_coach_assignments.sql`
10. `013_add_coach_actions.sql`

### Deployment Steps

1. ✅ Set environment variables in Vercel
2. ✅ Run database migrations
3. ✅ Deploy to Vercel
4. ✅ Configure Stripe webhook
5. ✅ Verify deployment

### Verification

```bash
# Check environment variables
./scripts/verify-deployment.sh

# List migrations
./scripts/run-migrations.sh
```

### Documentation

- **Full Guide:** `docs/PRODUCTION_DEPLOYMENT.md`
- **Gotchas:** `docs/DEPLOYMENT_GOTCHAS.md`
- **Quick Start:** `docs/DEPLOYMENT_QUICK_START.md`

---

## 🚨 Critical Gotchas

1. **Environment variables NOT in `.env.local`** - Must set in Vercel
2. **Migrations must run in order** - Don't skip any
3. **Use production Stripe keys** - Not test keys (`pk_test_...`)
4. **CRON_SECRET must be set** - For background jobs
5. **NEXT_PUBLIC_APP_URL must match domain** - Exact match required

---

## 📞 Support

If deployment fails:
1. Check Vercel logs
2. Check Supabase logs
3. Review `docs/DEPLOYMENT_GOTCHAS.md`
4. Verify environment variables
5. Verify migrations completed

---

**Ready to deploy?** Start with `docs/DEPLOYMENT_QUICK_START.md` 🚀
