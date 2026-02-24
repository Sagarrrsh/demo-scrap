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

- Database strategy options: `docs/database-options.md`


## Local test with Docker Compose
- Run from `services/`:
  - `docker compose up --build`
- Included infra for local validation:
  - MySQL (`3306`), Redis (`6379`), RabbitMQ AMQP (`5672`), RabbitMQ UI (`15672`)
- Services:
  - `auth-service` (`5001`), `pricing-service` (`5002`), `user-service` (`5003`), `dealer-service` (`5000`)


### Troubleshooting local restarts
- If `user-service` keeps restarting after dependency changes, force rebuild images:
  - `docker compose build --no-cache user-service pricing-service`
  - `docker compose up -d`
- Check logs:
  - `docker compose logs -f user-service`
- If RabbitMQ shows `unhealthy` during first boot, give it more warm-up time and check:
  - `docker compose logs -f rabbitmq`
  - `docker inspect --format='{{json .State.Health}}' rabbitmq | jq`
- Compose now gates `user-service` on RabbitMQ **started** (not healthy) to avoid false-negative health checks blocking app startup.
- RabbitMQ healthcheck uses lightweight `rabbitmq-diagnostics -q ping` (fewer false alarms than strict local alarm checks in constrained environments).
