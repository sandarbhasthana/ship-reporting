/*
  Warnings:

  - Made the column `organizationId` on table `InspectionReport` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "InspectionReport" DROP CONSTRAINT "InspectionReport_organizationId_fkey";

-- AlterTable
ALTER TABLE "InspectionReport" ALTER COLUMN "organizationId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "InspectionReport" ADD CONSTRAINT "InspectionReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
