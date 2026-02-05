# floCRM - Complete Feature List

This document lists all features implemented in the floCRM application to ensure nothing is lost.

## Authentication & User Management

### ✅ Sign Up
- **File**: `app/(auth)/signup/page.tsx`, `components/auth/SignupForm.tsx`
- Full name input field
- Email and password signup
- Email verification prompt (green text)
- Automatic redirect to onboarding after signup
- Back button to sign in page
- Form field order: Email, Password, Full Name, Confirm Password

### ✅ Sign In / Login
- **File**: `app/(auth)/login/page.tsx`, `components/auth/LoginForm.tsx`
- Email and password login
- Forgot password link
- Error messages: "Incorrect email or password", "No account exists with these details", "Email not confirmed"
- Back button to sign up page
- Redirects to dashboard after successful login

### ✅ Forgot Password
- **File**: `app/(auth)/forgot-password/page.tsx`, `components/auth/ForgotPasswordForm.tsx`
- Email input for password reset
- Uses Supabase `resetPasswordForEmail()`
- Success message with link back to login
- Back button to sign in page

### ✅ Reset Password
- **File**: `app/(auth)/reset-password/page.tsx`, `components/auth/ResetPasswordForm.tsx`
- New password and confirm password inputs
- Uses Supabase `updateUser()`
- Redirects to dashboard on success
- Back button to sign in page

## Onboarding Flow

### ✅ Gym Information Setup
- **File**: `app/onboarding/gym-info/page.tsx`, `components/onboarding/GymInfoForm.tsx`
- Gym name input
- Owner name input
- Address find functionality (UK Postcodes.io and Nominatim)
- Address fields: Address Line 1, Address Line 2, City, Postcode, Country
- Latitude/longitude geocoding
- Prevents double submission
- Redirects to payment setup after completion

### ✅ Payment Setup
- **File**: `app/onboarding/payment/page.tsx`, `components/onboarding/PaymentForm.tsx`
- Stripe payment integration
- Redirects to gym-info if gym not found

## Dashboard

### ✅ Retention Dashboard
- **File**: `app/(protected)/dashboard/page.tsx`
- **Components**: `components/dashboard/DashboardStats.tsx`, `components/dashboard/MembersTable.tsx`
- Stats cards showing:
  - Total members
  - Members at risk (high/medium)
  - Active campaigns
  - Campaigns sent this month
- Members table showing:
  - Name, Email, Address, Last Visit, Days Inactive, Risk Level
  - Distance from gym
  - View Details link
- Redirects to onboarding if gym not set up

## Members Management

### ✅ Members List Page
- **File**: `app/(protected)/members/page.tsx`, `components/members/MembersList.tsx`
- Full list of all members (active, inactive, cancelled)
- Status filters: All, Active, Inactive, Cancelled (with counts)
- Risk level filters: All, None, Low, Medium, High (with counts)
- Search by name, email, or phone
- Table columns:
  - Name, Contact, Status, Last Visit, Visits (30D), Payment, Age, Employment, Distance, Risk Level, Actions
- Upload Members button

### ✅ Member Detail Page
- **File**: `app/(protected)/members/[id]/page.tsx`, `components/members/MemberDetail.tsx`
- Complete member information:
  - Name, Email, Phone, Age
  - Joined Date, Last Visit, Days Since Last Visit
  - Billing Address (address_line1, address_line2, city, postcode, country)
  - Status, Churn Risk (score and level)
- Campaign history table
- Member actions sidebar

### ✅ Member Actions
- **File**: `components/members/MemberActions.tsx`
- Send Engagement Email (with modal for template selection)
  - "We Haven't Seen You in a While" option
  - "Bring a Friend on Us" option
- Mark as Re-engaged button
- Update Last Visit button

### ✅ CSV Upload
- **File**: `app/(protected)/members/upload/page.tsx`, `components/members/CSVUploadForm.tsx`
- CSV file upload
- Header normalization (handles variations like "First Name", "date_joined", etc.)
- Validates required columns: first_name, last_name, joined_date
- Supports optional columns: email, phone, age, billing_address, employment_status, student_status, date_of_birth
- Error reporting for invalid rows
- Geocodes billing addresses for distance calculation

## Campaigns

### ✅ Campaigns Page
- **File**: `app/(protected)/campaigns/page.tsx`, `components/campaigns/CampaignList.tsx`
- Create New Campaign button
- Quick run buttons: 21+ Days Inactive, 30+ Days Inactive, 60+ Days Inactive
- Campaign history table showing: Name, Channel, Trigger, Status, Created

### ✅ Create Campaign Form
- **File**: `components/campaigns/CreateCampaignForm.tsx`
- Campaign name input
- Channel selection: Email or SMS
- Trigger days input
- Message type: Use Template or Custom Message
- Template dropdown (filters by channel)
- Custom message fields (subject and body)
- Template preview when selected
- SMS character counter

### ✅ Run Campaign Modal
- **File**: `components/campaigns/RunCampaignModal.tsx`
- Opens when clicking quick run buttons
- Channel selection: Email or SMS
- Message type: Use Template or Custom Message
- Template selection with editable fields
- Custom message fields
- Editable template content (subject and body can be modified)

### ✅ Campaign API Routes
- **File**: `app/api/campaigns/create/route.ts` - Creates campaigns with templates or custom messages
- **File**: `app/api/campaigns/run/route.ts` - Runs campaigns, sends emails/SMS, supports both channels

## Settings

### ✅ Settings Page
- **File**: `app/(protected)/settings/page.tsx`, `components/settings/SettingsForm.tsx`
- Three tabs: Gym Profile, Subscription, Email Templates

### ✅ Gym Profile Tab
- Gym name input
- Full name input
- Gym address section:
  - Find Address button (UK Postcodes.io and Nominatim)
  - Address Line 1, Address Line 2, City, Postcode, Country
  - Auto-populates and geocodes on search
  - All fields editable

### ✅ Subscription Tab
- Subscription status badge
- Plan information
- Stripe integration note

### ✅ Email Templates Tab
- Lists all available templates
- Template names formatted consistently (e.g., "21+ Days Inactive")
- Shows subject and body for each template
- Template editing note

## Churn Risk Calculation

### ✅ Enhanced Churn Risk Algorithm
- **File**: `lib/churn-risk.ts`
- Multi-factor scoring:
  - Attendance (40% weight): Days since last visit, inactivity penalties
  - Payment patterns (20% weight): Payment status, days late, missed payments
  - Booking frequency (12% weight): Visits in last 30 days, trend analysis
  - Engagement (3% weight): Campaign opens, clicks, responses
  - Proximity (12% weight): Distance from gym
  - Age (8% weight): Age-based risk factors
  - Employment/Student status (5% weight): Student status increases risk
- Risk levels: None (<15), Low (15-39), Medium (40-64), High (65-100)
- Automatic high risk for 60+ days inactivity
- Stronger penalties for 50+ days inactivity

### ✅ Proximity Calculation
- **File**: `lib/proximity.ts`
- Haversine formula for distance calculation
- Geocoding using UK Postcodes.io and Nominatim
- Distance-based risk scoring
- Age-based risk scoring
- Employment/student status risk scoring

## Email Functionality

### ✅ Email Sending
- **File**: `lib/email/resend.ts`
- Resend API integration
- Template variable replacement
- Error handling with clear messages
- From: "FloCRM <noreply@flocrm.com>"

### ✅ Send Engagement Email
- **File**: `app/api/members/[id]/send-email/route.ts`
- Two email types:
  - "We Haven't Seen You in a While" - Friendly re-engagement
  - "Bring a Friend on Us" - Referral offer with free guest pass
- Template variable support: {{first_name}}, {{gym_name}}, {{last_visit_date}}

## UI/UX Features

### ✅ Navigation
- **File**: `components/layout/Navbar.tsx`, `components/layout/NavbarClient.tsx`
- FloCRM branding
- Active page highlighting (blue underline)
- Links: Dashboard, Members, Campaigns, Settings
- Logout button

### ✅ Date Formatting
- UK date format (DD/MM/YYYY) using `toLocaleDateString('en-GB')`
- Applied to all date displays throughout the app

### ✅ Text Visibility
- All form inputs use `text-gray-900` for dark, visible text
- White backgrounds (`bg-white`) for contrast
- Placeholder text uses `placeholder:text-gray-400`
- Labels use `text-gray-700` for good visibility

### ✅ UK English Spelling
- "personalise" instead of "personalize"
- "cancelled" instead of "canceled"
- Consistent UK spelling throughout

## Database Features

### ✅ Database Schema
- **File**: `supabase/migrations/001_initial_schema.sql`
- Multi-tenant architecture with `gym_id` isolation
- Tables: gyms, users, members, member_activities, campaign_templates, campaigns, campaign_sends
- Row-level security (RLS) policies
- Indexes for performance

### ✅ Enhanced Member Fields
- Address fields: address_line1, address_line2, city, postcode, country
- Billing address fields: billing_address_line1, billing_address_line2, billing_city, billing_postcode, billing_country
- Demographics: age, date_of_birth, employment_status, student_status, employment_industry
- Location: latitude, longitude, distance_from_gym_km
- Payment tracking: last_payment_date, payment_status, days_payment_late, missed_payments_count, monthly_payment_amount
- Booking frequency: total_visits, visits_last_30_days, visits_last_7_days, average_visits_per_week, booking_frequency_trend
- Engagement metrics: campaigns_received_count, campaigns_opened_count, campaigns_clicked_count, campaigns_responded_count, engagement_score, last_campaign_sent_at, last_campaign_opened_at

### ✅ Enhanced Gym Fields
- Address fields: address_line1, address_line2, city, postcode, country, latitude, longitude

## API Routes

### ✅ Authentication
- `/api/auth/signup` - User signup with gym creation

### ✅ Members
- `/api/members` - GET members with filtering (status, risk, search)
- `/api/members/upload` - POST CSV upload
- `/api/members/[id]/send-email` - POST send engagement email
- `/api/members/[id]/mark-re-engaged` - POST mark member as re-engaged
- `/api/members/[id]/update-last-visit` - POST update last visit date

### ✅ Campaigns
- `/api/campaigns/create` - POST create new campaign
- `/api/campaigns/run` - POST run campaign (email or SMS)

### ✅ Settings
- `/api/settings/profile` - POST update gym profile and address

### ✅ Onboarding
- `/api/onboarding/gym-info` - POST update gym information
- `/api/onboarding/payment` - POST handle payment setup

### ✅ Webhooks
- `/api/webhooks/stripe` - POST Stripe webhook handler

## Key Libraries & Utilities

### ✅ Supabase Clients
- `lib/supabase/client.ts` - Browser client
- `lib/supabase/server.ts` - Server client
- `lib/supabase/middleware.ts` - Middleware client
- `lib/supabase/admin.ts` - Admin client (bypasses RLS)
- `lib/supabase/get-gym-context.ts` - Gym context utility

### ✅ Utilities
- `lib/churn-risk.ts` - Churn risk calculation
- `lib/proximity.ts` - Distance calculation and demographic risk
- `lib/email/resend.ts` - Email sending and template replacement

## Styling & Theming

### ✅ Tailwind CSS
- Light mode enforced (no dark mode flashing)
- Consistent color scheme
- Responsive design
- UK date formatting

## Security Features

### ✅ Row-Level Security (RLS)
- Multi-tenant data isolation
- Users can only access their gym's data
- Admin client for system operations

### ✅ Authentication
- Supabase Auth integration
- Email verification
- Password reset flow
- Session management

## Error Handling

### ✅ User-Friendly Error Messages
- Clear validation errors
- API error messages
- Email verification prompts
- Form submission feedback

## All Files Verified Present

✅ All authentication components
✅ All member management components
✅ All campaign components
✅ All settings components
✅ All API routes
✅ All utility libraries
✅ Database migrations
✅ Type definitions

---

**Last Updated**: All features documented and verified as of current implementation.
