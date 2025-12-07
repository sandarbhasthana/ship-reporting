-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('ADMIN', 'CAPTAIN');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('OPEN', 'FURTHER_ACTION_NEEDED', 'CLOSED_SATISFACTORILY');

-- CreateTable
CREATE TABLE "Organization" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "defaultFormNo" TEXT,
    "footerText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "signatureImage" TEXT,
    "role" "RoleName" NOT NULL DEFAULT 'CAPTAIN',
    "organizationId" INTEGER,
    "assignedVesselId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vessel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "imoNumber" TEXT,
    "callSign" TEXT,
    "flag" TEXT,
    "organizationId" INTEGER,
    "shipFileNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vessel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionReport" (
    "id" SERIAL NOT NULL,
    "vesselId" INTEGER NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'THIRD PARTY DEFICIENCY SUMMARY',
    "shipFileNo" TEXT,
    "officeFileNo" TEXT,
    "revisionNo" TEXT,
    "formNo" TEXT,
    "applicableFomSections" TEXT,
    "inspectedBy" TEXT,
    "inspectionDate" TIMESTAMP(3),
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionEntry" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "srNo" TEXT NOT NULL,
    "deficiency" TEXT NOT NULL,
    "mastersCauseAnalysis" TEXT,
    "correctiveAction" TEXT,
    "preventiveAction" TEXT,
    "completionDate" TIMESTAMP(3),
    "companyAnalysis" TEXT,
    "status" "InspectionStatus" NOT NULL DEFAULT 'OPEN',
    "officeSignUserId" INTEGER,
    "officeSignDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InspectionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_assignedVesselId_key" ON "User"("assignedVesselId");

-- CreateIndex
CREATE UNIQUE INDEX "Vessel_imoNumber_key" ON "Vessel"("imoNumber");

-- CreateIndex
CREATE INDEX "InspectionEntry_reportId_idx" ON "InspectionEntry"("reportId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

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
