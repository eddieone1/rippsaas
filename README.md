# floCRM - MVP

A SaaS application to help small UK gyms retain members through automated engagement campaigns.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (server actions + route handlers)
- **Database**: Supabase Postgres (multi-tenant with `gym_id` isolation)
- **Auth**: Supabase Auth (email/password)
- **Payments**: Stripe (subscriptions)
- **Email**: Resend API
- **Deployment**: Vercel (frontend) + Supabase (database)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Stripe account
- Resend account

### Setup

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Copy the environment variables example:

```bash
cp .env.local.example .env.local
```

3. Set up your Supabase project:

   - Create a new Supabase project
   - Run the migration in `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor
   - Copy your Supabase URL and anon key to `.env.local`

4. Configure your API keys in `.env.local`:

   - Supabase keys (URL, anon key, service role key)
   - Stripe keys (publishable key, secret key, webhook secret)
   - Resend API key

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, signup)
│   ├── (protected)/       # Protected routes (dashboard, members, etc.)
│   ├── onboarding/        # Onboarding flow
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── supabase/         # Supabase client utilities
│   ├── stripe/           # Stripe utilities
│   ├── email/            # Email utilities (Resend)
│   └── churn-risk.ts     # Churn risk calculation
├── types/                # TypeScript types
└── supabase/             # Supabase migrations
```

## Database Schema

The database is multi-tenant with all tables using `gym_id` for isolation. Row-level security (RLS) policies ensure users can only access data from their own gym.

See `supabase/migrations/001_initial_schema.sql` for the complete schema.

## Features

### MVP Features

- ✅ **Authentication**: Signup, login, forgot password, reset password with email verification
- ✅ **Member Management**: CSV import, member list with filters (status, risk level, search), member detail pages
- ✅ **Enhanced Churn Risk Calculation**: Multi-factor scoring including attendance (40%), payment patterns (20%), booking frequency (12%), engagement (3%), proximity (12%), age (8%), employment/student status (5%)
- ✅ **Retention Dashboard**: Stats cards, members at risk table, campaign metrics
- ✅ **Campaign Management**: Create campaigns with Email/SMS options, template or custom messages, quick run buttons (21+, 30+, 60+ days inactive)
- ✅ **Email Functionality**: Resend API integration, engagement emails ("We miss you", "Bring a friend"), template variables
- ✅ **Settings**: Gym profile with address find functionality, subscription management, email templates view
- ✅ **Onboarding Flow**: Gym information setup, payment setup
- ✅ **Address & Proximity**: UK address lookup (Postcodes.io & Nominatim), distance calculation, proximity-based risk scoring
- ✅ **Member Demographics**: Age, employment status, student status tracking
- ✅ **Payment Tracking**: Payment status, days late, missed payments
- ✅ **Booking Frequency**: Visit tracking, frequency trends
- ✅ **Engagement Metrics**: Campaign opens, clicks, responses, engagement scores
- ✅ **Stripe Integration**: Subscription payments, webhook handling

### Recent Enhancements

- ✅ SMS campaign support (structure in place, ready for SMS provider integration)
- ✅ Editable template content in campaign modals
- ✅ UK date formatting (DD/MM/YYYY)
- ✅ Improved text visibility throughout
- ✅ Active page highlighting in navigation
- ✅ Consistent "days+" formatting for campaign triggers

### Excluded from MVP

- Mobile apps
- Advanced analytics dashboards
- Multiple gym software integrations
- ML/AI churn prediction (using rule-based system)
- A/B testing
- Custom branding
- Team collaboration

For a complete list of all features, see [FEATURES.md](./FEATURES.md)

## License

Private - All rights reserved
# gym-retention-saas
