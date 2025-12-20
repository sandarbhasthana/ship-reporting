# Multi-Organization Implementation Plan

## Overview

This document outlines the comprehensive plan to implement full multi-organization (multi-tenancy) support for the Ship Reporting application. The goal is to ensure complete data isolation between organizations while maintaining a scalable and secure architecture.

**Document Version:** 1.2
**Created:** 2025-12-20
**Last Updated:** 2025-12-20
**Status:** ✅ Phase 1 Complete

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Gap Analysis](#2-gap-analysis)
3. [Implementation Phases](#3-implementation-phases)
4. [Technical Specifications](#4-technical-specifications)
5. [Database Changes](#5-database-changes)
6. [API Changes](#6-api-changes)
7. [Frontend Changes](#7-frontend-changes)
8. [Testing Requirements](#8-testing-requirements)
9. [Migration Strategy](#9-migration-strategy)
10. [Security Considerations](#10-security-considerations)

---

## 1. Current State Analysis

### 1.1 Existing Schema Relationships

| Model              | Organization Link                  | Status      |
| ------------------ | ---------------------------------- | ----------- |
| `Organization`     | - (Root)                           | ✅ Exists   |
| `User`             | `organizationId` (optional)        | ✅ Linked   |
| `Vessel`           | `organizationId` (optional)        | ✅ Linked   |
| `InspectionReport` | Via `Vessel.organizationId`        | ⚠️ Indirect |
| `InspectionEntry`  | Via `Report.Vessel.organizationId` | ⚠️ Indirect |
| `AuditLog`         | Via `User.organizationId`          | ⚠️ Indirect |

### 1.2 Current Service Implementation

| Service              | Org Filter Support | Notes                             |
| -------------------- | ------------------ | --------------------------------- |
| `UsersService`       | ✅ Partial         | `findAll(organizationId?)` exists |
| `VesselsService`     | ✅ Partial         | `findAll(organizationId?)` exists |
| `InspectionsService` | ❌ None            | Filters by role only, not org     |
| `AuthService`        | ❌ None            | JWT missing `organizationId`      |

### 1.3 Current JWT Payload

```typescript
// Current (Insufficient)
{
  sub: string,      // user.id
  email: string,    // user.email
  role: RoleName    // user.role
}
```

---

## 2. Gap Analysis

### 2.1 Critical Security Gaps

| ID  | Gap                             | Risk Level  | Impact                     |
| --- | ------------------------------- | ----------- | -------------------------- |
| G1  | JWT missing `organizationId`    | 🔴 Critical | Cannot enforce org context |
| G2  | No tenant isolation middleware  | 🔴 Critical | Cross-org data leakage     |
| G3  | Inspections not filtered by org | 🔴 Critical | Admin sees all orgs' data  |
| G4  | Admin role is global            | 🟡 High     | No org-scoped admin        |
| G5  | AuditLog not org-scoped         | 🟡 Medium   | Audit trail crosses orgs   |

### 2.2 Feature Gaps

| ID  | Gap                               | Priority | Effort |
| --- | --------------------------------- | -------- | ------ |
| F1  | No organization management UI     | Medium   | High   |
| F2  | No org switching for super admins | Low      | Medium |
| F3  | No subdomain tenant resolution    | Low      | High   |
| F4  | No org-specific branding          | Low      | Medium |

---

## 3. Implementation Phases

### Phase 1: Core Multi-Tenancy (Critical) ⏱️ ~3-5 days

- [x] **1.1** Add `organizationId` to JWT payload ✅ _Completed 2025-12-20_
- [x] **1.2** Create `TenantGuard` middleware ✅ _Completed 2025-12-20_
- [x] **1.3** Update `InspectionsService` with org filtering ✅ _Completed 2025-12-20_
- [x] **1.4** Update all controllers to use tenant context ✅ _Completed 2025-12-20_
- [x] **1.5** Add `SUPER_ADMIN` role to schema ✅ _Completed 2025-12-20_
- [x] **1.6** Database migrations applied to DEV and PROD ✅ _Completed 2025-12-20_
- [x] **1.7** Update frontend AuthProvider with organization info ✅ _Completed 2025-12-20_
- [ ] **1.8** Update existing tests for multi-tenancy (deferred to Phase 2)

### Phase 2: Enhanced Security (Recommended) ⏱️ ~2-3 days

- [x] **2.1** Add `organizationId` directly to `InspectionReport` model ✅ _Completed 2025-12-20_
- [ ] **2.2** Create database-level RLS policies (if using Supabase/Postgres)
- [x] **2.3** Add org-scoped audit logging ✅ _Completed 2025-12-20_
- [x] **2.4** Implement request-scoped organization context ✅ _Completed 2025-12-20_
- [ ] **2.5** Add cross-org access prevention tests

### Phase 3: Admin Features (Important) ⏱️ ~3-4 days

- [ ] **3.1** Create Organization CRUD API
- [ ] **3.2** Build Organization management UI
- [ ] **3.3** Implement user invitation system per org
- [ ] **3.4** Add org-level settings management
- [ ] **3.5** Create super admin dashboard

### Phase 4: Enterprise Features (Optional) ⏱️ ~5-7 days

- [ ] **4.1** Subdomain-based tenant resolution
- [ ] **4.2** Custom domain support per organization
- [ ] **4.3** Organization-specific theming/branding
- [ ] **4.4** SSO/SAML integration per organization
- [ ] **4.5** Data export per organization

---

## 4. Technical Specifications

### 4.1 Updated JWT Payload Structure

```typescript
// Target JWT Payload
interface JwtPayload {
  sub: string; // user.id
  email: string; // user.email
  role: RoleName; // user.role (ADMIN | CAPTAIN | SUPER_ADMIN)
  organizationId: string; // user.organizationId (required for non-super-admin)
  assignedVesselId?: string; // For CAPTAIN role
  iat: number; // Issued at
  exp: number; // Expiration
}
```

### 4.2 TenantGuard Middleware Specification

```typescript
// Location: packages/api/src/common/guards/tenant.guard.ts

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Super admins can access all orgs (with explicit org header)
    if (user.role === "SUPER_ADMIN") {
      const targetOrg = request.headers["x-organization-id"];
      request.organizationId = targetOrg || null;
      return true;
    }

    // Regular users must have organizationId
    if (!user.organizationId) {
      throw new ForbiddenException("User not assigned to organization");
    }

    request.organizationId = user.organizationId;
    return true;
  }
}
```

### 4.3 Request Organization Context

```typescript
// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      organizationId?: string;
      user?: JwtPayload;
    }
  }
}
```

### 4.4 Service Pattern for Organization Filtering

```typescript
// Example: InspectionsService.findAll()
async findAll(organizationId: string, userRole: RoleName, vesselId?: string) {
  const where: Prisma.InspectionReportWhereInput = {
    vessel: {
      organizationId: organizationId  // Always filter by org
    }
  };

  // Further restrict for CAPTAIN
  if (userRole === 'CAPTAIN' && vesselId) {
    where.vesselId = vesselId;
  }

  return this.prisma.inspectionReport.findMany({ where, include: {...} });
}
```

---

## 5. Database Changes

### 5.1 Schema Updates Required

```prisma
// packages/prisma/schema.prisma

// Add SUPER_ADMIN role
enum RoleName {
  SUPER_ADMIN  // Platform admin - can manage all organizations
  ADMIN        // Organization admin - manages their org only
  CAPTAIN      // Vessel user - manages their vessel only
}

// Make organizationId required for User (except SUPER_ADMIN)
model User {
  // ... existing fields ...
  organizationId String    // Remove ? to make required
  organization   Organization @relation(fields: [organizationId], references: [id])
}

// Make organizationId required for Vessel
model Vessel {
  // ... existing fields ...
  organizationId String    // Remove ? to make required
  organization   Organization @relation(fields: [organizationId], references: [id])
}

// Add direct organizationId to InspectionReport for easier querying
model InspectionReport {
  // ... existing fields ...
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
}

// Add organizationId to AuditLog for org-scoped auditing
model AuditLog {
  // ... existing fields ...
  organizationId String?
  organization   Organization? @relation(fields: [organizationId], references: [id])
}
```

### 5.2 Migration Strategy

```sql
-- Step 1: Create default organization for existing data
INSERT INTO "Organization" (id, name)
VALUES ('default-org', 'Default Organization');

-- Step 2: Assign existing users to default org
UPDATE "User" SET "organizationId" = 'default-org' WHERE "organizationId" IS NULL;

-- Step 3: Assign existing vessels to default org
UPDATE "Vessel" SET "organizationId" = 'default-org' WHERE "organizationId" IS NULL;

-- Step 4: Add organizationId to InspectionReport
ALTER TABLE "InspectionReport" ADD COLUMN "organizationId" TEXT;
UPDATE "InspectionReport" ir
SET "organizationId" = v."organizationId"
FROM "Vessel" v WHERE ir."vesselId" = v.id;

-- Step 5: Make columns required
ALTER TABLE "User" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Vessel" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "InspectionReport" ALTER COLUMN "organizationId" SET NOT NULL;
```

---

## 6. API Changes

### 6.1 Endpoints Requiring Updates

| Endpoint            | Current             | Required Change                         |
| ------------------- | ------------------- | --------------------------------------- |
| `GET /inspections`  | No org filter       | Add `organizationId` filter             |
| `POST /inspections` | No org validation   | Validate vessel belongs to user's org   |
| `GET /vessels`      | Optional org filter | Make org filter required (from context) |
| `GET /users`        | Optional org filter | Make org filter required (from context) |
| `POST /auth/login`  | Basic JWT           | Include `organizationId` in JWT         |

### 6.2 New Endpoints Required

| Endpoint                    | Method | Description              | Role                         |
| --------------------------- | ------ | ------------------------ | ---------------------------- |
| `/organizations`            | GET    | List all organizations   | SUPER_ADMIN                  |
| `/organizations`            | POST   | Create organization      | SUPER_ADMIN                  |
| `/organizations/:id`        | GET    | Get organization details | SUPER_ADMIN, ADMIN (own org) |
| `/organizations/:id`        | PATCH  | Update organization      | SUPER_ADMIN, ADMIN (own org) |
| `/organizations/:id`        | DELETE | Delete organization      | SUPER_ADMIN                  |
| `/organizations/:id/users`  | GET    | List org users           | ADMIN                        |
| `/organizations/:id/invite` | POST   | Invite user to org       | ADMIN                        |

### 6.3 Controller Update Pattern

```typescript
// Before
@Get()
@UseGuards(JwtAuthGuard, RolesGuard)
async findAll(@CurrentUser() user: JwtPayload) {
  return this.service.findAll(user.role, user.assignedVesselId);
}

// After
@Get()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
async findAll(
  @CurrentUser() user: JwtPayload,
  @Req() request: Request
) {
  return this.service.findAll(
    request.organizationId,  // From TenantGuard
    user.role,
    user.assignedVesselId
  );
}
```

---

## 7. Frontend Changes

### 7.1 Auth Context Updates

```typescript
// packages/web/src/contexts/AuthContext.tsx

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: "SUPER_ADMIN" | "ADMIN" | "CAPTAIN";
  organizationId: string;
  organizationName?: string;
  assignedVesselId?: string;
}

// Decode JWT to get organizationId
const decodeToken = (token: string): AuthUser => {
  const payload = JSON.parse(atob(token.split(".")[1]));
  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    organizationId: payload.organizationId,
    assignedVesselId: payload.assignedVesselId
  };
};
```

### 7.2 API Client Updates

```typescript
// packages/web/src/lib/api.ts

// No changes needed - organizationId comes from JWT
// Server extracts it via TenantGuard
```

### 7.3 UI Components

| Component     | Change Required                     |
| ------------- | ----------------------------------- |
| Header/Navbar | Display organization name           |
| Settings page | Show org settings for ADMIN         |
| User list     | Already filtered by org (no change) |
| Vessel list   | Already filtered by org (no change) |

### 7.4 Route Protection

```typescript
// Super admin routes
<Route path="/admin/organizations" element={
  <RequireRole roles={['SUPER_ADMIN']}>
    <OrganizationsPage />
  </RequireRole>
} />

// Org admin routes
<Route path="/settings/organization" element={
  <RequireRole roles={['ADMIN', 'SUPER_ADMIN']}>
    <OrgSettingsPage />
  </RequireRole>
} />
```

---

## 8. Testing Requirements

### 8.1 Unit Tests

| Test Suite           | Tests Required                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `TenantGuard`        | - Extracts org from JWT<br>- Blocks users without org<br>- Allows SUPER_ADMIN with header |
| `AuthService`        | - JWT includes organizationId<br>- Login returns correct org                              |
| `InspectionsService` | - Filters by organizationId<br>- Cannot access other org's data                           |

### 8.2 Integration Tests

```typescript
describe("Multi-Tenancy Security", () => {
  it("should prevent Org A user from accessing Org B data", async () => {
    const orgAUser = await createUser({ organizationId: "org-a" });
    const orgBReport = await createReport({ organizationId: "org-b" });

    const response = await request(app)
      .get(`/inspections/${orgBReport.id}`)
      .set("Authorization", `Bearer ${orgAUser.token}`);

    expect(response.status).toBe(404); // Not found (not 403)
  });

  it("should allow SUPER_ADMIN to access any org with header", async () => {
    const superAdmin = await createUser({ role: "SUPER_ADMIN" });
    const orgBReport = await createReport({ organizationId: "org-b" });

    const response = await request(app)
      .get(`/inspections/${orgBReport.id}`)
      .set("Authorization", `Bearer ${superAdmin.token}`)
      .set("X-Organization-Id", "org-b");

    expect(response.status).toBe(200);
  });
});
```

### 8.3 E2E Tests

| Scenario                   | Expected Result          |
| -------------------------- | ------------------------ |
| Login as Org A admin       | See only Org A data      |
| Login as Org B captain     | See only assigned vessel |
| Login as SUPER_ADMIN       | Can switch between orgs  |
| Create report in wrong org | Rejected with 403        |

---

## 9. Migration Strategy

### 9.1 Pre-Migration Checklist

- [ ] Backup production database
- [ ] Create default organization for existing data
- [ ] Map existing users to organizations
- [ ] Map existing vessels to organizations
- [ ] Test migration on staging environment

### 9.2 Migration Steps

```bash
# Step 1: Deploy schema changes (additive only)
pnpm prisma migrate dev --name add_multi_org_support

# Step 2: Run data migration script
pnpm ts-node scripts/migrate-to-multi-org.ts

# Step 3: Deploy application code
# (TenantGuard, updated services, etc.)

# Step 4: Make organizationId required
pnpm prisma migrate dev --name make_org_id_required
```

### 9.3 Rollback Plan

```bash
# If issues occur:
# 1. Revert application code to previous version
# 2. organizationId columns remain (nullable) - no data loss
# 3. Application continues to work without tenant filtering
```

---

## 10. Security Considerations

### 10.1 Data Isolation Layers

| Layer           | Protection                         |
| --------------- | ---------------------------------- |
| **Application** | TenantGuard middleware             |
| **Service**     | organizationId in all queries      |
| **Database**    | Optional: Row-Level Security (RLS) |

### 10.2 Security Checklist

- [ ] All queries include organizationId filter
- [ ] JWT validated on every request
- [ ] Cannot forge organizationId (comes from JWT)
- [ ] SUPER_ADMIN requires explicit org header
- [ ] Audit logs capture organization context
- [ ] File uploads scoped to organization
- [ ] No cross-org data in error messages

### 10.3 Attack Vectors Mitigated

| Attack                                  | Mitigation                                    |
| --------------------------------------- | --------------------------------------------- |
| IDOR (Insecure Direct Object Reference) | organizationId filter on all queries          |
| JWT manipulation                        | Server-side org extraction only               |
| Header injection                        | SUPER_ADMIN only, validated against user role |
| SQL injection                           | Prisma ORM parameterized queries              |

---

## Appendix A: File Changes Summary

### Backend Files to Modify

| File                                                     | Changes                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| `packages/prisma/schema.prisma`                          | Add SUPER_ADMIN role, add organizationId to InspectionReport |
| `packages/api/src/auth/auth.service.ts`                  | Include organizationId in JWT                                |
| `packages/api/src/auth/jwt.strategy.ts`                  | Extract organizationId from payload                          |
| `packages/api/src/common/guards/tenant.guard.ts`         | **NEW FILE**                                                 |
| `packages/api/src/inspections/inspections.service.ts`    | Add org filtering                                            |
| `packages/api/src/inspections/inspections.controller.ts` | Use TenantGuard                                              |
| `packages/api/src/vessels/vessels.controller.ts`         | Use TenantGuard                                              |
| `packages/api/src/users/users.controller.ts`             | Use TenantGuard                                              |

### Frontend Files to Modify

| File                                            | Changes                          |
| ----------------------------------------------- | -------------------------------- |
| `packages/web/src/contexts/AuthContext.tsx`     | Add organizationId to user state |
| `packages/web/src/components/Layout/Header.tsx` | Display organization name        |

---

## Appendix B: Estimated Timeline

| Phase                        | Duration | Dependencies  |
| ---------------------------- | -------- | ------------- |
| Phase 1: Core Multi-Tenancy  | 3-5 days | None          |
| Phase 2: Enhanced Security   | 2-3 days | Phase 1       |
| Phase 3: Admin Features      | 3-4 days | Phase 1       |
| Phase 4: Enterprise Features | 5-7 days | Phase 1, 2, 3 |

**Total Estimated Time:** 13-19 days (for all phases)

**Minimum Viable Multi-Tenancy:** Phase 1 only = 3-5 days

---

## Appendix C: Decision Log

| Decision                     | Rationale                                            | Date       |
| ---------------------------- | ---------------------------------------------------- | ---------- |
| JWT-based org context        | Simpler than session-based, works with stateless API | 2025-12-20 |
| TenantGuard over interceptor | Guards run before interceptors, better for security  | 2025-12-20 |
| Optional subdomain support   | Deferred to Phase 4, not critical for MVP            | 2025-12-20 |
| SUPER_ADMIN role             | Needed for platform management without org context   | 2025-12-20 |
