# Microservices Migration Plan

**Document Created:** December 20, 2025  
**Status:** Future Planning  
**Current Architecture:** Monolithic NestJS Backend

---

## Executive Summary

This document outlines the analysis of the current Ship Reporting application architecture and provides a roadmap for potential microservices migration in the future.

---

## Current Architecture Overview

```
ship-reporting/
├── backend/                    # NestJS Monolithic API
│   └── src/
│       ├── auth/              # Authentication module
│       ├── users/             # User management
│       ├── vessels/           # Vessel management
│       ├── inspections/       # Inspection reports & entries
│       ├── audit/             # Audit logging
│       ├── organization/      # Organization settings
│       ├── upload/            # File uploads
│       └── prisma/            # Database client
├── frontend/                   # React + Refine Admin Panel
└── packages/
    └── prisma/                # Shared Prisma schema & client
```

---

## Microservices Readiness Assessment

### ✅ Strengths (What's Already Good)

| Aspect                       | Current State                                        | Notes                          |
| ---------------------------- | ---------------------------------------------------- | ------------------------------ |
| **Monorepo with Workspaces** | npm workspaces (`backend`, `frontend`, `packages/*`) | Easy to add new services       |
| **Shared Prisma Package**    | `@ship-reporting/prisma` is separate                 | Can be split per service later |
| **Modular Backend**          | NestJS modules with clear boundaries                 | Maps well to microservices     |
| **Clear Domain Boundaries**  | Each module has controller, service, DTOs            | Good separation of concerns    |
| **Containerized**            | Backend has Dockerfile                               | Ready for orchestration        |
| **Environment Config**       | Using ConfigModule with .env                         | Easy to externalize            |
| **Railway Deployment**       | Already configured                                   | Supports multiple services     |

### ⚠️ Areas Requiring Changes

| Issue                     | Current State                       | Required Change              |
| ------------------------- | ----------------------------------- | ---------------------------- |
| **Single Database**       | All modules share one PostgreSQL DB | Database-per-service pattern |
| **Tight Module Coupling** | Direct imports between modules      | Event-driven communication   |
| **No API Gateway**        | Frontend calls backend directly     | Add API Gateway layer        |
| **No Service Discovery**  | Not applicable (monolith)           | Kubernetes DNS or Consul     |
| **No Message Broker**     | Synchronous HTTP calls only         | Add RabbitMQ/Kafka/Redis     |
| **Shared Auth Guard**     | JWT guard in single service         | Centralized Auth Service     |
| **No Circuit Breakers**   | N/A                                 | Add resilience patterns      |

---

## Microservices Readiness Score: 7/10

The project is **well-positioned** for future microservices migration due to:

1. **NestJS Microservices Support** - Built-in support for TCP/Redis/NATS/RabbitMQ/Kafka
2. **Clean Module Structure** - Each module can become an independent service
3. **Monorepo Setup** - Easy to manage multiple services in one repository

---

## Proposed Microservices Architecture

### Target Service Decomposition

```
Current Module              →    Future Microservice
────────────────────────────────────────────────────
auth/                       →    auth-service
users/ + organization/      →    user-service
vessels/                    →    vessel-service
inspections/                →    inspection-service
audit/                      →    audit-service (event-driven)
upload/                     →    file-service
```

### Target Directory Structure

```
ship-reporting/
├── services/
│   ├── api-gateway/           # Kong/Traefik/NestJS Gateway
│   ├── auth-service/          # Authentication & Authorization
│   ├── user-service/          # Users & Organizations
│   ├── vessel-service/        # Vessel Management
│   ├── inspection-service/    # Inspections & Entries
│   ├── audit-service/         # Event-driven Audit Logging
│   └── file-service/          # File Upload/Storage
├── frontend/
├── packages/
│   ├── prisma/                # May split per service
│   ├── shared-types/          # Shared DTOs & Interfaces
│   └── shared-events/         # Event definitions
└── infrastructure/
    ├── docker-compose.yml
    └── k8s/                   # Kubernetes manifests
```

---

## Migration Phases

### Phase 1: Preparation (No Breaking Changes)

- [ ] Create `packages/shared-types` for common interfaces and DTOs
- [ ] Create `packages/shared-events` for event definitions
- [ ] Add Redis for caching and pub/sub
- [ ] Refactor audit module to use events instead of direct calls
- [ ] Add health check endpoints to all modules
- [ ] Implement correlation IDs for request tracing

### Phase 2: Extract First Service (Auth)

- [ ] Create standalone `auth-service`
- [ ] Implement JWT validation as middleware for other services
- [ ] Set up service-to-service authentication
- [ ] Add API Gateway (recommend: NestJS Gateway or Kong)
- [ ] Update frontend to route through gateway

### Phase 3: Extract Core Services

- [ ] Extract `user-service` (users + organizations)
- [ ] Extract `vessel-service`
- [ ] Implement inter-service communication via message broker
- [ ] Split database schemas per service
- [ ] Add circuit breakers (using @nestjs/terminus)

### Phase 4: Extract Remaining Services

- [ ] Extract `inspection-service`
- [ ] Extract `audit-service` (fully event-driven)
- [ ] Extract `file-service`
- [ ] Implement saga pattern for distributed transactions
- [ ] Add distributed tracing (Jaeger/Zipkin)

### Phase 5: Production Readiness

- [ ] Set up Kubernetes deployment
- [ ] Configure auto-scaling per service
- [ ] Implement centralized logging (ELK Stack)
- [ ] Add monitoring and alerting (Prometheus/Grafana)
- [ ] Document API contracts (OpenAPI/AsyncAPI)

---

## Technology Recommendations

### Message Broker Options

| Option            | Pros                               | Cons                         | Recommendation |
| ----------------- | ---------------------------------- | ---------------------------- | -------------- |
| **Redis Pub/Sub** | Simple, already useful for caching | No persistence, at-most-once | ✅ Start here  |
| **RabbitMQ**      | Reliable, good routing             | More complex                 | Phase 2+       |
| **Kafka**         | High throughput, event sourcing    | Overkill for small scale     | Future         |

### API Gateway Options

| Option             | Pros                         | Cons                    | Recommendation |
| ------------------ | ---------------------------- | ----------------------- | -------------- |
| **NestJS Gateway** | Same stack, easy integration | Custom implementation   | ✅ Recommended |
| **Kong**           | Feature-rich, plugins        | Separate infrastructure | Production     |
| **Traefik**        | Cloud-native, auto-discovery | Learning curve          | Kubernetes     |

### Container Orchestration

| Option             | Pros                     | Cons                 | Recommendation  |
| ------------------ | ------------------------ | -------------------- | --------------- |
| **Docker Compose** | Simple, local dev        | Not production-ready | ✅ Development  |
| **Railway**        | Already configured, easy | Limited control      | ✅ Current prod |
| **Kubernetes**     | Full control, scalable   | Complex              | Future growth   |

---

## Quick Wins (Implement Now)

These changes prepare for microservices without breaking current functionality:

### 1. Add Shared Packages

```bash
# Create shared types package
mkdir -p packages/shared-types/src
# Create shared events package
mkdir -p packages/shared-events/src
```

### 2. Add Redis Support

```bash
npm install @nestjs/cache-manager cache-manager cache-manager-redis-store redis
```

### 3. Add Health Checks

```bash
npm install @nestjs/terminus
```

### 4. Event-Driven Audit (Example)

```typescript
// Instead of direct audit calls:
await this.auditService.log(...);

// Use events:
this.eventEmitter.emit('audit.log', { ... });
```

---

## Estimated Timeline

| Phase                  | Duration  | Dependencies |
| ---------------------- | --------- | ------------ |
| Phase 1: Preparation   | 2-3 weeks | None         |
| Phase 2: Auth Service  | 2-3 weeks | Phase 1      |
| Phase 3: Core Services | 4-6 weeks | Phase 2      |
| Phase 4: Remaining     | 3-4 weeks | Phase 3      |
| Phase 5: Production    | 2-4 weeks | Phase 4      |

**Total Estimated Time:** 3-5 months (depending on team size and priorities)

---

## References

- [NestJS Microservices Documentation](https://docs.nestjs.com/microservices/basics)
- [12-Factor App Methodology](https://12factor.net/)
- [Microservices Patterns by Chris Richardson](https://microservices.io/patterns/)
- [Database per Service Pattern](https://microservices.io/patterns/data/database-per-service.html)

---

## Notes

- Current monolithic architecture is **perfectly fine** for the current scale
- Only migrate to microservices when there's a clear need (scaling, team growth, deployment independence)
- Consider the operational complexity before migrating
- Start with the "Strangler Fig" pattern - gradually extract services while keeping the monolith running

---

_This document will be updated as the project evolves and requirements change._
