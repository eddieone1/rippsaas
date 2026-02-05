# Background Jobs

## Overview

Background jobs run daily to keep data up-to-date and generate actionable tasks for coaches.

**Purpose:** Automate routine data processing tasks

## Jobs Implemented

### 1. Daily Commitment Score Recalculation
- **Schedule:** Daily at 2 AM UTC
- **Endpoint:** `POST /api/cron/commitment-scores`
- **Purpose:** Recalculate commitment scores for all active members
- **Why:** Scores change as member activity changes, need daily refresh

### 2. Daily At-Risk Detection
- **Schedule:** Daily at 3 AM UTC
- **Endpoint:** `POST /api/cron/at-risk-detection`
- **Purpose:** Recalculate churn risk scores for all active members
- **Why:** Risk levels change daily based on visit patterns

### 3. Daily Coach Action Generation
- **Schedule:** Daily at 4 AM UTC
- **Endpoint:** `POST /api/cron/coach-actions`
- **Purpose:** Generate daily actions for coaches based on assigned members
- **Why:** Coaches need fresh action lists every day

## Scheduling

Jobs are scheduled using **Vercel Cron** (configured in `vercel.json`):

```json
{
  "crons": [
    {
      "path": "/api/cron/commitment-scores",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/at-risk-detection",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/coach-actions",
      "schedule": "0 4 * * *"
    }
  ]
}
```

**Schedule Format:** Cron syntax (`minute hour day month weekday`)
- `0 2 * * *` = 2:00 AM UTC daily
- `0 3 * * *` = 3:00 AM UTC daily
- `0 4 * * *` = 4:00 AM UTC daily

**Why Staggered Times?**
- Prevents database overload
- Ensures commitment scores are calculated before at-risk detection
- Ensures at-risk detection completes before coach actions

## Safety Considerations

### 1. Authentication
- **Vercel Cron Secret:** Jobs require `CRON_SECRET` in Authorization header
- **Verification:** `verifyCronAuth()` checks the secret
- **Development:** Allows requests without secret in development mode

### 2. Error Handling
- **Batch Processing:** Members processed in batches of 50
- **Continue on Error:** Individual member errors don't stop the job
- **Error Collection:** All errors collected and returned in response

### 3. Timeout Protection
- **Default Timeout:** 10 minutes per job
- **Prevents Hanging:** Jobs that take too long are terminated
- **Configurable:** Can be adjusted per job

### 4. Idempotency
- **Coach Actions:** Only creates actions if they don't already exist
- **Score Updates:** Safe to run multiple times (overwrites previous scores)
- **No Duplicates:** Prevents duplicate actions for same member/coach/day

### 5. Rate Limiting
- **Batch Delays:** 100ms delay between batches
- **Database Protection:** Prevents overwhelming database connections
- **Scalable:** Can adjust batch size and delays as needed

### 6. Logging
- **Execution Logs:** All job executions logged with results
- **Error Logs:** Errors logged for monitoring
- **Duration Tracking:** Tracks how long each job takes

## Job Execution Flow

### Commitment Score Recalculation

```
1. Fetch all gyms
2. For each gym:
   a. Fetch all active members
   b. Process in batches of 50:
      - Fetch visit history for member
      - Calculate commitment score
      - Update member record
   c. Continue on errors
3. Return summary (members processed, updated, errors)
```

### At-Risk Detection

```
1. Fetch all gyms
2. For each gym:
   a. Fetch all active members
   b. Process in batches of 50:
      - Fetch visit count (last 30 days)
      - Calculate churn risk
      - Update member record (risk score, level)
   c. Continue on errors
3. Return summary (members processed, updated, errors)
```

### Coach Action Generation

```
1. Fetch all gyms
2. For each gym:
   a. Fetch all coaches
   b. For each coach:
      - Fetch assigned members
      - Filter active at-risk members
      - Check existing actions for today
      - Generate new actions (if not exist)
      - Create actions in database
   c. Continue on errors
3. Return summary (coaches processed, actions created, errors)
```

## Manual Testing

Jobs can be manually triggered for testing:

```bash
# Development only (GET method)
curl http://localhost:3000/api/cron/commitment-scores

# Production (requires CRON_SECRET)
curl -X POST http://your-domain.com/api/cron/commitment-scores \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Note:** GET method only works in development. Production requires POST with CRON_SECRET.

## Environment Variables

Required environment variable:

```env
CRON_SECRET=your-secret-key-here
```

**How to Set:**
1. Generate a secure random string
2. Add to Vercel environment variables
3. Vercel Cron will automatically include it in requests

## Monitoring

### Logs
- Check Vercel logs for job execution
- Look for `[JOB SUCCESS]` or `[JOB FAILURE]` prefixes
- Errors include full context (member IDs, error messages)

### Metrics to Monitor
- **Execution Time:** Should complete in < 10 minutes
- **Success Rate:** Should be 100% (individual errors OK)
- **Members Processed:** Should match active member count
- **Actions Created:** Should match coach assignments

## Future Enhancements

- [ ] Add job status tracking (database table)
- [ ] Add retry logic for failed jobs
- [ ] Add job execution history
- [ ] Add email notifications for job failures
- [ ] Add job execution dashboard
- [ ] Add Redis for idempotency checks
- [ ] Add job queue for large datasets

## Files Created

- `lib/jobs/commitment-scores.ts` - Commitment score recalculation logic
- `lib/jobs/at-risk-detection.ts` - At-risk detection logic
- `lib/jobs/coach-actions.ts` - Coach action generation logic
- `lib/jobs/safety.ts` - Safety utilities
- `app/api/cron/commitment-scores/route.ts` - Commitment scores endpoint
- `app/api/cron/at-risk-detection/route.ts` - At-risk detection endpoint
- `app/api/cron/coach-actions/route.ts` - Coach actions endpoint
- `vercel.json` - Vercel Cron configuration
- `docs/BACKGROUND_JOBS.md` - This documentation

## See Also

- Vercel Cron Docs: https://vercel.com/docs/cron-jobs
- Job Safety: `lib/jobs/safety.ts`
- Commitment Scores: `lib/jobs/commitment-scores.ts`
- At-Risk Detection: `lib/jobs/at-risk-detection.ts`
- Coach Actions: `lib/jobs/coach-actions.ts`
