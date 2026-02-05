#!/bin/bash

# Deployment Verification Script
# Checks that all required environment variables and configurations are set
# Usage: ./scripts/verify-deployment.sh

set -e

echo "🔍 Verifying deployment configuration..."
echo ""

ERRORS=0

# Check environment variables
check_env_var() {
    if [ -z "${!1}" ]; then
        echo "❌ Missing: $1"
        ERRORS=$((ERRORS + 1))
    else
        echo "✅ Found: $1"
    fi
}

echo "📋 Checking environment variables..."
check_env_var "NEXT_PUBLIC_SUPABASE_URL"
check_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY"
check_env_var "SUPABASE_SERVICE_ROLE_KEY"
check_env_var "NEXT_PUBLIC_APP_URL"
check_env_var "CRON_SECRET"
check_env_var "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
check_env_var "STRIPE_SECRET_KEY"
check_env_var "STRIPE_WEBHOOK_SECRET"
check_env_var "RESEND_API_KEY"

echo ""

# Check if URLs are production URLs
if [[ "$NEXT_PUBLIC_SUPABASE_URL" == *"localhost"* ]] || [[ "$NEXT_PUBLIC_SUPABASE_URL" == *"127.0.0.1"* ]]; then
    echo "⚠️  WARNING: NEXT_PUBLIC_SUPABASE_URL looks like localhost"
fi

if [[ "$NEXT_PUBLIC_APP_URL" == *"localhost"* ]] || [[ "$NEXT_PUBLIC_APP_URL" == *"127.0.0.1"* ]]; then
    echo "⚠️  WARNING: NEXT_PUBLIC_APP_URL looks like localhost"
fi

# Check if Stripe keys are production keys
if [[ "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" == *"pk_test"* ]]; then
    echo "⚠️  WARNING: Using Stripe test keys (should be pk_live_... for production)"
fi

if [[ "$STRIPE_SECRET_KEY" == *"sk_test"* ]]; then
    echo "⚠️  WARNING: Using Stripe test keys (should be sk_live_... for production)"
fi

echo ""

# Check CRON_SECRET length
if [ ${#CRON_SECRET} -lt 32 ]; then
    echo "⚠️  WARNING: CRON_SECRET should be at least 32 characters"
fi

echo ""

# Check vercel.json exists
if [ -f "vercel.json" ]; then
    echo "✅ Found: vercel.json"
else
    echo "❌ Missing: vercel.json"
    ERRORS=$((ERRORS + 1))
fi

# Check migration files exist
echo ""
echo "📋 Checking migration files..."
MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
if [ "$MIGRATION_COUNT" -gt 0 ]; then
    echo "✅ Found $MIGRATION_COUNT migration files"
else
    echo "❌ No migration files found"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Summary
if [ $ERRORS -eq 0 ]; then
    echo "✅ All checks passed! Ready for deployment."
    exit 0
else
    echo "❌ Found $ERRORS error(s). Please fix before deploying."
    exit 1
fi
