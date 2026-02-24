# Scrapzee System Design Enhancement

## Current architecture analysis
- **Service boundaries** are clear (`auth`, `user`, `dealer`, `pricing`, `frontend`) and API-first.
- **Synchronous coupling** exists for token verification and pricing calculation in request flow.
- **No distributed cache** means repeat reads/calculations hit MySQL and app CPU every time.
- **No event backbone** means side effects (notifications, analytics, tracking) must be synchronous or bolted into request paths.

## Improvements added

### 1) Redis caching layer
Implemented in `pricing-service` for:
- Category list cache (`pricing:categories:all`)
- Category detail cache (`pricing:category:{id}`)
- Price calculation cache (`pricing:calculate:{category}:{quantity}:{location}`)

Design choices:
- **Cache-aside pattern** with TTL (`REDIS_TTL_SECONDS`, default 120s).
- **Targeted invalidation** when categories/prices are updated.
- **Graceful fallback**: if Redis is unavailable, service continues from DB.

### 2) RabbitMQ event bus
Implemented in `user-service` as a domain event publisher:
- Publishes `request.created`
- Publishes `request.status.updated`

Design choices:
- Topic exchange (`scrapzee.events`) for flexible subscriptions.
- Durable messages (`delivery_mode=2`) for better reliability.
- Non-blocking behavior: failures to publish do not fail API response.

## High-level target flow
1. User creates request in `user-service`.
2. `user-service` synchronously calculates estimate using `pricing-service`.
3. Request is persisted.
4. Event emitted to RabbitMQ (`request.created`).
5. Future consumers (notification, dealer matching, analytics) subscribe asynchronously.

## Future enhancement roadmap
1. Add **consumer service** (`notifications-service`) for SMS/email/push.
2. Add **dealer auto-assignment worker** consuming `request.created`.
3. Add **dead-letter exchange/queues** for poison messages.
4. Add **idempotency keys** for exactly-once effects in consumers.
5. Add **OpenTelemetry traces** across sync + async hops.
6. Add **Redis rate limiting** for auth and expensive endpoints.

## Operational notes
- Redis and RabbitMQ are deployed in Kubernetes base manifests.
- Backend network policy now allows `6379` and `5672` among backend-tier pods.
- Pricing cache behavior is observable via `"cache": "hit|miss"` in responses.
