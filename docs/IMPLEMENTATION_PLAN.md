# Ship Reporting Application - Implementation Plan

## Overview

A platform to assign, track, and close deficiencies/observations during ship inspections with auditable records.

### Tech Stack

| Layer    | Technology                                        |
| -------- | ------------------------------------------------- |
| Frontend | Vite + React 19 + Refine + AntD + React Router v7 |
| Backend  | NestJS + Prisma 7 + PostgreSQL + BullMQ           |
| Auth     | JWT (username/password)                           |
| Monorepo | Turborepo + npm workspaces                        |

### User Roles

| Role                 | Description                                                                     |
| -------------------- | ------------------------------------------------------------------------------- |
| **Admin** (Office)   | Can edit all fields, manage organization settings, add company analysis/remarks |
| **Captain** (Vessel) | 1 per vessel, creates reports, edits ship staff fields (1-6)                    |

---

## Phase 1: Backend Foundation ✅

### 1.1 Auth Module

- [x] JWT authentication strategy
- [x] Login endpoint (`POST /auth/login`)
- [x] Register endpoint (`POST /auth/register`) - Admin only
- [x] Current user endpoint (`GET /auth/me`)
- [x] Password hashing with bcrypt
- [x] Role-based guards (Admin, Captain)

### 1.2 Organization Module

- [x] CRUD for Organization settings
- [x] `GET /organization` - Get current org settings
- [x] `PATCH /organization` - Update org settings (Admin only)
- [x] Fields: name, logo, defaultFormNo, footerText

### 1.3 File Upload Module

- [x] Local file storage service
- [x] `POST /upload/logo` - Upload company logo (Admin)
- [x] `POST /upload/signature` - Upload user signature
- [x] File validation (type, size)
- [x] Serve static files

### 1.4 User Module

- [x] CRUD for Users
- [x] `GET /users` - List users (Admin only)
- [x] `GET /users/:id` - Get user details
- [x] `POST /users` - Create user (Admin only)
- [x] `PATCH /users/:id` - Update user
- [x] `DELETE /users/:id` - Soft delete (Admin only)
- [x] Signature image upload endpoint

### 1.5 Vessel Module

- [x] CRUD for Vessels
- [x] `GET /vessels` - List vessels
- [x] `GET /vessels/:id` - Get vessel details
- [x] `POST /vessels` - Create vessel (Admin only)
- [x] `PATCH /vessels/:id` - Update vessel
- [x] `DELETE /vessels/:id` - Soft delete (Admin only)
- [x] Captain assignment logic

---

## Phase 2: Core Features ✅

### 2.1 Inspection Report Module

- [x] CRUD for Inspection Reports
- [x] `GET /inspections` - List reports (filtered by role)
- [x] `GET /inspections/:id` - Get report with entries
- [x] `POST /inspections` - Create report (Captain)
- [x] `PATCH /inspections/:id` - Update report
- [x] `DELETE /inspections/:id` - Delete report (Admin only)
- [x] Field-level permission enforcement
- [x] Auto-populate vessel from Captain's assignment

### 2.2 Inspection Entry Module

- [x] CRUD for Inspection Entries
- [x] `POST /inspections/:id/entries` - Add entry
- [x] `PATCH /inspections/:id/entries/:entryId` - Update entry
- [x] `DELETE /inspections/:id/entries/:entryId` - Delete entry
- [x] Field-level permissions (Ship Staff vs Office fields)
- [x] Validation (max 100 entries, field lengths)

### 2.3 Audit Logging

- [x] Audit service for logging changes
- [x] Track CREATE, UPDATE, DELETE, STATUS_CHANGE actions
- [x] Store before/after snapshots
- [x] Include user, IP, timestamp
- [x] `GET /audit-logs` - Query logs (Admin only)

---

## Phase 3: Frontend - Settings Pages ✅

### 3.1 Admin Settings Page

- [x] Organization settings form
- [x] Company name input
- [x] Logo upload with preview
- [x] Default form number
- [x] Footer text for PDF
- [x] Save/cancel functionality

### 3.2 Vessel Settings Page

- [x] Vessel details form
- [x] Ship file number setting
- [x] Captain assignment dropdown
- [x] Vessel metadata (IMO, callsign, flag)

### 3.3 User Profile/Settings

- [x] Profile information
- [x] Signature image upload
- [x] Password change

---

## Phase 4: Frontend - Inspection UI ✅

### 4.1 Inspection Report List

- [x] Data table with filters
- [x] Search by vessel, date, status
- [x] Role-based visibility
- [x] Quick actions (view, edit, delete)

### 4.2 Inspection Report Form

- [x] Header fields section
- [x] Tabular entry form (matching PDF layout)
- [x] Ship Staff columns (1-6) - editable by Captain/Admin
- [x] Office columns (7-8) - editable by Admin only
- [x] Add/remove entry rows
- [x] Validation feedback
- [ ] Auto-save draft (optional - future enhancement)

### 4.3 Inspection Report View

- [x] Read-only view of report
- [x] Print-friendly layout
- [x] Export to PDF button (placeholder - actual PDF in Phase 5)

---

## Phase 5: PDF Export ⬜

### 5.1 PDF Generation Service

- [ ] Install PDF library (puppeteer or pdfkit)
- [ ] Create PDF template matching document format
- [ ] Fixed header on every page
- [ ] Dynamic page numbers (e.g., "1/19")
- [ ] Company logo placement
- [ ] Signature image rendering

### 5.2 PDF API Endpoint

- [ ] `GET /inspections/:id/pdf` - Generate and download PDF
- [ ] Caching for generated PDFs (optional)

---

## Phase 6: Polish & Testing ⬜

### 6.1 Validation & Error Handling

- [ ] Input validation (class-validator)
- [ ] Consistent error responses
- [ ] Frontend form validation

### 6.2 Testing

- [ ] Unit tests for services
- [ ] E2E tests for critical flows
- [ ] Frontend component tests

### 6.3 Performance & Security

- [ ] Rate limiting
- [ ] Input sanitization
- [ ] Query optimization

---

## Database Schema (Completed ✅)

```
Organization (id, name, logo, defaultFormNo, footerText)
User (id, email, passwordHash, name, role, signatureImage, organizationId, assignedVesselId)
Vessel (id, name, imoNumber, callSign, flag, shipFileNo, organizationId)
InspectionReport (id, vesselId, title, shipFileNo, officeFileNo, revisionNo, formNo, ...)
InspectionEntry (id, reportId, srNo, deficiency, mastersCauseAnalysis, ..., companyAnalysis, status, ...)
AuditLog (id, userId, entityType, entityId, action, before, after, ...)
```

---

## Progress Tracking

| Phase                           | Status         | Completion |
| ------------------------------- | -------------- | ---------- |
| Phase 1: Backend Foundation     | ✅ Complete    | 100%       |
| Phase 2: Core Features          | ✅ Complete    | 100%       |
| Phase 3: Frontend Settings      | ✅ Complete    | 100%       |
| Phase 4: Frontend Inspection UI | ✅ Complete    | 100%       |
| Phase 5: PDF Export             | ⬜ Not Started | 0%         |
| Phase 6: Polish & Testing       | ⬜ Not Started | 0%         |

---

_Last Updated: 2025-12-07_
