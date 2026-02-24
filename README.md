# demo-scrap

Enhanced microservice demo for scrap management.

## Added platform capabilities
- RabbitMQ-backed asynchronous domain events from `user-service`
- Redis-backed cache-aside acceleration in `pricing-service`
- Kubernetes manifests for Redis + RabbitMQ deployments/services
- System design analysis and roadmap in `docs/system-design.md`

## Quick references
- Architecture notes: `docs/system-design.md`
- Runtime config:
  - `user-service`: `RABBITMQ_URL`, `RABBITMQ_EXCHANGE`
  - `pricing-service`: `REDIS_URL`, `REDIS_TTL_SECONDS`

