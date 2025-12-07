/**
 * Prisma 7 - Shared database package
 *
 * Re-exports the generated Prisma client and provides a singleton instance.
 * Import from '@ship-reporting/prisma' in your apps.
 */

// Re-export everything from the generated Prisma client
// Prisma 7 uses client.ts as the main entry point
export {
  PrismaClient,
  Prisma,
  RoleName,
  InspectionStatus,
  $Enums
} from "../generated/client/client";

// Type-only exports for models
export type {
  Organization,
  User,
  Vessel,
  InspectionReport,
  InspectionEntry,
  AuditLog
} from "../generated/client/client";
