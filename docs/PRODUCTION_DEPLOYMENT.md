# Production Deployment Guide

## Overview

This guide covers everything needed to deploy the Retention Intelligence SaaS to production.

**Target Platform:** Vercel (Frontend) + Supabase (Database)

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables

All environment variables must be set in Vercel before deployment.

#### Required Variables

```bash
# Supabase (Database & Auth)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
CRON_SECRET=your-random-secret-key-here

# Stripe (Payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (Email)
RESEND_API_KEY=re_...

# Optional: External Integrations (for future)
MINDBODY_API_KEY=your-mindbody-key
MINDBODY_API_SECRET=your-mindbody-secret
GLOFOX_API_KEY=your-glofox-key
GLOFOX_BUSINESS_ID=your-glofox-business-id
```

#### How to Set in Vercel

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add each variable for **Production** environment
4. Optionally add for **Preview** and **Development** environments

**Important:** 
- `NEXT_PUBLIC_*` variables are exposed to the browser
- Never commit secrets to git
- Use different keys for production vs development

---

## 🗄️ Database Migrations

### Migration Files

All migrations are in `supabase/migrations/`:

```
001_initial_schema.sql
005_add_branding_fields.sql
006_add_client_count_range.sql
007_add_membership_types.sql
008_add_tour_completion_tracking.sql
009_add_intervention_effectiveness_tracking.sql
010_add_coach_role_and_org_invites.sql
011_add_external_member_mappings.sql
012_add_coach_assignments.sql
013_add_coach_actions.sql
```

### Running Migrations

#### Option 1: Supabase Dashboard (Recommended for MVP)

1. Go to Supabase Dashboard → SQL Editor
2. Run each migration file in order (001 → 013)
3. Verify each migration completes successfully
4. Check for any errors in the output

#### Option 2: Supabase CLI (For Advanced Users)

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

#### Option 3: Manual SQL Execution

1. Copy contents of each migration file
2. Paste into Supabase SQL Editor
3. Execute in order
4. Verify tables and policies are created

### Migration Order

**Critical:** Run migrations in numerical order. Each migration builds on the previous one.

```
1. 001_initial_schema.sql          # Base schema
2. 005_add_branding_fields.sql     # Branding
3. 006_add_client_count_range.sql  # Client count
4. 007_add_membership_types.sql    # Membership types
5. 008_add_tour_completion_tracking.sql
6. 009_add_intervention_effectiveness_tracking.sql
7. 010_add_coach_role_and_org_invites.sql
8. 011_add_external_member_mappings.sql
9. 012_add_coach_assignments.sql
10. 013_add_coach_actions.sql
```

### Verifying Migrations

After running migrations, verify:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public';
```

---

## 🌱 Seed Data (Optional)

### Default Campaign Templates

The app creates default templates on first use, but you can seed them:

```sql
-- Insert default email templates
INSERT INTO campaign_templates (gym_id, name, subject, body, channel)
VALUES
  (NULL, 'We Miss You', 'We miss you at {{gym_name}}!', 'Hi {{first_name}}, ...', 'email'),
  (NULL, 'Bring a Friend', 'Bring a friend on us!', 'Hi {{first_name}}, ...', 'email');

-- Insert default SMS templates (if needed)
INSERT INTO campaign_templates (gym_id, name, subject, body, channel)
VALUES
  (NULL, 'We Miss You SMS', '', 'Hi {{first_name}}, we miss you!', 'sms');
```

**Note:** `gym_id = NULL` means template is available to all gyms.

### Test Data (Development Only)

For testing, you can create a test gym:

```sql
-- Create test gym
INSERT INTO gyms (name, owner_email, subscription_status)
VALUES ('Test Gym', 'test@example.com', 'trialing');

-- Get gym ID
SELECT id FROM gyms WHERE name = 'Test Gym';

-- Create test user (requires auth.users entry first)
-- This should be done through signup flow, not SQL
```

**Warning:** Don't seed production data. Let users create their own data through the app.

---

## 🚀 Deployment Steps

### Step 1: Prepare Repository

```bash
# Ensure all code is committed
git add .
git commit -m "Prepare for production deployment"

# Push to main branch
git push origin main
```

### Step 2: Set Up Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Click **New Project**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

### Step 3: Configure Environment Variables

Add all required environment variables (see section above).

**Important:** 
- Set `NEXT_PUBLIC_APP_URL` to your production domain
- Use production Stripe keys (`pk_live_...`, `sk_live_...`)
- Use production Supabase project

### Step 4: Run Database Migrations

Run all migrations in Supabase SQL Editor (see Database Migrations section).

### Step 5: Configure Vercel Cron

Vercel Cron is configured in `vercel.json`. It will automatically set up:

- Daily commitment score recalculation (2 AM UTC)
- Daily at-risk detection (3 AM UTC)
- Daily coach action generation (4 AM UTC)

**Important:** Set `CRON_SECRET` environment variable in Vercel.

### Step 6: Deploy

1. Click **Deploy** in Vercel
2. Wait for build to complete
3. Check build logs for errors
4. Visit your production URL

### Step 7: Verify Deployment

1. **Check Homepage:** Should load without errors
2. **Test Signup:** Create a test account
3. **Test Login:** Log in with test account
4. **Check Dashboard:** Should load dashboard
5. **Test API:** Check API routes respond correctly

---

## 🔧 Post-Deployment Configuration

### 1. Stripe Webhook Setup

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET` in Vercel

### 2. Supabase RLS Policies

Verify RLS policies are active:

```sql
-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;
-- Should return no rows
```

### 3. Email Configuration

1. Verify Resend API key is set
2. Test email sending from app
3. Check Resend dashboard for delivery status

### 4. Domain Configuration

1. Add custom domain in Vercel
2. Update DNS records as instructed
3. Update `NEXT_PUBLIC_APP_URL` to match domain
4. Wait for SSL certificate (automatic)

---

## 📊 Logging

### Current Logging Setup

The app uses console logging for:
- API route errors
- Background job execution
- Critical operations

### Log Locations

**Vercel Logs:**
- Go to Vercel Dashboard → Your Project → Logs
- View real-time logs
- Filter by function, time, etc.

**Supabase Logs:**
- Go to Supabase Dashboard → Logs
- View database query logs
- Monitor RLS policy violations

### Logging Best Practices

**Current Implementation:**
```typescript
// API routes
console.error('API error:', error);

// Background jobs
console.log(`[JOB SUCCESS] ${jobName}:`, result);
console.error(`[JOB FAILURE] ${jobName}:`, error);
```

**Future Enhancement (Post-MVP):**
- Add structured logging (JSON format)
- Integrate with logging service (e.g., Logtail, Datadog)
- Add request ID tracking
- Add performance metrics

---

## ⚠️ Gotchas & Common Issues

### 1. Environment Variables Not Loading

**Symptom:** App crashes with "Missing environment variable" error.

**Fix:**
- Verify variables are set in Vercel (not just `.env.local`)
- Check variable names match exactly (case-sensitive)
- Redeploy after adding variables
- Check `NEXT_PUBLIC_*` prefix is correct

### 2. Database Connection Issues

**Symptom:** "Failed to connect to database" errors.

**Fix:**
- Verify Supabase URL is correct
- Check service role key is set (not anon key)
- Verify Supabase project is active
- Check IP allowlist in Supabase (if enabled)

### 3. RLS Policy Violations

**Symptom:** "Row-level security policy violation" errors.

**Fix:**
- Verify RLS policies are created
- Check user has correct `gym_id`
- Verify policies allow access
- Check `auth.uid()` matches user ID

### 4. Cron Jobs Not Running

**Symptom:** Background jobs don't execute.

**Fix:**
- Verify `CRON_SECRET` is set in Vercel
- Check `vercel.json` is in root directory
- Verify cron schedule syntax is correct
- Check Vercel Cron logs for errors

### 5. Stripe Webhook Failures

**Symptom:** Webhook events not processing.

**Fix:**
- Verify webhook URL is correct
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe
- Verify webhook events are selected
- Check webhook signature validation

### 6. Email Not Sending

**Symptom:** Emails not delivered.

**Fix:**
- Verify `RESEND_API_KEY` is set
- Check Resend account is active
- Verify sender domain is verified (if using custom domain)
- Check Resend dashboard for errors

### 7. Build Failures

**Symptom:** Vercel build fails.

**Fix:**
- Check build logs for specific errors
- Verify Node.js version (should be 18+)
- Check for TypeScript errors
- Verify all dependencies are in `package.json`

### 8. CORS Issues

**Symptom:** API requests blocked by CORS.

**Fix:**
- Verify `NEXT_PUBLIC_APP_URL` matches domain
- Check Supabase CORS settings
- Verify API routes allow correct origins

### 9. Session Issues

**Symptom:** Users logged out unexpectedly.

**Fix:**
- Check cookie settings in middleware
- Verify Supabase session configuration
- Check session expiration settings
- Verify domain matches in cookie settings

### 10. Migration Order Issues

**Symptom:** Migration fails with "relation does not exist" error.

**Fix:**
- Run migrations in numerical order
- Check for missing dependencies
- Verify previous migrations completed
- Check migration file names match order

---

## 🔒 Security Checklist

- [ ] All environment variables set in Vercel (not committed)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is secret (not public)
- [ ] `CRON_SECRET` is set and secure
- [ ] Stripe keys are production keys (not test)
- [ ] RLS policies are enabled on all tables
- [ ] API routes check authentication
- [ ] API routes check permissions (role-based)
- [ ] Webhook signatures are validated
- [ ] CORS is configured correctly
- [ ] HTTPS is enabled (automatic in Vercel)

---

## 📈 Monitoring

### Key Metrics to Monitor

1. **API Response Times**
   - Check Vercel Analytics
   - Monitor slow endpoints
   - Optimize as needed

2. **Error Rates**
   - Check Vercel Logs for errors
   - Monitor error frequency
   - Fix critical errors quickly

3. **Database Performance**
   - Check Supabase Dashboard → Database
   - Monitor query performance
   - Add indexes if needed

4. **Background Jobs**
   - Check Vercel Cron logs
   - Verify jobs complete successfully
   - Monitor execution time

5. **Email Delivery**
   - Check Resend dashboard
   - Monitor delivery rates
   - Fix bounce issues

---

## 🆘 Troubleshooting

### Quick Debugging Steps

1. **Check Vercel Logs**
   - Go to Vercel Dashboard → Logs
   - Filter by time, function, etc.
   - Look for error messages

2. **Check Supabase Logs**
   - Go to Supabase Dashboard → Logs
   - Check for RLS violations
   - Monitor query performance

3. **Test Locally**
   - Reproduce issue locally
   - Check environment variables
   - Verify database state

4. **Check Environment Variables**
   - Verify all variables are set
   - Check values are correct
   - Redeploy after changes

---

## 📝 Maintenance

### Regular Tasks

1. **Weekly:**
   - Check error logs
   - Monitor background jobs
   - Review user feedback

2. **Monthly:**
   - Review database performance
   - Check for slow queries
   - Optimize as needed

3. **Quarterly:**
   - Review security settings
   - Update dependencies
   - Review and optimize costs

---

## 🎯 Next Steps After Deployment

1. **Test All Features**
   - Signup flow
   - Login flow
   - Dashboard
   - Member management
   - Campaign creation
   - Email sending

2. **Monitor for 24-48 Hours**
   - Watch error logs
   - Check background jobs
   - Monitor performance

3. **Gather User Feedback**
   - Collect initial feedback
   - Fix critical issues
   - Plan improvements

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Resend Documentation](https://resend.com/docs)

---

## ✅ Deployment Checklist Summary

- [ ] Environment variables set in Vercel
- [ ] Database migrations run
- [ ] Vercel project configured
- [ ] Domain configured (if custom)
- [ ] Stripe webhook configured
- [ ] Email service configured
- [ ] Cron jobs configured
- [ ] Security checklist completed
- [ ] Initial testing completed
- [ ] Monitoring set up

**Ready to deploy!** 🚀
