# At-Risk Members Page - Performance Considerations

## Overview

The At-Risk Members page is designed for performance at scale. This document explains the performance optimizations implemented.

## Database Optimizations

### 1. Indexes

**Composite Index for Common Queries:**
```sql
CREATE INDEX idx_members_at_risk_query 
  ON members(gym_id, status, churn_risk_level, commitment_score DESC NULLS LAST)
  WHERE status = 'active' AND churn_risk_level IN ('high', 'medium');
```

**Why this index:**
- Covers the most common query pattern (at-risk active members)
- Partial index (WHERE clause) reduces index size
- Includes all filter and sort columns
- DESC NULLS LAST handles commitment_score sorting

**Commitment Score Index:**
```sql
CREATE INDEX idx_members_commitment_score 
  ON members(commitment_score DESC NULLS LAST);
```

**Why:**
- Fast sorting by commitment score
- NULLS LAST ensures members without scores appear last

### 2. Stored Commitment Scores

**Decision:** Store `commitment_score` in database instead of calculating on every query.

**Why:**
- Calculation is expensive (requires visit history)
- Scores don't change frequently
- Enables fast sorting and filtering

**Update Strategy:**
- Calculate on-demand when viewing member
- Background job can recalculate daily
- Cache for 24 hours (recalculate if older)

### 3. Pagination

**Implementation:**
- Default: 50 members per page
- Max: 100 members per page
- Server-side pagination (not client-side)

**Why:**
- Reduces data transfer
- Faster queries (less data to process)
- Better user experience (faster page loads)

## Query Optimizations

### 1. Selective Field Fetching

**Only fetch needed fields:**
```typescript
.select(`
  id,
  first_name,
  last_name,
  email,
  phone,
  joined_date,
  last_visit_date,
  status,
  churn_risk_score,
  churn_risk_level,
  commitment_score,
  commitment_score_calculated_at
`)
```

**Why:**
- Reduces data transfer
- Faster queries
- Less memory usage

### 2. Efficient Coach Lookup

**Strategy:** Single query for all coach assignments, then map in memory.

**Why:**
- Avoids N+1 query problem
- Single database round trip
- Fast in-memory lookup

### 3. Lazy Commitment Score Calculation

**Strategy:** Only calculate scores for members without recent scores.

**Implementation:**
```typescript
const membersNeedingScore = members.filter(
  (m) => !m.commitment_score || 
  !m.commitment_score_calculated_at ||
  new Date(m.commitment_score_calculated_at) < oneDayAgo
);
```

**Why:**
- Avoids unnecessary calculations
- Only calculates when needed
- Background updates keep scores fresh

## API Optimizations

### 1. Single Endpoint

**One endpoint for all data:**
- Members
- Coach assignments
- Commitment scores
- Pagination metadata

**Why:**
- Reduces HTTP requests
- Faster page loads
- Simpler client code

### 2. Parallel Updates

**Commitment score updates:**
```typescript
Promise.all(updates).catch((err) => {
  console.error('Failed to update commitment scores:', err);
});
```

**Why:**
- Fire and forget (non-blocking)
- Doesn't slow down response
- Updates happen in background

### 3. Efficient Sorting

**Server-side sorting:**
- Database handles sorting (faster than JavaScript)
- Uses indexes for optimal performance
- Secondary sort for consistent ordering

## Client-Side Optimizations

### 1. URL State Management

**State in URL:**
- Filters, sorting, pagination in URL
- Shareable links
- Browser back/forward works
- No client-side state management overhead

### 2. Debounced Updates

**Filter changes:**
- Reset to page 1 automatically
- Single fetch per filter change
- No unnecessary requests

### 3. Loading States

**Skeleton screens:**
- Shows structure while loading
- Reduces perceived wait time
- Better UX than spinners

## Performance Benchmarks

### Expected Performance

**Small gym (<100 members):**
- Page load: <200ms
- Filter/sort: <100ms
- Pagination: <100ms

**Medium gym (100-500 members):**
- Page load: <500ms
- Filter/sort: <200ms
- Pagination: <200ms

**Large gym (500+ members):**
- Page load: <1000ms
- Filter/sort: <500ms
- Pagination: <300ms

### Bottlenecks

**Potential bottlenecks:**
1. Commitment score calculation (if many members need scores)
2. Large result sets (mitigated by pagination)
3. Coach assignment queries (mitigated by single query)

## Scalability Considerations

### Current Limits

- **Pagination:** Max 100 members per page
- **Score calculation:** Batch of 50 members at a time
- **Cache duration:** 24 hours for commitment scores

### Future Optimizations

If performance becomes an issue:

1. **Background Job for Scores**
   - Calculate scores nightly
   - Keep all scores fresh
   - No on-demand calculation needed

2. **Redis Caching**
   - Cache filtered/sorted results
   - Invalidate on member updates
   - Faster repeated queries

3. **Database Read Replicas**
   - Separate read/write databases
   - Scale reads horizontally
   - Better for large gyms

4. **Materialized Views**
   - Pre-computed at-risk member lists
   - Updated periodically
   - Instant queries

## Monitoring

### Key Metrics to Track

1. **API Response Time**
   - Target: <500ms for 95th percentile
   - Alert if >1000ms

2. **Database Query Time**
   - Target: <200ms
   - Alert if >500ms

3. **Score Calculation Time**
   - Target: <100ms per member
   - Alert if >500ms per member

4. **Cache Hit Rate**
   - Target: >80% for commitment scores
   - Alert if <50%

## Best Practices

### For Developers

1. **Always use pagination** - Don't fetch all members
2. **Use indexes** - Check query plans
3. **Cache scores** - Don't recalculate unnecessarily
4. **Monitor performance** - Track metrics
5. **Optimize queries** - Use EXPLAIN ANALYZE

### For Users

1. **Use filters** - Narrow down results
2. **Use sorting** - Find what you need faster
3. **Use pagination** - Don't try to view all at once

## See Also

- API Endpoint: `app/api/members/at-risk/route.ts`
- Table Component: `components/members/AtRiskMembersTable.tsx`
- Database Migration: `supabase/migrations/012_add_coach_assignments.sql`
