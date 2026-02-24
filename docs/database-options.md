# Database options for faster delivery

## Recommended multi-database strategy

### 1) Keep MySQL for core transactions (system of record)
- Best for user/auth/request writes where consistency matters.
- Add connection pooling and indexing for predictable latency.

### 2) Redis for hot reads and computed pricing
- Already added for `pricing-service`.
- Keep TTL-based cache-aside and invalidation on updates.

### 3) Add ClickHouse for analytics workloads (new DB)
- Purpose: dashboards, BI queries, historical trends, dealer performance, demand forecasting.
- Why fast: columnar storage + vectorized execution = very fast aggregates on large datasets.
- Data flow:
  1. Services emit domain events to RabbitMQ.
  2. Analytics consumer ingests events and writes to ClickHouse.
  3. Reporting APIs read from ClickHouse (not MySQL).

## Architecture pattern upgrades

### Transactional outbox (implemented in `user-service`)
- Events are first written to MySQL in `outbox_events` in the same transaction as business data.
- A flusher publishes pending events to RabbitMQ.
- Prevents losing events when broker is temporarily unavailable.

### Read/write split (next step)
- Use MySQL primary for writes and replicas for reads.
- Move heavy list/history queries to replicas.

### API performance options
- Add pagination defaults and hard limits.
- Add query-level indexes for top access paths.
- Use async workers for non-critical side effects.
