# Gym Software Integrations

## Overview

This system uses an **Adapter Pattern** to integrate with external gym software (Mindbody, Glofox, etc.). The pattern allows us to:

1. **Mock data for development** - Test without real API access
2. **Easy API swap** - Switch from mock to real API by changing adapter instance
3. **Multiple providers** - Support different gym software without code duplication
4. **Read-only sync** - We don't write back to external systems (MVP principle)

## Architecture

```
┌─────────────────────────────────────────┐
│         Sync Service                     │
│  (lib/integrations/sync-service.ts)     │
│                                         │
│  - Syncs members                        │
│  - Syncs visits                         │
│  - Maps external → internal format      │
└─────────────────────────────────────────┘
                    │
                    │ uses
                    ▼
┌─────────────────────────────────────────┐
│      Adapter Interface                   │
│  (lib/integrations/base-adapter.ts)     │
│                                         │
│  - fetchMembers()                       │
│  - fetchMemberVisits()                   │
│  - fetchAllVisits()                     │
│  - testConnection()                     │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                      │
        ▼                      ▼
┌──────────────┐      ┌──────────────┐
│ Mindbody     │      │ Glofox       │
│ Adapter      │      │ Adapter      │
│ (Mock)       │      │ (Mock)       │
└──────────────┘      └──────────────┘
```

## Current Implementation

### Mock Adapters

Both Mindbody and Glofox adapters are currently **mock implementations** that generate realistic test data.

**Files:**
- `lib/integrations/mindbody-adapter.ts` - Mock Mindbody adapter
- `lib/integrations/glofox-adapter.ts` - Mock Glofox adapter
- `lib/integrations/mock-data.ts` - Mock data generators

**Features:**
- Generates 20 mock members per provider
- Varying activity levels (active, inactive, cancelled)
- Realistic visit/check-in history
- Simulates API delays
- Supports pagination and filtering

## Usage

### Sync Members via API

```bash
# Sync Mindbody members
POST /api/sync/members
{
  "provider": "mindbody",
  "syncVisits": true,
  "calculateRiskScores": true,
  "since": "2026-01-01",  // Optional: only sync updated since this date
  "dryRun": false         // Set to true to test without saving
}
```

### Sync Programmatically

```typescript
import { SyncService } from '@/lib/integrations/sync-service';
import { createMindbodyAdapter } from '@/lib/integrations/mindbody-adapter';

// Create adapter
const adapter = createMindbodyAdapter({
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
});

// Create sync service
const syncService = new SyncService(adapter, gymId);

// Sync members
const summary = await syncService.syncMembers({
  since: '2026-01-01',
  calculateRiskScores: true,
});

console.log(`Created: ${summary.created}, Updated: ${summary.updated}`);
```

## Swapping to Real APIs

### Step 1: Update Adapter Implementation

Replace mock data with real API calls in the adapter:

**Before (Mock):**
```typescript
async fetchMembers(): Promise<ExternalMember[]> {
  return this.mockData.members; // Mock data
}
```

**After (Real API):**
```typescript
async fetchMembers(): Promise<ExternalMember[]> {
  const response = await fetch(`${this.config.baseUrl}/clients`, {
    headers: {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
    },
  });
  
  const data = await response.json();
  
  // Map API response to ExternalMember format
  return data.clients.map((client: any) => ({
    externalId: client.Id.toString(),
    firstName: client.FirstName,
    lastName: client.LastName,
    email: client.Email,
    phone: client.MobilePhone,
    joinedDate: client.FirstAppointmentDate,
    lastVisitDate: client.LastAppointmentDate,
    status: mapStatus(client.Status),
    metadata: { source: 'mindbody', ...client },
  }));
}
```

### Step 2: Implement Authentication

Add OAuth or API key authentication:

```typescript
async testConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${this.config.baseUrl}/sites`, {
      headers: {
        'Authorization': `Bearer ${await this.getAccessToken()}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

private async getAccessToken(): Promise<string> {
  // Implement OAuth token refresh logic
  // Cache token to avoid excessive API calls
}
```

### Step 3: Handle API Errors

Add proper error handling:

```typescript
async fetchMembers(): Promise<ExternalMember[]> {
  try {
    const response = await fetch(...);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Refresh token and retry
        await this.refreshToken();
        return this.fetchMembers();
      }
      throw new Error(`API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    // Log error, retry logic, etc.
    throw error;
  }
}
```

### Step 4: Update Configuration

Store API credentials in gym settings (not environment variables):

```typescript
// Fetch from database
const { data: gym } = await supabase
  .from('gyms')
  .select('mindbody_api_key, mindbody_api_secret')
  .eq('id', gymId)
  .single();

const adapter = createMindbodyAdapter({
  apiKey: gym.mindbody_api_key,
  apiSecret: gym.mindbody_api_secret,
});
```

## Adding New Providers

### Step 1: Create Adapter

Create a new adapter file: `lib/integrations/new-provider-adapter.ts`

```typescript
import type { GymSoftwareAdapter, ExternalMember, ExternalVisit } from './base-adapter';

export class NewProviderAdapter implements GymSoftwareAdapter {
  getName(): string {
    return 'NewProvider';
  }

  async testConnection(): Promise<boolean> {
    // Implementation
  }

  async fetchMembers(): Promise<ExternalMember[]> {
    // Implementation
  }

  // ... other methods
}

export function createNewProviderAdapter(config?: AdapterConfig) {
  return new NewProviderAdapter(config);
}
```

### Step 2: Add to Sync Endpoint

Update `app/api/sync/members/route.ts`:

```typescript
import { createNewProviderAdapter } from '@/lib/integrations/new-provider-adapter';

// In POST handler:
case 'newprovider':
  adapter = createNewProviderAdapter({ ... });
  break;
```

### Step 3: Update Database

Add provider to `external_member_mappings.source` constraint:

```sql
ALTER TABLE external_member_mappings
  DROP CONSTRAINT external_member_mappings_source_check;

ALTER TABLE external_member_mappings
  ADD CONSTRAINT external_member_mappings_source_check
  CHECK (source IN ('mindbody', 'glofox', 'newprovider'));
```

## Data Flow

### Sync Process

1. **API Call** → `/api/sync/members`
2. **Create Adapter** → Based on provider (mindbody/glofox)
3. **Test Connection** → Verify API access
4. **Fetch Members** → Get members from external system
5. **Map Data** → Convert external format → internal format
6. **Check Existing** → Look up by external ID mapping
7. **Create/Update** → Insert new or update existing members
8. **Sync Visits** → Fetch and sync visit history
9. **Calculate Scores** → Recalculate risk/commitment scores

### External ID Mapping

The `external_member_mappings` table prevents duplicates:

```
external_member_mappings
├── gym_id (which gym)
├── external_id (external system's ID)
├── member_id (our internal ID)
└── source ('mindbody' | 'glofox')
```

**Why this matters:**
- Same member synced twice → Updates existing, doesn't create duplicate
- Multiple providers → Can sync from both Mindbody and Glofox
- Member changes external ID → Can track history

## Example Data

### Mindbody Mock Data

```json
{
  "externalId": "MB-1001",
  "firstName": "James",
  "lastName": "Smith",
  "email": "james.smith@example.com",
  "phone": "+441234567890",
  "joinedDate": "2025-06-15",
  "lastVisitDate": "2026-01-28",
  "status": "active",
  "metadata": {
    "source": "mindbody",
    "clientId": 1001
  }
}
```

### Glofox Mock Data

```json
{
  "externalId": "GF-abc123-def456",
  "firstName": "Alex",
  "lastName": "Taylor",
  "email": "alex.taylor@example.com",
  "phone": "+441234567891",
  "joinedDate": "2025-08-20",
  "lastVisitDate": "2026-01-27",
  "status": "active",
  "metadata": {
    "source": "glofox",
    "memberUuid": "GF-abc123-def456"
  }
}
```

## Sync Options

### Dry Run

Test sync without saving:

```json
{
  "provider": "mindbody",
  "dryRun": true
}
```

### Incremental Sync

Only sync members updated since date:

```json
{
  "provider": "mindbody",
  "since": "2026-01-01"
}
```

### Skip Risk Calculation

Faster sync without recalculating scores:

```json
{
  "provider": "mindbody",
  "calculateRiskScores": false
}
```

## Error Handling

The sync service handles:

- **Connection failures** → Returns error, doesn't crash
- **API rate limits** → Should implement retry logic (future)
- **Invalid data** → Skips invalid records, logs errors
- **Duplicate prevention** → Uses external ID mapping

## Future Enhancements

Potential additions (not in MVP):

- [ ] **Webhook support** → Real-time updates from external systems
- [ ] **Rate limiting** → Handle API rate limits gracefully
- [ ] **Retry logic** → Automatic retries for failed requests
- [ ] **Sync history** → Track sync runs and results
- [ ] **Conflict resolution** → Handle data conflicts intelligently
- [ ] **Bidirectional sync** → Write back to external systems (if needed)
- [ ] **Scheduled syncs** → Automatic daily/hourly syncs
- [ ] **Incremental sync** → Only sync changed records

## Testing

### Test Mock Adapters

```typescript
import { createMindbodyAdapter } from '@/lib/integrations/mindbody-adapter';

const adapter = createMindbodyAdapter();
const members = await adapter.fetchMembers();
console.log(`Fetched ${members.length} members`);
```

### Test Sync Service

```typescript
import { SyncService } from '@/lib/integrations/sync-service';

const syncService = new SyncService(adapter, gymId);
const summary = await syncService.syncMembers({ dryRun: true });
console.log(summary);
```

## Security Considerations

1. **API Keys** → Store encrypted in database, not environment variables
2. **Rate Limiting** → Implement rate limiting on sync endpoint
3. **Authentication** → Only owners can trigger syncs
4. **Read-Only** → We don't write back to external systems (MVP)
5. **Data Validation** → Validate all external data before saving

## See Also

- Adapter Interface: `lib/integrations/base-adapter.ts`
- Sync Service: `lib/integrations/sync-service.ts`
- Mock Data: `lib/integrations/mock-data.ts`
- API Endpoint: `app/api/sync/members/route.ts`
