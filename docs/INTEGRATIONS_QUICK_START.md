# Integrations Quick Start

## Sync Members from Mock Data

### Via API

```bash
curl -X POST http://localhost:3000/api/sync/members \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "mindbody",
    "syncVisits": true,
    "calculateRiskScores": true,
    "dryRun": false
  }'
```

### Response

```json
{
  "success": true,
  "provider": "mindbody",
  "dryRun": false,
  "members": {
    "total": 20,
    "created": 20,
    "updated": 0,
    "skipped": 0,
    "failed": 0,
    "errors": []
  },
  "visits": {
    "total": 150,
    "created": 150,
    "updated": 0,
    "skipped": 0,
    "failed": 0,
    "errors": []
  },
  "message": "Sync completed successfully"
}
```

## Test Dry Run

Test without saving to database:

```bash
curl -X POST http://localhost:3000/api/sync/members \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "glofox",
    "dryRun": true
  }'
```

## Providers

- `mindbody` - Mock Mindbody adapter
- `glofox` - Mock Glofox adapter

## Next Steps

1. **Run migration** → Apply `011_add_external_member_mappings.sql`
2. **Test sync** → Use API endpoint with `dryRun: true`
3. **Real sync** → Set `dryRun: false` to save data
4. **Swap to real API** → See `docs/INTEGRATIONS.md` for instructions

## See Full Documentation

- `docs/INTEGRATIONS.md` - Complete integration guide
- `lib/integrations/` - Adapter implementations
