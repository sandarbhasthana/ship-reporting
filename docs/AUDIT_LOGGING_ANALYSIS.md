# Audit Logging Analysis & Implementation Plan

This document provides a comprehensive analysis of audit logging requirements for the Ship Reporting application, organized by user roles and implementation phases.

---

## 1. Current State Assessment

### 1.1 Existing Infrastructure

| Component       | Status    | Location                                |
| --------------- | --------- | --------------------------------------- |
| AuditLog Model  | ✅ Exists | `packages/prisma/schema.prisma`         |
| AuditService    | ✅ Exists | `backend/src/audit/audit.service.ts`    |
| AuditController | ✅ Exists | `backend/src/audit/audit.controller.ts` |
| API Endpoint    | ✅ Exists | `GET /api/audit-logs` (Admin only)      |

### 1.2 AuditLog Schema

```prisma
model AuditLog {
  id             String        @id @default(cuid())
  userId         String?
  user           User?         @relation(...)
  organizationId String?
  organization   Organization? @relation(...)
  entityType     String        // e.g. "InspectionEntry"
  entityId       String        // ID of the entity
  action         String        // e.g. "CREATE", "UPDATE", "DELETE"
  before         Json?         // State before change
  after          Json?         // State after change
  ip             String?
  userAgent      String?
  requestId      String?
  createdAt      DateTime      @default(now())
}
```

### 1.3 Current Audit Coverage

| Entity           | CREATE | UPDATE | DELETE | SIGN | AUTH |
| ---------------- | :----: | :----: | :----: | :--: | :--: |
| InspectionReport |   ✅   |   ✅   |   ✅   |  ❌  | N/A  |
| InspectionEntry  |   ✅   |   ✅   |   ✅   |  ✅  | N/A  |
| User             |   ✅   |   ✅   |   ✅   | N/A  | N/A  |
| Vessel           |   ✅   |   ✅   |   ✅   | N/A  | N/A  |
| Organization     |   ✅   |   ✅   |   ✅   | N/A  | N/A  |
| Auth Events      |  N/A   |  N/A   |  N/A   | N/A  |  ✅  |

**Coverage: ~95%** - All CRUD operations and auth events fully covered (Phases 1-4 complete).

---

## 2. Role-Based Analysis

### 2.1 User Roles Overview

| Role            | Scope        | Description                                  |
| --------------- | ------------ | -------------------------------------------- |
| **SUPER_ADMIN** | Platform     | Manages all organizations, platform settings |
| **ADMIN**       | Organization | Manages their org's users, vessels, reports  |
| **CAPTAIN**     | Vessel       | Creates/edits reports for assigned vessel    |

---

### 2.2 SUPER_ADMIN Audit Requirements

**Scope:** Platform-wide visibility, cross-organization actions

| Action Category             | Specific Actions           | Priority  | Compliance Need |
| --------------------------- | -------------------------- | --------- | --------------- |
| **Organization Management** | CREATE, UPDATE, DELETE org | 🔴 HIGH   | Billing, legal  |
| **Admin User Management**   | CREATE Admin, change roles | 🔴 HIGH   | Security        |
| **Cross-Org Access**        | View other org's data      | 🟠 MEDIUM | Security audit  |
| **System Settings**         | Change platform config     | 🟠 MEDIUM | Config history  |
| **Bulk Operations**         | Mass updates, imports      | 🟡 LOW    | Data integrity  |

**Key Questions SUPER_ADMIN Audit Should Answer:**

- Who created/deleted an organization and when?
- Who promoted a user to Admin role?
- What system settings were changed?

---

### 2.3 ADMIN Audit Requirements

**Scope:** Organization-level visibility, user & vessel management

| Action Category        | Specific Actions                  | Priority  | Compliance Need  |
| ---------------------- | --------------------------------- | --------- | ---------------- |
| **User Management**    | CREATE, UPDATE, DELETE users      | 🔴 HIGH   | HR compliance    |
| **Vessel Management**  | CREATE, UPDATE, DELETE vessels    | 🔴 HIGH   | Asset tracking   |
| **Captain Assignment** | Assign/unassign captain to vessel | 🔴 HIGH   | Accountability   |
| **Report Deletion**    | DELETE inspection reports         | 🔴 HIGH   | Data integrity   |
| **Password Actions**   | Reset user passwords              | 🟠 MEDIUM | Security         |
| **Entry Deletion**     | DELETE inspection entries         | 🟠 MEDIUM | Data integrity   |
| **Signature Actions**  | Office sign-off on entries        | 🟠 MEDIUM | Legal compliance |

**Key Questions ADMIN Audit Should Answer:**

- Who created/modified/deleted a user?
- Who assigned Captain X to Vessel Y?
- Who deleted an inspection report?
- What changes did Captain make to a report?

---

### 2.4 CAPTAIN Audit Requirements

**Scope:** Vessel-level actions, report/entry modifications

| Action Category         | Specific Actions         | Priority | Compliance Need   |
| ----------------------- | ------------------------ | -------- | ----------------- |
| **Report Creation**     | CREATE inspection report | ✅ Done  | Compliance        |
| **Report Updates**      | UPDATE report metadata   | ✅ Done  | Edit history      |
| **Report Deletion**     | DELETE inspection report | ✅ Done  | Data integrity    |
| **Entry Management**    | CREATE, UPDATE entries   | ✅ Done  | Detailed tracking |
| **Field-Level Changes** | Which fields changed     | ✅ Done  | Accountability    |
| **Signature Actions**   | Office sign-off          | ✅ Done  | Legal compliance  |
| **PDF Export**          | Generate/download PDF    | 🟡 LOW   | Access tracking   |

**Key Questions CAPTAIN Audit Should Answer:**

- What entries did I create/modify today?
- Who signed off on which entry?
- What was the previous value before my edit?

---

## 3. Gap Analysis

### 3.1 Critical Gaps (Must Fix)

| Gap                            | Risk                                       | Affected Roles | Status   |
| ------------------------------ | ------------------------------------------ | -------------- | -------- |
| Entry CREATE/UPDATE not logged | High - No accountability for entry changes | Captain, Admin | ✅ Fixed |
| Signature actions not logged   | Critical - Legal compliance risk           | Captain, Admin | ✅ Fixed |
| User management not logged     | High - Security/HR compliance              | Admin          | ✅ Fixed |
| Delete actions not logged      | High - Data loss untracked                 | Admin          | ✅ Fixed |

### 3.2 Important Gaps (Should Fix)

| Gap                                | Risk                        | Affected Roles | Status   |
| ---------------------------------- | --------------------------- | -------------- | -------- |
| Vessel management not logged       | Medium - Asset tracking gap | Admin          | ✅ Fixed |
| Captain assignment not logged      | Medium - Accountability gap | Admin          | ✅ Fixed |
| Organization management not logged | Medium - Platform audit gap | Super_Admin    | ✅ Fixed |

### 3.3 Nice-to-Have Gaps (Can Defer)

| Gap                     | Risk                       | Affected Roles | Status      |
| ----------------------- | -------------------------- | -------------- | ----------- |
| Login/logout tracking   | Low - Session awareness    | All            | ✅ Fixed    |
| Failed auth attempts    | Low - Security monitoring  | All            | ✅ Fixed    |
| PDF generation tracking | Low - Access awareness     | All            | 🔲 Pending  |
| Read/view actions       | Very Low - Usage analytics | All            | 🔲 Deferred |

---

## 4. Implementation Phases

### Phase 1: Critical Audit Coverage (Priority: HIGH) ✅ COMPLETE

**Estimated Effort: 2-3 hours** | **Actual: ~1 hour**

#### Tasks:

- [x] **1.1** Add audit logging to `EntriesService` for CREATE action
- [x] **1.2** Add audit logging to `EntriesService` for UPDATE action (with STATUS_CHANGE detection)
- [x] **1.3** Add audit logging to `EntriesService` for DELETE action
- [x] **1.4** Add audit logging for signature actions (OFFICE_SIGN, OFFICE_UNSIGN)
- [x] **1.5** Add audit logging to `InspectionsService` for DELETE action

#### Files Modified:

- `backend/src/inspections/entries.service.ts` - Added CREATE, UPDATE, DELETE, STATUS_CHANGE, OFFICE_SIGN, OFFICE_UNSIGN
- `backend/src/inspections/entries.controller.ts` - Added TenantGuard, OrganizationId for audit context
- `backend/src/inspections/inspections.service.ts` - Added DELETE audit logging
- `backend/src/inspections/inspections.controller.ts` - Added userId to remove() for audit context

---

### Phase 2: User & Vessel Management Audit (Priority: HIGH) ✅ COMPLETE

**Estimated Effort: 1-2 hours** | **Actual: ~1 hour**

#### Tasks:

- [x] **2.1** Add audit logging to `UsersService` for CREATE action
- [x] **2.2** Add audit logging to `UsersService` for UPDATE action (with ROLE_CHANGE detection)
- [x] **2.3** Add audit logging to `UsersService` for DELETE action (soft & hard delete)
- [x] **2.4** Add audit logging to `VesselsService` for CREATE action
- [x] **2.5** Add audit logging to `VesselsService` for UPDATE action
- [x] **2.6** Add audit logging to `VesselsService` for DELETE action
- [x] **2.7** Add audit logging for captain assignment/unassignment (ASSIGN/UNASSIGN)

#### Files Modified:

- `backend/src/users/users.service.ts` - Added CREATE, UPDATE, DELETE, HARD_DELETE, ROLE_CHANGE
- `backend/src/users/users.module.ts` - Added AuditModule import
- `backend/src/vessels/vessels.service.ts` - Added CREATE, UPDATE, DELETE, ASSIGN, UNASSIGN
- `backend/src/vessels/vessels.module.ts` - Added AuditModule import

---

### Phase 3: Organization & Platform Audit (Priority: MEDIUM) ✅ COMPLETE

**Estimated Effort: 1 hour** | **Actual: ~30 minutes**

#### Tasks:

- [x] **3.1** Add audit logging to `OrganizationService` for CREATE action
- [x] **3.2** Add audit logging to `OrganizationService` for UPDATE action
- [x] **3.3** Add audit logging to `OrganizationService` for DELETE action
- [x] **3.4** Add audit logging for role changes (user promoted/demoted) - Done in Phase 2

#### Files Modified:

- `backend/src/organization/organization.service.ts` - Added CREATE, UPDATE, DELETE
- `backend/src/organization/organization.module.ts` - Added AuditModule import

---

### Phase 4: Auth Events & Audit Management (Priority: MEDIUM) ✅ COMPLETE

**Estimated Effort: 1-2 hours** | **Actual: ~1 hour**

#### Tasks:

- [x] **4.1** Add login audit tracking (LOGIN action with IP/UserAgent)
- [x] **4.2** Add failed authentication attempt logging (LOGIN_FAILED with reason)
- [x] **4.3** Add password change audit logging (PASSWORD_CHANGE, PASSWORD_CHANGE_FAILED)
- [ ] **4.4** Add PDF generation/export tracking - Deferred
- [x] **4.5** Create audit log retention/cleanup job (runs daily at 2 AM, configurable retention)
- [x] **4.6** Add audit log export functionality (CSV export via `/api/audit-logs/export`)

#### Files Modified:

- `backend/src/auth/auth.service.ts` - Added LOGIN, LOGIN_FAILED, PASSWORD_CHANGE, PASSWORD_CHANGE_FAILED
- `backend/src/auth/auth.controller.ts` - Added IP and UserAgent extraction
- `backend/src/auth/auth.module.ts` - Added AuditModule import
- `backend/src/audit/audit.service.ts` - Added cleanup job, CSV export, and stats methods
- `backend/src/audit/audit.controller.ts` - Added `/export` and `/stats` endpoints
- `backend/src/audit/audit.module.ts` - Added ScheduleModule for cron jobs

#### New Environment Variable:

- `AUDIT_LOG_RETENTION_DAYS` - Number of days to retain audit logs (default: 90)

---

### Phase 5: Frontend Audit Viewer (Priority: LOW) ✅ COMPLETE

**Estimated Effort: 4-6 hours** | **Actual: ~2 hours**

#### Tasks:

- [x] **5.1** Create Audit Logs list page for Admin
- [x] **5.2** Add filtering by entity type, user, date range
- [x] **5.3** Add audit log details (before/after diff in expandable row)
- [x] **5.4** Add audit log export button (CSV)
- [x] **5.5** Add to navigation (sidebar menu for Admin/Super Admin)

#### Files Created:

- `frontend/src/pages/audit-logs/AuditLogList.tsx` ✅
- `frontend/src/pages/audit-logs/audit-logs.module.css` ✅
- `frontend/src/pages/audit-logs/index.ts` ✅

#### Files Modified:

- `frontend/src/App.tsx` - Added route and resource
- `frontend/src/pages/index.ts` - Export AuditLogList
- `frontend/src/providers/accessControlProvider.ts` - Added audit-logs permissions

---

### Phase 6: Enhanced Features (Priority: LOW) 🔲 PENDING

**Estimated Effort: 1-2 hours**

#### Tasks:

- [ ] **6.1** Add PDF generation/export tracking
- [ ] **6.2** Add logout tracking (if sessions are implemented)

#### Files to Create/Modify:

- `backend/src/inspections/pdf.service.ts` - Add EXPORT action

---

## 6. UI Placement Strategy

### 6.1 Navigation Structure

```
Current Sidebar:
├── Dashboard
├── Vessels
├── Inspections
├── Users (Admin only)
└── Settings

Proposed Addition:
├── Dashboard
├── Vessels
├── Inspections
├── Users (Admin only)
├── Audit Logs (Admin only) ← NEW
└── Settings
```

### 6.2 UI Locations by Role

#### ADMIN View

| Location         | Component      | Description                             |
| ---------------- | -------------- | --------------------------------------- |
| **Sidebar Menu** | `Audit Logs`   | New menu item with `AuditOutlined` icon |
| **Route**        | `/audit-logs`  | Main audit log list page                |
| **Page**         | `AuditLogList` | Table with filters, search, export      |

**Audit Logs Page Features:**

- Table columns: Timestamp, User, Action, Entity, Changes
- Filters: Entity type, User, Date range, Action type
- Expandable rows to show before/after diff
- Export to CSV button

#### SUPER_ADMIN View

| Location         | Component             | Description                        |
| ---------------- | --------------------- | ---------------------------------- |
| **Dashboard**    | `Platform Audit Card` | Recent platform-wide audit summary |
| **Sidebar Menu** | `Audit Logs`          | Cross-organization audit view      |
| **Route**        | `/audit-logs`         | Enhanced with org filter dropdown  |

#### CAPTAIN View

| Location            | Component          | Description                              |
| ------------------- | ------------------ | ---------------------------------------- |
| **Inspection View** | `AuditHistory` tab | View history of changes to their reports |
| **Entry Detail**    | `AuditTimeline`    | See who changed what on each entry       |

### 6.3 Wireframe Mockups

#### Audit Logs List Page (Admin)

```
┌─────────────────────────────────────────────────────────────┐
│  Audit Logs                                    [Export CSV] │
├─────────────────────────────────────────────────────────────┤
│  Filters:                                                   │
│  [Entity Type ▼] [User ▼] [Action ▼] [Date Range 📅]       │
├─────────────────────────────────────────────────────────────┤
│  Timestamp       │ User      │ Action │ Entity    │ Details │
│  ─────────────────────────────────────────────────────────  │
│  Dec 25, 10:30   │ John Doe  │ UPDATE │ Entry #12 │   [>]   │
│  Dec 25, 10:15   │ Jane Sm.  │ CREATE │ Report #5 │   [>]   │
│  Dec 25, 09:45   │ John Doe  │ SIGN   │ Entry #11 │   [>]   │
│  ...             │           │        │           │         │
├─────────────────────────────────────────────────────────────┤
│  Showing 1-10 of 156                        [< 1 2 3 4 5 >] │
└─────────────────────────────────────────────────────────────┘
```

#### Expanded Row (Change Diff)

```
┌─────────────────────────────────────────────────────────────┐
│  ▼ Dec 25, 10:30 │ John Doe │ UPDATE │ Entry #12            │
├─────────────────────────────────────────────────────────────┤
│  Changes:                                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Field: deficiency                                   │    │
│  │ Before: "Minor rust on deck"                        │    │
│  │ After:  "Minor rust on deck - repaired"             │    │
│  └─────────────────────────────────────────────────────┘    │
│  IP: 192.168.1.100 │ Request ID: abc123                     │
└─────────────────────────────────────────────────────────────┘
```

#### Audit Timeline in Inspection View

```
┌─────────────────────────────────────────────────────────────┐
│  Inspection Report #INS-2024-001                            │
│  ───────────────────────────────────────────────────────────│
│  [Details] [Entries] [History]  ← Tab to show audit         │
├─────────────────────────────────────────────────────────────┤
│  History Tab:                                               │
│                                                             │
│  ● Dec 25, 10:30 - John Doe                                │
│  │  Updated entry #12: deficiency field                    │
│  │                                                          │
│  ● Dec 25, 10:15 - Jane Smith                              │
│  │  Signed entry #11 (Office Sign-off)                     │
│  │                                                          │
│  ● Dec 25, 09:00 - John Doe                                │
│  │  Created report                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.4 Required App.tsx Changes

```typescript
// Add to resources array
{
  name: "audit-logs",
  list: "/audit-logs",
  meta: {
    label: "Audit Logs",
    icon: <AuditOutlined />
  }
}

// Add route
<Route path="/audit-logs" element={<AuditLogList />} />
```

### 6.5 Access Control Updates

```typescript
// accessControlProvider.ts
if (resource === "audit-logs") {
  if (role === "ADMIN" || role === "SUPER_ADMIN") {
    return { can: true };
  }
  return { can: false, reason: "Only admins can view audit logs" };
}
```

---

## 7. Implementation Guide

### 5.1 Standard Audit Log Pattern

```typescript
// In any service method that modifies data:
async createSomething(dto: CreateDto, userId: string, orgId: string) {
  const entity = await this.prisma.entity.create({ data: dto });

  // Log the audit
  await this.auditService.log(
    'EntityName',           // entityType
    entity.id,              // entityId
    'CREATE',               // action
    null,                   // before (null for CREATE)
    entity,                 // after
    { userId, organizationId: orgId }  // context
  );

  return entity;
}
```

### 5.2 Action Types to Use

| Action                   | When to Use                    | Status     |
| ------------------------ | ------------------------------ | ---------- |
| `CREATE`                 | New entity created             | ✅ In Use  |
| `UPDATE`                 | Entity modified                | ✅ In Use  |
| `DELETE`                 | Entity removed (soft delete)   | ✅ In Use  |
| `HARD_DELETE`            | Entity permanently deleted     | ✅ In Use  |
| `STATUS_CHANGE`          | Entry status changed           | ✅ In Use  |
| `OFFICE_SIGN`            | Office signature added         | ✅ In Use  |
| `OFFICE_UNSIGN`          | Office signature removed       | ✅ In Use  |
| `ASSIGN`                 | Captain assigned to vessel     | ✅ In Use  |
| `UNASSIGN`               | Captain removed from vessel    | ✅ In Use  |
| `LOGIN`                  | User logged in successfully    | ✅ In Use  |
| `LOGIN_FAILED`           | Failed login attempt           | ✅ In Use  |
| `PASSWORD_CHANGE`        | Password changed successfully  | ✅ In Use  |
| `PASSWORD_CHANGE_FAILED` | Failed password change attempt | ✅ In Use  |
| `ROLE_CHANGE`            | User role modified             | ✅ In Use  |
| `LOGOUT`                 | User logged out                | 🔲 Phase 6 |
| `EXPORT`                 | PDF/data exported              | 🔲 Phase 6 |

---

## 8. Success Metrics

After implementation, the audit system should answer:

| Question                                        | Phase   | Status     |
| ----------------------------------------------- | ------- | ---------- |
| Who edited Entry #123 and what did they change? | Phase 1 | ✅ Enabled |
| Who signed off on this inspection?              | Phase 1 | ✅ Enabled |
| Who deleted an inspection report?               | Phase 1 | ✅ Enabled |
| Who created User X and when?                    | Phase 2 | ✅ Enabled |
| Who assigned Captain Y to Vessel Z?             | Phase 2 | ✅ Enabled |
| Who created Organization ABC?                   | Phase 3 | ✅ Enabled |
| How many failed login attempts occurred?        | Phase 4 | ✅ Enabled |
| Who changed their password?                     | Phase 4 | ✅ Enabled |
| What IP address was used for login?             | Phase 4 | ✅ Enabled |
| Can I export audit logs for compliance?         | Phase 4 | ✅ Enabled |
| Are old audit logs automatically cleaned up?    | Phase 4 | ✅ Enabled |

---

## 9. Summary

| Phase       | Focus                        | Priority  | Effort  | Status      |
| ----------- | ---------------------------- | --------- | ------- | ----------- |
| **Phase 1** | Entry & Signature Audit      | 🔴 HIGH   | 2-3 hrs | ✅ COMPLETE |
| **Phase 2** | User & Vessel Audit          | 🔴 HIGH   | 1-2 hrs | ✅ COMPLETE |
| **Phase 3** | Organization Audit           | 🟠 MEDIUM | 1 hr    | ✅ COMPLETE |
| **Phase 4** | Auth Events & Audit Mgmt     | 🟠 MEDIUM | 1-2 hrs | ✅ COMPLETE |
| **Phase 5** | Frontend Viewer              | 🟡 LOW    | ~2 hrs  | ✅ COMPLETE |
| **Phase 6** | Enhanced Features (PDF, etc) | 🟡 LOW    | 1-2 hrs | 🔲 Pending  |

**Total Estimated Effort: 11-16 hours** | **Completed: ~6 hours (Phases 1-5)**

**Next Recommended Step:** Phase 6 (Enhanced Features) - Add PDF export tracking, logout tracking

---

## 10. New API Endpoints (Phase 4)

| Endpoint                 | Method | Description                     |
| ------------------------ | ------ | ------------------------------- |
| `/api/audit-logs`        | GET    | List audit logs with pagination |
| `/api/audit-logs/entity` | GET    | Get audit history for an entity |
| `/api/audit-logs/export` | GET    | Export audit logs as CSV        |
| `/api/audit-logs/stats`  | GET    | Get audit log statistics        |

### Environment Variables

| Variable                   | Default | Description                              |
| -------------------------- | ------- | ---------------------------------------- |
| `AUDIT_LOG_RETENTION_DAYS` | 90      | Days to retain audit logs before cleanup |

### Scheduled Jobs

| Job               | Schedule      | Description                              |
| ----------------- | ------------- | ---------------------------------------- |
| Audit Log Cleanup | Daily at 2 AM | Deletes logs older than retention period |
