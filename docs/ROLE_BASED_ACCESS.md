# Role-Based Access Control (RBAC)

## Overview

This SaaS implements a simple two-role system for organization access:
- **Owner**: Full access to all features including settings, billing, and user management
- **Coach**: Limited access focused on member management and campaign execution

## Role Definitions

### Owner Role
**Full access to:**
- ✅ Organization settings (gym info, branding, membership types)
- ✅ Billing and subscription management
- ✅ Invite users to organization
- ✅ View all members and their data
- ✅ Create and run campaigns
- ✅ View insights and analytics
- ✅ Delete organization data

**Use case:** Gym owners, administrators, or primary account holders who need full control.

### Coach Role
**Can access:**
- ✅ View members and their risk scores
- ✅ Run campaigns (send emails/SMS)
- ✅ View insights and analytics
- ✅ Update member information (last visit, status)

**Cannot access:**
- ❌ Organization settings
- ❌ Billing/subscription
- ❌ Invite users
- ❌ Delete critical data

**Use case:** Staff members, trainers, or coaches who need to engage with members but shouldn't manage organization settings.

## Implementation

### Database Schema

```sql
-- Users table with role constraint
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  gym_id UUID NOT NULL REFERENCES gyms(id),
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'coach')),
  ...
);
```

### Role Utilities (`lib/auth/roles.ts`)

```typescript
// Check if user has specific role
hasRole(userRole, 'owner')

// Check if user has minimum role level
hasMinimumRole(userRole, 'coach') // Returns true for both owner and coach

// Check if user can perform action
canPerformAction(userRole, 'manage_settings') // Only owners
canPerformAction(userRole, 'view_members') // Both owners and coaches
```

### Route Guards (`lib/auth/guards.ts`)

**Usage in Server Components:**

```typescript
import { requireRole, requireAction } from '@/lib/auth/guards';

// Require specific role
export default async function SettingsPage() {
  const { userProfile, gymId } = await requireRole('owner');
  // Component code...
}

// Require ability to perform action
export default async function CampaignsPage() {
  const { userProfile, gymId } = await requireAction('run_campaigns');
  // Component code...
}
```

**Guards automatically:**
- Redirect to `/login` if not authenticated
- Redirect to `/onboarding/gym-info` if no organization
- Redirect to `/dashboard` if insufficient permissions

### API Route Protection

```typescript
// app/api/organizations/invite/route.ts
export async function POST(request: Request) {
  // Only owners can invite
  const { userProfile } = await requireAction('invite_users');
  // ... rest of handler
}
```

## Access Control Matrix

| Feature | Owner | Coach |
|---------|-------|-------|
| View Dashboard | ✅ | ✅ |
| View Members | ✅ | ✅ |
| Update Member Data | ✅ | ✅ |
| Run Campaigns | ✅ | ✅ |
| View Insights | ✅ | ✅ |
| Organization Settings | ✅ | ❌ |
| Billing Management | ✅ | ❌ |
| Invite Users | ✅ | ❌ |
| Delete Data | ✅ | ❌ |

## Organization Flow

### Creating Organization
1. User signs up → Creates new gym automatically
2. User assigned `owner` role
3. Redirected to onboarding to complete gym setup

### Joining Organization
1. Owner creates invite via `/api/organizations/invite`
2. Invite sent to email with token
3. User signs up/logs in
4. User visits `/join?token=xxx` or sees pending invites
5. User accepts invite → Assigned `coach` role (or `owner` if specified)
6. User profile linked to organization

### Invite System

**Creating Invites:**
- Only owners can create invites
- Invites expire after 7 days
- Invites are email-specific (must match user's email)
- Token-based system for security

**Accepting Invites:**
- User must be logged in
- Email must match invite email
- Invite must not be expired
- User must not already belong to an organization

## Security Considerations

### Row Level Security (RLS)
- Database policies ensure users can only access their organization's data
- Policies check both `gym_id` and `role` where appropriate
- Admin client bypasses RLS only for system operations

### Route Protection
- All protected routes use `requireAuth()` or role-specific guards
- API routes validate permissions server-side
- Client-side checks are for UX only, not security

### Best Practices
1. **Always check permissions server-side** - Never trust client-side checks
2. **Use guards consistently** - Don't bypass guards for "convenience"
3. **Fail securely** - Redirect to dashboard, don't show error details
4. **Log access attempts** - Track failed permission checks (future enhancement)

## UI Indicators

### Role Badge
- Display user role in navbar/profile
- Visual indicator of permissions
- Helps users understand their access level

### Conditional Rendering
```typescript
// Hide settings link for coaches
{userProfile.role === 'owner' && (
  <Link href="/settings">Settings</Link>
)}
```

## Migration Notes

### From Admin to Coach
- Existing `admin` roles automatically migrated to `coach` in migration `010_add_coach_role_and_org_invites.sql`
- No data loss, just role rename
- All existing functionality preserved

### Backward Compatibility
- Code checks for both `admin` and `coach` during transition (if needed)
- Database constraint enforces only `owner` and `coach`

## Future Enhancements

Potential additions (not in MVP):
- **Custom roles** - Define custom permission sets per organization
- **Role hierarchy** - Multiple role levels (e.g., Senior Coach, Junior Coach)
- **Permission granularity** - Fine-grained permissions (e.g., "can edit member email")
- **Audit logging** - Track who did what and when
- **Role-based UI** - Completely different interfaces per role

## Decision Rationale

**Why only two roles?**
- MVP principle: Start simple, add complexity when needed
- Most gyms have clear owner/staff distinction
- Easy to understand and implement
- Can expand later without breaking changes

**Why Owner > Coach hierarchy?**
- Owners need full control (it's their business)
- Coaches need member engagement tools (core value prop)
- Clear separation of concerns
- Prevents accidental data loss by coaches

**Why not more granular permissions?**
- Over-engineering for MVP stage
- Two roles cover 90% of use cases
- Can add granularity later based on real needs
- Simpler = faster development = faster to market
