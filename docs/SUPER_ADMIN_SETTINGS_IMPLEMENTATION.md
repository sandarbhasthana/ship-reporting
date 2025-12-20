# SUPER_ADMIN Settings Implementation Plan

## Overview

This document outlines the comprehensive implementation plan for SUPER_ADMIN specific settings in the Ship Reporting platform. These settings are accessible only to platform administrators (SUPER_ADMIN role) and provide control over platform-wide configurations.

---

## Phase 1: Platform Configuration (Priority: High)

### 1.1 Description

Basic platform branding and configuration settings that define the look and feel of the entire platform.

### 1.2 Features

| Setting              | Type    | Description                                    | Default          |
| -------------------- | ------- | ---------------------------------------------- | ---------------- |
| Platform Name        | String  | Display name shown in browser title and emails | "Ship Reporting" |
| Platform Logo        | Image   | Logo displayed in login page and emails        | Default logo     |
| Favicon              | Image   | Browser tab icon                               | Default favicon  |
| Primary Color        | Color   | Main brand color used across the platform      | #1890ff          |
| Support Email        | Email   | Contact email for support inquiries            | -                |
| Support Phone        | String  | Contact phone for support                      | -                |
| Terms of Service URL | URL     | Link to ToS page                               | -                |
| Privacy Policy URL   | URL     | Link to privacy policy                         | -                |
| Login Page Message   | Text    | Custom message on login page                   | -                |
| Maintenance Mode     | Boolean | Enable/disable maintenance mode                | false            |
| Maintenance Message  | Text    | Message shown during maintenance               | -                |

### 1.3 Database Schema

```prisma
model PlatformSettings {
  id                String   @id @default(cuid())
  platformName      String   @default("Ship Reporting")
  platformLogo      String?
  favicon           String?
  primaryColor      String   @default("#1890ff")
  supportEmail      String?
  supportPhone      String?
  termsOfServiceUrl String?
  privacyPolicyUrl  String?
  loginPageMessage  String?
  maintenanceMode   Boolean  @default(false)
  maintenanceMessage String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### 1.4 API Endpoints

| Method | Endpoint                         | Description                                    |
| ------ | -------------------------------- | ---------------------------------------------- |
| GET    | `/api/platform/settings`         | Get platform settings (public, limited fields) |
| GET    | `/api/platform/settings/admin`   | Get all platform settings (SUPER_ADMIN only)   |
| PATCH  | `/api/platform/settings`         | Update platform settings (SUPER_ADMIN only)    |
| POST   | `/api/platform/settings/logo`    | Upload platform logo (SUPER_ADMIN only)        |
| POST   | `/api/platform/settings/favicon` | Upload favicon (SUPER_ADMIN only)              |

### 1.5 Frontend Components

```
frontend/src/pages/platform-settings/
├── index.ts
├── PlatformSettings.tsx        # Main settings page
├── BrandingSettings.tsx        # Logo, colors, name
├── ContactSettings.tsx         # Support email, phone
├── LegalSettings.tsx           # ToS, Privacy URLs
├── MaintenanceSettings.tsx     # Maintenance mode toggle
└── platform-settings.module.css
```

### 1.6 Tasks

- [ ] Create PlatformSettings Prisma model
- [ ] Create database migration
- [ ] Create PlatformSettingsModule in backend
- [ ] Implement PlatformSettingsService
- [ ] Implement PlatformSettingsController with guards
- [ ] Create frontend settings pages
- [ ] Add route and menu item for SUPER_ADMIN
- [ ] Implement logo/favicon upload functionality
- [ ] Add maintenance mode middleware
- [ ] Write unit tests
- [ ] Write E2E tests

---

## Phase 2: Organization Management Settings (Priority: High)

### 2.1 Description

Settings that control how organizations are created, managed, and what limits apply to them.

### 2.2 Features

| Setting                              | Type    | Description                                       | Default |
| ------------------------------------ | ------- | ------------------------------------------------- | ------- |
| Auto Approve Organizations           | Boolean | Auto-approve new organization registrations       | true    |
| Max Users Per Organization           | Number  | Maximum users allowed per org (0 = unlimited)     | 0       |
| Max Vessels Per Organization         | Number  | Maximum vessels allowed per org (0 = unlimited)   | 0       |
| Max Storage Per Organization         | Number  | Storage limit in MB per org (0 = unlimited)       | 500     |
| Default User Role                    | Enum    | Default role for new users in org                 | CAPTAIN |
| Allow Organization Self Registration | Boolean | Allow public organization registration            | false   |
| Organization Approval Email          | Boolean | Send email when org needs approval                | true    |
| Welcome Email Template               | Text    | Email sent to new organizations                   | Default |
| Trial Period Days                    | Number  | Days before requiring subscription (0 = no trial) | 0       |
| Require Organization Logo            | Boolean | Mandate logo upload for organizations             | false   |

### 2.3 Database Schema

```prisma
model OrganizationSettings {
  id                          String   @id @default(cuid())
  autoApproveOrganizations    Boolean  @default(true)
  maxUsersPerOrganization     Int      @default(0)
  maxVesselsPerOrganization   Int      @default(0)
  maxStoragePerOrganization   Int      @default(500) // MB
  defaultUserRole             RoleName @default(CAPTAIN)
  allowSelfRegistration       Boolean  @default(false)
  sendApprovalEmail           Boolean  @default(true)
  welcomeEmailTemplate        String?
  trialPeriodDays             Int      @default(0)
  requireOrganizationLogo     Boolean  @default(false)
  createdAt                   DateTime @default(now())
  updatedAt                   DateTime @updatedAt
}

// Add to Organization model
model Organization {
  // ... existing fields
  status            OrgStatus @default(PENDING)
  storageUsed       Int       @default(0) // MB
  trialEndsAt       DateTime?
}

enum OrgStatus {
  PENDING
  ACTIVE
  SUSPENDED
  TRIAL
}
```

### 2.4 API Endpoints

| Method | Endpoint                              | Description                        |
| ------ | ------------------------------------- | ---------------------------------- |
| GET    | `/api/platform/organization-settings` | Get organization settings          |
| PATCH  | `/api/platform/organization-settings` | Update organization settings       |
| GET    | `/api/organizations/pending`          | Get pending organization approvals |
| POST   | `/api/organizations/:id/approve`      | Approve an organization            |
| POST   | `/api/organizations/:id/reject`       | Reject an organization             |
| POST   | `/api/organizations/:id/suspend`      | Suspend an organization            |
| POST   | `/api/organizations/:id/reactivate`   | Reactivate an organization         |

### 2.5 Frontend Components

```
frontend/src/pages/platform-settings/
├── OrganizationDefaults.tsx    # Default limits and settings
├── OrganizationApprovals.tsx   # Pending approvals queue
└── OrganizationLimits.tsx      # Per-org limit overrides
```

### 2.6 Tasks

- [ ] Create OrganizationSettings Prisma model
- [ ] Add status field to Organization model
- [ ] Create database migration
- [ ] Implement organization approval workflow
- [ ] Create approval notification emails
- [ ] Implement storage tracking middleware
- [ ] Add limit validation in vessel/user creation
- [ ] Create frontend settings pages
- [ ] Create pending approvals dashboard
- [ ] Write unit tests
- [ ] Write E2E tests

---

## Phase 3: Security & Compliance Settings (Priority: Critical)

### 3.1 Description

Security configurations that protect the platform and ensure compliance with security standards.

### 3.2 Features

| Setting                    | Type     | Description                             | Default |
| -------------------------- | -------- | --------------------------------------- | ------- |
| Min Password Length        | Number   | Minimum characters for passwords        | 8       |
| Require Uppercase          | Boolean  | Password must have uppercase letter     | true    |
| Require Lowercase          | Boolean  | Password must have lowercase letter     | true    |
| Require Numbers            | Boolean  | Password must have numbers              | true    |
| Require Special Characters | Boolean  | Password must have special chars        | false   |
| Password Expiry Days       | Number   | Days until password expires (0 = never) | 0       |
| Password History Count     | Number   | Previous passwords that can't be reused | 3       |
| Session Timeout Minutes    | Number   | Inactive session timeout                | 60      |
| Max Login Attempts         | Number   | Failed attempts before lockout          | 5       |
| Lockout Duration Minutes   | Number   | Account lockout duration                | 30      |
| Enforce 2FA                | Boolean  | Require 2FA for all users               | false   |
| Enforce 2FA For Admins     | Boolean  | Require 2FA for admin roles only        | false   |
| Allowed IP Ranges          | String[] | IP whitelist for access (empty = all)   | []      |
| Audit Log Retention Days   | Number   | Days to keep audit logs                 | 365     |
| Require Email Verification | Boolean  | Verify email before account active      | true    |

### 3.3 Database Schema

```prisma
model SecuritySettings {
  id                      String   @id @default(cuid())
  // Password Policy
  minPasswordLength       Int      @default(8)
  requireUppercase        Boolean  @default(true)
  requireLowercase        Boolean  @default(true)
  requireNumbers          Boolean  @default(true)
  requireSpecialChars     Boolean  @default(false)
  passwordExpiryDays      Int      @default(0)
  passwordHistoryCount    Int      @default(3)
  // Session Management
  sessionTimeoutMinutes   Int      @default(60)
  maxLoginAttempts        Int      @default(5)
  lockoutDurationMinutes  Int      @default(30)
  // Two-Factor Authentication
  enforce2FA              Boolean  @default(false)
  enforce2FAForAdmins     Boolean  @default(false)
  // Access Control
  allowedIPRanges         String[] @default([])
  // Compliance
  auditLogRetentionDays   Int      @default(365)
  requireEmailVerification Boolean @default(true)
  createdAt               DateTime @default(now())
  updatedAt               DateTime @updatedAt
}

// Add to User model for password history
model PasswordHistory {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  password  String   // Hashed password
  createdAt DateTime @default(now())
}

// Add to User model
model User {
  // ... existing fields
  passwordChangedAt    DateTime?
  loginAttempts        Int       @default(0)
  lockedUntil          DateTime?
  twoFactorEnabled     Boolean   @default(false)
  twoFactorSecret      String?
  emailVerified        Boolean   @default(false)
  emailVerificationToken String?
  passwordHistory      PasswordHistory[]
}
```

### 3.4 API Endpoints

| Method | Endpoint                                        | Description                  |
| ------ | ----------------------------------------------- | ---------------------------- |
| GET    | `/api/platform/security-settings`               | Get security settings        |
| PATCH  | `/api/platform/security-settings`               | Update security settings     |
| POST   | `/api/platform/security-settings/test-password` | Test password against policy |
| GET    | `/api/audit-logs`                               | Get audit logs with filters  |
| DELETE | `/api/audit-logs/cleanup`                       | Manual audit log cleanup     |
| POST   | `/api/auth/2fa/setup`                           | Setup 2FA for user           |
| POST   | `/api/auth/2fa/verify`                          | Verify 2FA code              |
| POST   | `/api/auth/2fa/disable`                         | Disable 2FA                  |

### 3.5 Frontend Components

```
frontend/src/pages/platform-settings/
├── SecuritySettings.tsx        # Main security settings page
├── PasswordPolicySettings.tsx  # Password requirements
├── SessionSettings.tsx         # Session and lockout settings
├── TwoFactorSettings.tsx       # 2FA configuration
├── IPWhitelistSettings.tsx     # IP range management
├── AuditLogSettings.tsx        # Audit log retention
└── AuditLogViewer.tsx          # View/export audit logs
```

### 3.6 Tasks

- [ ] Create SecuritySettings Prisma model
- [ ] Create PasswordHistory model
- [ ] Add security fields to User model
- [ ] Create database migration
- [ ] Implement password policy validation service
- [ ] Implement password history checking
- [ ] Implement session timeout middleware
- [ ] Implement login attempt tracking and lockout
- [ ] Implement 2FA with TOTP (Google Authenticator compatible)
- [ ] Implement IP whitelist middleware
- [ ] Implement audit log cleanup job
- [ ] Create frontend settings pages
- [ ] Create audit log viewer with export
- [ ] Write unit tests
- [ ] Write E2E tests

---

## Phase 4: System Monitoring Settings (Priority: Medium)

### 4.1 Description

Configuration for system performance, resource limits, and monitoring capabilities.

### 4.2 Features

| Setting                     | Type     | Description                       | Default       |
| --------------------------- | -------- | --------------------------------- | ------------- |
| API Rate Limit (per minute) | Number   | Max API calls per user per minute | 100           |
| API Rate Limit (per hour)   | Number   | Max API calls per user per hour   | 1000          |
| Upload Rate Limit           | Number   | Max uploads per user per hour     | 50            |
| Max File Upload Size        | Number   | Maximum file size in MB           | 10            |
| Allowed File Types          | String[] | Permitted upload file extensions  | [jpg,png,pdf] |
| Enable Request Logging      | Boolean  | Log all API requests              | true          |
| Log Retention Days          | Number   | Days to keep request logs         | 30            |
| Enable Performance Metrics  | Boolean  | Collect performance metrics       | true          |
| Alert Email                 | Email    | Email for system alerts           | -             |
| CPU Alert Threshold         | Number   | CPU % to trigger alert            | 80            |
| Memory Alert Threshold      | Number   | Memory % to trigger alert         | 80            |
| Storage Alert Threshold     | Number   | Storage % to trigger alert        | 90            |
| Database Backup Enabled     | Boolean  | Enable automatic backups          | true          |
| Backup Frequency            | Enum     | Backup schedule                   | DAILY         |
| Backup Retention Days       | Number   | Days to keep backups              | 30            |

### 4.3 Database Schema

```prisma
model SystemSettings {
  id                     String   @id @default(cuid())
  // Rate Limiting
  apiRateLimitPerMinute  Int      @default(100)
  apiRateLimitPerHour    Int      @default(1000)
  uploadRateLimitPerHour Int      @default(50)
  // File Uploads
  maxFileUploadSizeMB    Int      @default(10)
  allowedFileTypes       String[] @default(["jpg", "jpeg", "png", "pdf"])
  // Logging
  enableRequestLogging   Boolean  @default(true)
  logRetentionDays       Int      @default(30)
  enablePerformanceMetrics Boolean @default(true)
  // Alerts
  alertEmail             String?
  cpuAlertThreshold      Int      @default(80)
  memoryAlertThreshold   Int      @default(80)
  storageAlertThreshold  Int      @default(90)
  // Backups
  databaseBackupEnabled  Boolean  @default(true)
  backupFrequency        BackupFrequency @default(DAILY)
  backupRetentionDays    Int      @default(30)
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
}

enum BackupFrequency {
  HOURLY
  DAILY
  WEEKLY
  MONTHLY
}

model RequestLog {
  id            String   @id @default(cuid())
  userId        String?
  method        String
  path          String
  statusCode    Int
  responseTime  Int      // milliseconds
  ipAddress     String
  userAgent     String?
  createdAt     DateTime @default(now())

  @@index([userId])
  @@index([createdAt])
  @@index([path])
}

model SystemMetric {
  id          String   @id @default(cuid())
  metricType  String   // cpu, memory, storage, requests
  value       Float
  metadata    Json?
  recordedAt  DateTime @default(now())

  @@index([metricType])
  @@index([recordedAt])
}
```

### 4.4 API Endpoints

| Method | Endpoint                             | Description                   |
| ------ | ------------------------------------ | ----------------------------- |
| GET    | `/api/platform/system-settings`      | Get system settings           |
| PATCH  | `/api/platform/system-settings`      | Update system settings        |
| GET    | `/api/platform/metrics`              | Get system metrics            |
| GET    | `/api/platform/metrics/dashboard`    | Get metrics for dashboard     |
| GET    | `/api/platform/request-logs`         | Get request logs with filters |
| DELETE | `/api/platform/request-logs/cleanup` | Manual log cleanup            |
| POST   | `/api/platform/backup/trigger`       | Trigger manual backup         |
| GET    | `/api/platform/backup/list`          | List available backups        |
| POST   | `/api/platform/backup/restore/:id`   | Restore from backup           |

### 4.5 Frontend Components

```
frontend/src/pages/platform-settings/
├── SystemSettings.tsx          # Main system settings page
├── RateLimitSettings.tsx       # API rate limiting config
├── FileUploadSettings.tsx      # Upload limits and types
├── MonitoringDashboard.tsx     # Real-time metrics dashboard
├── RequestLogViewer.tsx        # Request log viewer
├── AlertSettings.tsx           # Alert thresholds and email
└── BackupSettings.tsx          # Backup configuration
```

### 4.6 Tasks

- [ ] Create SystemSettings Prisma model
- [ ] Create RequestLog and SystemMetric models
- [ ] Create database migration
- [ ] Implement dynamic rate limiting middleware
- [ ] Implement request logging middleware
- [ ] Implement metrics collection service
- [ ] Create metrics dashboard with charts
- [ ] Implement alert notification service
- [ ] Implement backup scheduler (cron job)
- [ ] Create backup/restore functionality
- [ ] Create frontend settings pages
- [ ] Write unit tests
- [ ] Write E2E tests

---

## Phase 5: Email & Notifications Settings (Priority: Medium)

### 5.1 Description

Configuration for email delivery, templates, and system-wide notifications.

### 5.2 Features

| Setting                     | Type    | Description                           | Default          |
| --------------------------- | ------- | ------------------------------------- | ---------------- |
| SMTP Host                   | String  | Email server hostname                 | -                |
| SMTP Port                   | Number  | Email server port                     | 587              |
| SMTP Username               | String  | Email account username                | -                |
| SMTP Password               | String  | Email account password (encrypted)    | -                |
| SMTP Secure                 | Boolean | Use TLS/SSL                           | true             |
| From Email                  | Email   | Default sender email                  | -                |
| From Name                   | String  | Default sender name                   | "Ship Reporting" |
| Reply To Email              | Email   | Reply-to address                      | -                |
| Email Footer                | Text    | Footer added to all emails            | -                |
| Welcome Email Template      | Text    | Template for new user welcome         | Default          |
| Password Reset Template     | Text    | Template for password reset           | Default          |
| Inspection Alert Template   | Text    | Template for inspection notifications | Default          |
| System Alert Template       | Text    | Template for system alerts            | Default          |
| Enable Email Notifications  | Boolean | Master switch for emails              | true             |
| Enable In-App Notifications | Boolean | Enable in-app notification center     | true             |
| Notification Retention Days | Number  | Days to keep notifications            | 30               |

### 5.3 Database Schema

```prisma
model EmailSettings {
  id                String   @id @default(cuid())
  // SMTP Configuration
  smtpHost          String?
  smtpPort          Int      @default(587)
  smtpUsername      String?
  smtpPassword      String?  // Encrypted
  smtpSecure        Boolean  @default(true)
  fromEmail         String?
  fromName          String   @default("Ship Reporting")
  replyToEmail      String?
  emailFooter       String?
  // Email Templates
  welcomeEmailTemplate        String?
  passwordResetTemplate       String?
  inspectionAlertTemplate     String?
  systemAlertTemplate         String?
  orgApprovalTemplate         String?
  orgRejectionTemplate        String?
  // Toggles
  enableEmailNotifications    Boolean @default(true)
  enableInAppNotifications    Boolean @default(true)
  notificationRetentionDays   Int     @default(30)
  createdAt                   DateTime @default(now())
  updatedAt                   DateTime @updatedAt
}

model Notification {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  type        NotificationType
  title       String
  message     String
  link        String?
  isRead      Boolean  @default(false)
  metadata    Json?
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
}

enum NotificationType {
  INFO
  SUCCESS
  WARNING
  ERROR
  INSPECTION
  SYSTEM
}

model EmailLog {
  id          String   @id @default(cuid())
  to          String
  subject     String
  template    String?
  status      EmailStatus
  error       String?
  sentAt      DateTime?
  createdAt   DateTime @default(now())

  @@index([status])
  @@index([createdAt])
}

enum EmailStatus {
  PENDING
  SENT
  FAILED
}
```

### 5.4 API Endpoints

| Method | Endpoint                                      | Description               |
| ------ | --------------------------------------------- | ------------------------- |
| GET    | `/api/platform/email-settings`                | Get email settings        |
| PATCH  | `/api/platform/email-settings`                | Update email settings     |
| POST   | `/api/platform/email-settings/test`           | Send test email           |
| GET    | `/api/platform/email-templates`               | Get all email templates   |
| PATCH  | `/api/platform/email-templates/:name`         | Update specific template  |
| POST   | `/api/platform/email-templates/:name/preview` | Preview template          |
| GET    | `/api/platform/email-logs`                    | Get email sending logs    |
| GET    | `/api/notifications`                          | Get user notifications    |
| PATCH  | `/api/notifications/:id/read`                 | Mark notification as read |
| PATCH  | `/api/notifications/read-all`                 | Mark all as read          |
| DELETE | `/api/notifications/:id`                      | Delete notification       |

### 5.5 Frontend Components

```
frontend/src/pages/platform-settings/
├── EmailSettings.tsx           # SMTP configuration
├── EmailTemplateEditor.tsx     # Template editor with preview
└── NotificationSettings.tsx    # Notification preferences

frontend/src/components/
├── NotificationCenter.tsx      # In-app notification dropdown
├── NotificationBadge.tsx       # Unread count badge
└── NotificationList.tsx        # List of notifications
```

### 5.6 Tasks

- [ ] Create EmailSettings Prisma model
- [ ] Create Notification and EmailLog models
- [ ] Create database migration
- [ ] Implement email service with template support
- [ ] Create default email templates
- [ ] Implement template variable substitution
- [ ] Create SMTP configuration validation
- [ ] Implement notification service
- [ ] Create notification center component
- [ ] Implement real-time notifications (WebSocket)
- [ ] Create email log viewer
- [ ] Create frontend settings pages
- [ ] Write unit tests
- [ ] Write E2E tests

---

## Phase 6: Feature Flags Settings (Priority: Low)

### 6.1 Description

Control feature availability across the platform with granular control for gradual rollouts and A/B testing.

### 6.2 Features

| Setting               | Type       | Description                 | Default |
| --------------------- | ---------- | --------------------------- | ------- |
| Feature Name          | String     | Unique feature identifier   | -       |
| Display Name          | String     | Human-readable name         | -       |
| Description           | String     | Feature description         | -       |
| Enabled               | Boolean    | Master enable/disable       | false   |
| Rollout Percentage    | Number     | % of users with access      | 100     |
| Allowed Organizations | String[]   | Specific orgs with access   | []      |
| Allowed Roles         | RoleName[] | Roles that can access       | []      |
| Start Date            | DateTime   | When feature becomes active | -       |
| End Date              | DateTime   | When feature deactivates    | -       |
| Is Beta               | Boolean    | Mark as beta feature        | false   |

### 6.3 Database Schema

```prisma
model FeatureFlag {
  id                  String     @id @default(cuid())
  name                String     @unique // e.g., "advanced_reporting"
  displayName         String
  description         String?
  enabled             Boolean    @default(false)
  rolloutPercentage   Int        @default(100)
  allowedOrganizations String[]  @default([])
  allowedRoles        RoleName[] @default([])
  startDate           DateTime?
  endDate             DateTime?
  isBeta              Boolean    @default(false)
  metadata            Json?
  createdAt           DateTime   @default(now())
  updatedAt           DateTime   @updatedAt

  @@index([name])
  @@index([enabled])
}

model FeatureFlagOverride {
  id            String   @id @default(cuid())
  featureFlagId String
  featureFlag   FeatureFlag @relation(fields: [featureFlagId], references: [id])
  organizationId String?
  userId        String?
  enabled       Boolean
  createdAt     DateTime @default(now())

  @@unique([featureFlagId, organizationId, userId])
  @@index([featureFlagId])
  @@index([organizationId])
  @@index([userId])
}
```

### 6.4 API Endpoints

| Method | Endpoint                                               | Description                       |
| ------ | ------------------------------------------------------ | --------------------------------- |
| GET    | `/api/platform/feature-flags`                          | List all feature flags            |
| POST   | `/api/platform/feature-flags`                          | Create new feature flag           |
| GET    | `/api/platform/feature-flags/:id`                      | Get feature flag details          |
| PATCH  | `/api/platform/feature-flags/:id`                      | Update feature flag               |
| DELETE | `/api/platform/feature-flags/:id`                      | Delete feature flag               |
| GET    | `/api/feature-flags/check/:name`                       | Check if feature enabled for user |
| GET    | `/api/feature-flags/user`                              | Get all features for current user |
| POST   | `/api/platform/feature-flags/:id/override`             | Create override                   |
| DELETE | `/api/platform/feature-flags/:id/override/:overrideId` | Remove override                   |

### 6.5 Frontend Components

```
frontend/src/pages/platform-settings/
├── FeatureFlagList.tsx         # List all feature flags
├── FeatureFlagForm.tsx         # Create/edit feature flag
├── FeatureFlagOverrides.tsx    # Manage overrides
└── FeatureFlagAnalytics.tsx    # Usage analytics

frontend/src/hooks/
└── useFeatureFlag.ts           # Hook to check feature access

frontend/src/components/
└── FeatureGate.tsx             # Component to conditionally render
```

### 6.6 Usage Example

```tsx
// Hook usage
const { isEnabled, isLoading } = useFeatureFlag("advanced_reporting");

if (isEnabled) {
  return <AdvancedReportingDashboard />;
}

// Component usage
<FeatureGate feature="advanced_reporting" fallback={<BasicReporting />}>
  <AdvancedReporting />
</FeatureGate>;
```

### 6.7 Tasks

- [ ] Create FeatureFlag Prisma model
- [ ] Create FeatureFlagOverride model
- [ ] Create database migration
- [ ] Implement feature flag service
- [ ] Implement percentage-based rollout logic
- [ ] Implement date-based activation
- [ ] Create useFeatureFlag hook
- [ ] Create FeatureGate component
- [ ] Implement feature flag caching
- [ ] Create frontend management pages
- [ ] Add feature flag analytics
- [ ] Write unit tests
- [ ] Write E2E tests

---

## Implementation Timeline

### Recommended Order

| Phase                          | Priority | Estimated Effort | Dependencies |
| ------------------------------ | -------- | ---------------- | ------------ |
| Phase 3: Security              | Critical | 2-3 weeks        | None         |
| Phase 1: Platform Config       | High     | 1 week           | None         |
| Phase 2: Organization Mgmt     | High     | 1-2 weeks        | Phase 1      |
| Phase 5: Email & Notifications | Medium   | 1-2 weeks        | Phase 1      |
| Phase 4: System Monitoring     | Medium   | 2 weeks          | Phase 1      |
| Phase 6: Feature Flags         | Low      | 1 week           | None         |

### Quick Wins (Can be done immediately)

1. **Platform Name & Logo** - Simple settings with immediate visual impact
2. **Maintenance Mode** - Critical for deployments
3. **Password Policy** - Important security improvement
4. **Session Timeout** - Quick security enhancement

---

## Navigation Structure

```
SUPER_ADMIN Sidebar Menu:
├── Dashboard
├── Organizations
└── Platform Settings
    ├── General (Platform Config)
    ├── Organizations (Org Management)
    ├── Security
    ├── System
    ├── Email & Notifications
    └── Feature Flags
```

---

## Access Control Updates

Update `accessControlProvider.ts`:

```typescript
// Add platform-settings resource for SUPER_ADMIN
if (resource === "platform-settings") {
  if (role === "SUPER_ADMIN") {
    return { can: true };
  }
  return {
    can: false,
    reason: "Only super admins can access platform settings"
  };
}
```

---

## Notes

1. **Single Instance**: All settings models should be singleton (only one record)
2. **Caching**: Cache settings in memory/Redis for performance
3. **Audit Trail**: Log all settings changes to audit log
4. **Encryption**: Encrypt sensitive fields (SMTP password, 2FA secrets)
5. **Validation**: Validate all settings before saving
6. **Defaults**: Seed default settings on first deployment
7. **Migration**: Create migration scripts for existing data
