# AWS S3 Image Upload & Retrieval Implementation Plan

## Overview

This document outlines the implementation plan for integrating AWS S3 bucket storage for image uploads in the Ship Reporting application. The implementation follows a proper folder structure: `Organization > User` to ensure data isolation and proper access control.

---

## Current State

The application currently uses **local file storage** with the following structure:

- `/uploads/logos/` - Organization logos
- `/uploads/signatures/` - User digital signatures
- `/uploads/profile-images/` - User profile images

**Limitations of current approach:**

- Not scalable for production environments
- Files lost on server restart (in containerized deployments)
- No CDN integration for faster delivery
- Storage limited to server disk space

---

## Target S3 Folder Structure

```
s3://bucket-name/
├── organizations/
│   └── {organizationId}/
│       ├── logo/
│       │   └── {filename}.{ext}
│       └── users/
│           └── {userId}/
│               ├── signature/
│               │   └── {filename}.{ext}
│               └── profile/
│                   └── {filename}.{ext}
```

**Example paths:**

- Organization logo: `organizations/clx123abc/logo/logo-2024.png`
- User signature: `organizations/clx123abc/users/clx456def/signature/sig-2024.png`
- User profile: `organizations/clx123abc/users/clx456def/profile/avatar.jpg`

---

## Implementation Phases

### Phase 1: AWS SDK Setup & Configuration ✅

**Estimated Time: 1 hour** - COMPLETED

| Task              | Description                                                      | Status |
| ----------------- | ---------------------------------------------------------------- | ------ |
| Install AWS SDK   | Install `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` | ✅     |
| Create S3 Config  | Create S3 configuration module with environment variables        | ✅     |
| Environment Setup | Add AWS credentials to `.env` file                               | ✅     |

**Environment Variables Required:**

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name

# Optional: Enable/Disable S3 (fallback to local storage)
USE_S3_STORAGE=true
```

### Phase 2: S3 Upload Service Implementation ✅

**Estimated Time: 2-3 hours** - COMPLETED

| Task                  | Description                                                      | Status |
| --------------------- | ---------------------------------------------------------------- | ------ |
| Create S3 Service     | Implement `S3StorageService` with upload functionality           | ✅     |
| Upload with Structure | Implement `uploadFile()` with Organization/User folder structure | ✅     |
| Pre-signed URLs       | Implement `getSignedUrl()` for secure file access                | ✅     |
| File Deletion         | Implement `deleteFile()` for cleanup operations                  | ✅     |

**Key Methods:**

```typescript
interface S3StorageService {
  uploadOrganizationLogo(
    file: Buffer,
    organizationId: string,
    filename: string
  ): Promise<string>;
  uploadUserSignature(
    file: Buffer,
    organizationId: string,
    userId: string,
    filename: string
  ): Promise<string>;
  uploadUserProfile(
    file: Buffer,
    organizationId: string,
    userId: string,
    filename: string
  ): Promise<string>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  deleteFile(key: string): Promise<void>;
}
```

### Phase 3: Update Upload Module ✅

**Estimated Time: 2 hours** - COMPLETED

| Task                  | Description                                             | Status |
| --------------------- | ------------------------------------------------------- | ------ |
| Update Upload Service | Modify `upload.service.ts` to use S3                    | ✅     |
| Update Controller     | Update endpoints with proper context (orgId, userId)    | ✅     |
| Fallback Logic        | Implement fallback to local storage when S3 is disabled | ✅     |

### Phase 4: Frontend Integration ✅

**Estimated Time: 1 hour** - COMPLETED

| Task                    | Description                            | Status |
| ----------------------- | -------------------------------------- | ------ |
| Update Image Components | Handle both S3 URLs and local paths    | ✅     |
| Update API Calls        | Ensure proper headers for file uploads | ✅     |

**Files Created:**

- `frontend/src/utils/imageUrl.ts` - URL resolution utilities
- `frontend/src/hooks/useImageUrl.ts` - React hooks for image URL handling
- `frontend/src/components/S3Image.tsx` - Reusable S3-aware image component

**Components Updated:**

- `Header.tsx` - Profile image display
- `UserProfile.tsx` - Profile image and signature display
- `OrganizationSettings.tsx` - Organization logo display
- `OrganizationList.tsx` - Organization logo in table
- `pdf.service.ts` - PDF generation logo handling

### Phase 5: Testing & Documentation

**Estimated Time: 1-2 hours**

| Task              | Description               | Status |
| ----------------- | ------------------------- | ------ |
| Unit Tests        | Test S3 service methods   | ⬜     |
| Integration Tests | Test upload/download flow | ⬜     |
| Manual Testing    | Verify in Swagger UI      | ⬜     |

---

## AWS S3 Bucket Configuration

### Required Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowApplicationAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/YOUR_IAM_USER"
      },
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR_BUCKET_NAME",
        "arn:aws:s3:::YOUR_BUCKET_NAME/*"
      ]
    }
  ]
}
```

### CORS Configuration (for direct browser uploads if needed)

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:5173", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

---

## Security Considerations

1. **IAM User with Minimal Permissions**: Create dedicated IAM user with only required S3 permissions
2. **Pre-signed URLs**: Use time-limited pre-signed URLs for file access (default: 1 hour)
3. **File Validation**: Validate file types and sizes before upload
4. **Organization Isolation**: Files stored in organization-specific folders
5. **Server-side Upload**: All uploads go through backend to ensure proper authorization

---

## Rollback Plan

If issues arise, set `USE_S3_STORAGE=false` in environment variables to fallback to local storage immediately.

---

## Total Estimated Time: 7-9 hours

---

## Next Steps

1. ✅ Create implementation plan (this document)
2. ⬜ Begin Phase 1: Install dependencies and configure AWS
3. ⬜ Implement S3 service
4. ⬜ Update existing upload module
5. ⬜ Test and deploy
