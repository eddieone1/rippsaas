# Authentication and Organization Setup

## Overview

This document explains the authentication and organization management system implemented for the Retention Intelligence SaaS.

## Features Implemented

### ✅ Login / Signup
- Email/password authentication via Supabase Auth
- Email verification flow
- Password reset functionality
- Session management via middleware

### ✅ Create or Join Organization
- **Create**: New users automatically create a gym organization on signup
- **Join**: Users can join existing organizations via invite tokens
- Invite system with email-based tokens
- Pending invites shown on join page

### ✅ Role Assignment
- **Owner**: Assigned when creating new organization
- **Coach**: Assigned when joining via invite (default) or specified by inviter
- Roles stored in `users` table with constraint validation

### ✅ Route Protection by Role
- Server-side guards using `requireRole()` and `requireAction()`
- Automatic redirects for unauthorized access
- Role-based UI rendering (e.g., Settings link only for owners)

## File Structure

```
lib/auth/
├── roles.ts          # Role utilities and permission checks
└── guards.ts         # Route guards for Server Components

app/
├── (auth)/
│   ├── login/        # Login page
│   ├── signup/       # Signup page (creates org)
│   └── join/          # Join organization page
├── (protected)/     # Protected routes (require auth)
│   └── settings/     # Owner-only route
└── api/
    └── organizations/
        ├── invite/   # Create invite (owner only)
        ├── join/      # Accept invite
        └── invites/   # Get pending invites

components/
├── auth/
│   ├── LoginForm.tsx
│   ├── SignupForm.tsx
│   ├── JoinOrganizationForm.tsx
│   └── RoleBadge.tsx
└── layout/
    ├── Navbar.tsx     # Shows role badge, conditional Settings link
    └── NavbarClient.tsx

supabase/migrations/
└── 010_add_coach_role_and_org_invites.sql
```

## Usage Examples

### Protecting a Route (Owner Only)

```typescript
// app/(protected)/settings/page.tsx
import { requireAction } from '@/lib/auth/guards';

export default async function SettingsPage() {
  const { userProfile, gymId } = await requireAction('manage_settings');
  // Only owners can reach here
}
```

### Protecting a Route (Any Authenticated User)

```typescript
import { requireAuth } from '@/lib/auth/guards';

export default async function DashboardPage() {
  const { userProfile, gymId } = await requireAuth();
  // Any authenticated user can reach here
}
```

### Conditional UI Rendering

```typescript
// components/layout/NavbarClient.tsx
{userRole === 'owner' && (
  <Link href="/settings">Settings</Link>
)}
```

### Checking Permissions in API Routes

```typescript
// app/api/organizations/invite/route.ts
export async function POST(request: Request) {
  const { userProfile } = await requireAction('invite_users');
  // Only owners can create invites
}
```

## User Flows

### Flow 1: Create New Organization

1. User visits `/signup`
2. Fills out form (email, password, full name, client count)
3. Submits → Creates auth user + gym + user profile with `owner` role
4. Redirected to `/onboarding/gym-info` to complete setup

### Flow 2: Join Existing Organization

**Option A: Via Invite Token**
1. Owner creates invite via API (`POST /api/organizations/invite`)
2. Invite sent to email with token
3. User signs up/logs in
4. User visits `/join?token=xxx`
5. Accepts invite → User profile created with `coach` role
6. Redirected to `/dashboard`

**Option B: Via Pending Invites**
1. User signs up/logs in
2. User visits `/join` (no token)
3. System shows pending invites for user's email
4. User clicks "Accept" → Joins organization
5. Redirected to `/dashboard`

### Flow 3: Login with Existing Account

1. User visits `/login`
2. Enters email/password
3. If has invite token in URL, redirected to `/join?token=xxx`
4. Otherwise, redirected to `/dashboard`

## API Endpoints

### POST `/api/organizations/invite`
Create an organization invite (owner only)

**Request:**
```json
{
  "email": "coach@example.com",
  "role": "coach"
}
```

**Response:**
```json
{
  "success": true,
  "invite": {
    "id": "uuid",
    "email": "coach@example.com",
    "role": "coach",
    "expires_at": "2026-02-05T00:00:00Z",
    "invite_link": "http://localhost:3000/join?token=abc123..."
  }
}
```

### POST `/api/organizations/join`
Accept an organization invite

**Request:**
```json
{
  "token": "invite-token-here"
}
```

**Response:**
```json
{
  "success": true,
  "gym": { "id": "uuid", "name": "My Gym" },
  "role": "coach"
}
```

### GET `/api/organizations/invites`
Get pending invites for current user's email

**Response:**
```json
{
  "invites": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "coach",
      "expires_at": "2026-02-05T00:00:00Z",
      "gyms": { "name": "My Gym" },
      "users": { "full_name": "Owner Name" }
    }
  ]
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  gym_id UUID NOT NULL REFERENCES gyms(id),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'coach')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Organization Invites Table
```sql
CREATE TABLE organization_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_id UUID NOT NULL REFERENCES gyms(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'coach' CHECK (role IN ('owner', 'coach')),
  invited_by UUID NOT NULL REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Security Considerations

1. **Invite Tokens**: 64-character hex tokens, cryptographically random
2. **Email Matching**: Invites are email-specific (must match user's email)
3. **Expiration**: Invites expire after 7 days
4. **Single Organization**: Users can only belong to one organization
5. **Server-Side Validation**: All permission checks happen server-side
6. **RLS Policies**: Database-level security via Row Level Security

## Testing the Implementation

### Test Create Organization
1. Visit `/signup`
2. Create account
3. Verify redirected to onboarding
4. Check user has `owner` role

### Test Join Organization
1. As owner, create invite: `POST /api/organizations/invite`
2. Copy invite token
3. Logout or use incognito
4. Sign up with invited email
5. Visit `/join?token=<token>`
6. Accept invite
7. Verify user has `coach` role

### Test Role Protection
1. As coach, try to visit `/settings`
2. Should redirect to `/dashboard`
3. Settings link should not appear in navbar

## Next Steps (Future Enhancements)

- [ ] Email notifications for invites
- [ ] Invite management UI (view/revoke invites)
- [ ] Multiple organizations per user (if needed)
- [ ] Role change requests
- [ ] Audit logging for role changes
- [ ] Custom role permissions per organization
