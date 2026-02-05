# Deployment Gotchas & Common Issues

## 🚨 Critical Gotchas

### 1. Environment Variables Not Set in Vercel

**Problem:** App works locally but crashes in production.

**Why:** Environment variables in `.env.local` are NOT deployed to Vercel.

**Fix:** 
- Set ALL environment variables in Vercel Dashboard → Environment Variables
- Must set for Production environment
- Redeploy after adding variables

**Prevention:** Use `scripts/verify-deployment.sh` before deploying.

---

### 2. Database Migrations Not Run

**Problem:** App crashes with "relation does not exist" errors.

**Why:** Database tables don't exist if migrations weren't run.

**Fix:**
- Run ALL migrations in Supabase SQL Editor
- Run in numerical order (001 → 013)
- Verify each completes successfully

**Prevention:** Document migration status, verify before deployment.

---

### 3. Wrong Stripe Keys

**Problem:** Payments don't work, webhooks fail.

**Why:** Using test keys (`pk_test_...`) instead of production (`pk_live_...`).

**Fix:**
- Use production Stripe keys in production environment
- Keep test keys for development/preview
- Verify webhook secret matches Stripe dashboard

**Prevention:** Check key prefixes before deploying.

---

### 4. CRON_SECRET Not Set

**Problem:** Background jobs don't run.

**Why:** Vercel Cron requires `CRON_SECRET` for authentication.

**Fix:**
- Generate random secret: `openssl rand -hex 32`
- Set in Vercel environment variables
- Verify `vercel.json` cron configuration

**Prevention:** Include in deployment checklist.

---

### 5. RLS Policies Missing

**Problem:** Users can't access their data, or can access others' data.

**Why:** Row-level security policies weren't created.

**Fix:**
- Verify migrations include RLS policies
- Check RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables`
- Test with different user accounts

**Prevention:** Test RLS policies in staging environment.

---

### 6. NEXT_PUBLIC_APP_URL Wrong

**Problem:** Email links don't work, redirects fail.

**Why:** `NEXT_PUBLIC_APP_URL` doesn't match production domain.

**Fix:**
- Set to exact production domain: `https://your-domain.com`
- No trailing slash
- Include `https://` protocol

**Prevention:** Verify in deployment checklist.

---

### 7. Supabase Service Role Key Exposed

**Problem:** Security vulnerability, unauthorized database access.

**Why:** Service role key bypasses RLS, should be secret.

**Fix:**
- Never commit to git
- Only set in Vercel environment variables
- Use different keys for dev/prod
- Rotate if exposed

**Prevention:** Use `.gitignore` for `.env*` files.

---

### 8. Stripe Webhook Secret Mismatch

**Problem:** Webhook events not processing.

**Why:** Webhook secret in Vercel doesn't match Stripe.

**Fix:**
- Copy secret from Stripe Dashboard → Webhooks
- Set in Vercel as `STRIPE_WEBHOOK_SECRET`
- Verify webhook URL is correct

**Prevention:** Test webhook in Stripe dashboard.

---

### 9. Migration Order Wrong

**Problem:** Migration fails with dependency errors.

**Why:** Migrations have dependencies, must run in order.

**Fix:**
- Run migrations in numerical order (001 → 013)
- Don't skip migrations
- Check for errors after each migration

**Prevention:** Use migration script to verify order.

---

### 10. Build Failures

**Problem:** Vercel build fails, deployment doesn't complete.

**Why:** TypeScript errors, missing dependencies, etc.

**Fix:**
- Check build logs in Vercel
- Fix TypeScript errors locally first
- Verify `package.json` has all dependencies
- Check Node.js version (should be 18+)

**Prevention:** Test build locally: `npm run build`

---

## ⚠️ Common Issues

### Issue: CORS Errors

**Symptom:** API requests blocked by browser.

**Fix:**
- Verify `NEXT_PUBLIC_APP_URL` matches domain
- Check Supabase CORS settings
- Verify API routes allow correct origins

---

### Issue: Session Expires Quickly

**Symptom:** Users logged out unexpectedly.

**Fix:**
- Check Supabase session configuration
- Verify cookie settings in middleware
- Check session expiration settings

---

### Issue: Emails Not Sending

**Symptom:** Campaign emails not delivered.

**Fix:**
- Verify `RESEND_API_KEY` is set
- Check Resend account is active
- Verify sender domain (if custom)
- Check Resend dashboard for errors

---

### Issue: Background Jobs Not Running

**Symptom:** Daily jobs don't execute.

**Fix:**
- Verify `CRON_SECRET` is set
- Check `vercel.json` cron configuration
- Verify cron schedule syntax
- Check Vercel Cron logs

---

### Issue: Slow API Responses

**Symptom:** Pages load slowly.

**Fix:**
- Check database query performance
- Add indexes for slow queries
- Optimize API routes
- Check Supabase connection pooling

---

## 🔍 Debugging Tips

### 1. Check Vercel Logs

```bash
# Go to Vercel Dashboard → Your Project → Logs
# Filter by:
# - Function name
# - Time range
# - Error level
```

### 2. Check Supabase Logs

```bash
# Go to Supabase Dashboard → Logs
# Check for:
# - RLS policy violations
# - Slow queries
# - Connection errors
```

### 3. Test Locally

```bash
# Reproduce issue locally
npm run dev

# Check environment variables
cat .env.local

# Test API routes
curl http://localhost:3000/api/health
```

### 4. Verify Environment Variables

```bash
# Use verification script
./scripts/verify-deployment.sh

# Or check manually in Vercel
# Dashboard → Settings → Environment Variables
```

---

## 📋 Pre-Deployment Checklist

Before deploying, verify:

- [ ] All environment variables set in Vercel
- [ ] Database migrations run successfully
- [ ] Stripe keys are production keys
- [ ] `CRON_SECRET` is set and secure
- [ ] `NEXT_PUBLIC_APP_URL` matches domain
- [ ] RLS policies are enabled
- [ ] Webhook secrets match
- [ ] Build succeeds locally (`npm run build`)
- [ ] No TypeScript errors
- [ ] All tests pass (if any)

---

## 🆘 Emergency Rollback

If deployment breaks production:

1. **Revert Deployment**
   - Go to Vercel Dashboard → Deployments
   - Find last working deployment
   - Click "Promote to Production"

2. **Fix Issues**
   - Identify problem in logs
   - Fix in development
   - Test thoroughly
   - Redeploy

3. **Database Rollback**
   - If migrations broke database:
   - Restore from backup (if available)
   - Or manually fix affected tables

---

## 📚 Additional Resources

- [Vercel Troubleshooting](https://vercel.com/docs/troubleshooting)
- [Supabase Troubleshooting](https://supabase.com/docs/guides/troubleshooting)
- [Stripe Webhook Testing](https://stripe.com/docs/webhooks/test)

---

## 💡 Pro Tips

1. **Use Preview Deployments**
   - Test changes in preview before production
   - Verify environment variables work
   - Test critical flows

2. **Monitor Logs Regularly**
   - Check Vercel logs daily
   - Monitor error rates
   - Fix issues quickly

3. **Keep Migrations Simple**
   - One change per migration
   - Test migrations locally first
   - Document breaking changes

4. **Use Environment-Specific Configs**
   - Different keys for dev/prod
   - Test with production-like data
   - Verify all environments work

5. **Document Everything**
   - Keep deployment notes
   - Document gotchas
   - Update this guide as you learn
