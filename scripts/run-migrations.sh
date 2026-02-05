#!/bin/bash

# Database Migration Runner
# This script helps run migrations in order
# Usage: ./scripts/run-migrations.sh

set -e

echo "🚀 Starting database migrations..."

# Check if Supabase URL is set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ ERROR: NEXT_PUBLIC_SUPABASE_URL not set"
    echo "Please set it in your environment or .env.local file"
    exit 1
fi

# Migration files in order
MIGRATIONS=(
    "001_initial_schema.sql"
    "005_add_branding_fields.sql"
    "006_add_client_count_range.sql"
    "007_add_membership_types.sql"
    "008_add_tour_completion_tracking.sql"
    "009_add_intervention_effectiveness_tracking.sql"
    "010_add_coach_role_and_org_invites.sql"
    "011_add_external_member_mappings.sql"
    "012_add_coach_assignments.sql"
    "013_add_coach_actions.sql"
)

echo ""
echo "📋 Migration files to run:"
for migration in "${MIGRATIONS[@]}"; do
    echo "  - $migration"
done

echo ""
echo "⚠️  IMPORTANT:"
echo "This script lists migrations in order."
echo "You must run them manually in Supabase SQL Editor:"
echo ""
echo "1. Go to Supabase Dashboard → SQL Editor"
echo "2. Copy contents of each migration file"
echo "3. Paste and execute in order"
echo "4. Verify each migration completes successfully"
echo ""
echo "Migration files are in: supabase/migrations/"
echo ""

# Check if files exist
echo "✅ Checking migration files exist..."
for migration in "${MIGRATIONS[@]}"; do
    if [ ! -f "supabase/migrations/$migration" ]; then
        echo "❌ ERROR: Migration file not found: supabase/migrations/$migration"
        exit 1
    fi
done

echo ""
echo "✅ All migration files found!"
echo ""
echo "Next steps:"
echo "1. Open Supabase Dashboard → SQL Editor"
echo "2. Run migrations in order (001 → 013)"
echo "3. Verify each completes successfully"
echo ""
