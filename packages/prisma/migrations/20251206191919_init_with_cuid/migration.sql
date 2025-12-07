/*
  Warnings:

  - The primary key for the `AuditLog` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `InspectionEntry` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `InspectionReport` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Organization` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Vessel` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "InspectionEntry" DROP CONSTRAINT "InspectionEntry_officeSignUserId_fkey";

-- DropForeignKey
ALTER TABLE "InspectionEntry" DROP CONSTRAINT "InspectionEntry_reportId_fkey";

-- DropForeignKey
ALTER TABLE "InspectionReport" DROP CONSTRAINT "InspectionReport_createdById_fkey";

-- DropForeignKey
ALTER TABLE "InspectionReport" DROP CONSTRAINT "InspectionReport_vesselId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_assignedVesselId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Vessel" DROP CONSTRAINT "Vessel_organizationId_fkey";

-- AlterTable
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "entityId" SET DATA TYPE TEXT,
ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "AuditLog_id_seq";

-- AlterTable
ALTER TABLE "InspectionEntry" DROP CONSTRAINT "InspectionEntry_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "reportId" SET DATA TYPE TEXT,
ALTER COLUMN "officeSignUserId" SET DATA TYPE TEXT,
ADD CONSTRAINT "InspectionEntry_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "InspectionEntry_id_seq";

-- AlterTable
ALTER TABLE "InspectionReport" DROP CONSTRAINT "InspectionReport_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "vesselId" SET DATA TYPE TEXT,
ALTER COLUMN "createdById" SET DATA TYPE TEXT,
ADD CONSTRAINT "InspectionReport_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "InspectionReport_id_seq";

-- AlterTable
ALTER TABLE "Organization" DROP CONSTRAINT "Organization_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Organization_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Organization_id_seq";

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "organizationId" SET DATA TYPE TEXT,
ALTER COLUMN "assignedVesselId" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- AlterTable
ALTER TABLE "Vessel" DROP CONSTRAINT "Vessel_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "organizationId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Vessel_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Vessel_id_seq";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_assignedVesselId_fkey" FOREIGN KEY ("assignedVesselId") REFERENCES "Vessel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vessel" ADD CONSTRAINT "Vessel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionReport" ADD CONSTRAINT "InspectionReport_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Vessel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionReport" ADD CONSTRAINT "InspectionReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionEntry" ADD CONSTRAINT "InspectionEntry_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "InspectionReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionEntry" ADD CONSTRAINT "InspectionEntry_officeSignUserId_fkey" FOREIGN KEY ("officeSignUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
