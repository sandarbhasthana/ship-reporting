import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateEntryDto, UpdateEntryDto } from './dto';
import { RoleName } from '@ship-reporting/prisma';

// Ship staff fields that captains can edit
const SHIP_STAFF_FIELDS = [
  'srNo',
  'deficiency',
  'mastersCauseAnalysis',
  'correctiveAction',
  'preventiveAction',
  'completionDate',
];

@Injectable()
export class EntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private async verifyReportAccess(
    reportId: string,
    userRole: RoleName,
    assignedVesselId: string | null,
  ) {
    const report = await this.prisma.inspectionReport.findUnique({
      where: { id: reportId },
      select: { id: true, vesselId: true },
    });

    if (!report) {
      throw new NotFoundException('Inspection report not found');
    }

    // Captains can only access their vessel's reports
    if (userRole === RoleName.CAPTAIN && report.vesselId !== assignedVesselId) {
      throw new ForbiddenException('You do not have access to this report');
    }

    return report;
  }

  private filterFieldsByRole<T extends object>(
    data: T,
    userRole: RoleName,
  ): Partial<T> {
    const filtered: Partial<T> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;

      // Admin can edit all fields
      if (userRole === RoleName.ADMIN) {
        (filtered as Record<string, unknown>)[key] = value;
      }
      // Captain can only edit ship staff fields
      else if (SHIP_STAFF_FIELDS.includes(key)) {
        (filtered as Record<string, unknown>)[key] = value;
      }
    }

    return filtered;
  }

  async create(
    reportId: string,
    createEntryDto: CreateEntryDto,
    userId: string,
    userRole: RoleName,
    assignedVesselId: string | null,
    organizationId?: string | null,
  ) {
    await this.verifyReportAccess(reportId, userRole, assignedVesselId);

    // Check entry count limit (max 100 entries per report)
    const entryCount = await this.prisma.inspectionEntry.count({
      where: { reportId },
    });

    if (entryCount >= 100) {
      throw new BadRequestException('Maximum 100 entries per report allowed');
    }

    // Filter fields based on role
    const filteredData = this.filterFieldsByRole(createEntryDto, userRole);

    // Ensure required fields are present
    if (!filteredData.srNo || !filteredData.deficiency) {
      throw new BadRequestException('srNo and deficiency are required');
    }

    const entry = await this.prisma.inspectionEntry.create({
      data: {
        reportId,
        srNo: filteredData.srNo,
        deficiency: filteredData.deficiency,
        mastersCauseAnalysis: filteredData.mastersCauseAnalysis,
        correctiveAction: filteredData.correctiveAction,
        preventiveAction: filteredData.preventiveAction,
        completionDate: filteredData.completionDate
          ? new Date(filteredData.completionDate)
          : undefined,
        companyAnalysis: filteredData.companyAnalysis,
        status: filteredData.status,
        officeSignUserId: userRole === RoleName.ADMIN ? userId : undefined,
        officeSignDate: filteredData.officeSignDate
          ? new Date(filteredData.officeSignDate)
          : undefined,
      },
    });

    // Log audit with organization context
    await this.auditService.log(
      'InspectionEntry',
      entry.id,
      'CREATE',
      null,
      entry,
      {
        userId,
        organizationId: organizationId ?? undefined,
      },
    );

    return entry;
  }

  async findAll(
    reportId: string,
    userRole: RoleName,
    assignedVesselId: string | null,
  ) {
    await this.verifyReportAccess(reportId, userRole, assignedVesselId);

    return this.prisma.inspectionEntry.findMany({
      where: { reportId },
      orderBy: { srNo: 'asc' },
      include: {
        officeSignUser: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async findOne(
    reportId: string,
    entryId: string,
    userRole: RoleName,
    assignedVesselId: string | null,
  ) {
    await this.verifyReportAccess(reportId, userRole, assignedVesselId);

    const entry = await this.prisma.inspectionEntry.findFirst({
      where: { id: entryId, reportId },
      include: {
        officeSignUser: {
          select: { id: true, name: true },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    return entry;
  }

  async update(
    reportId: string,
    entryId: string,
    updateEntryDto: UpdateEntryDto,
    userId: string,
    userRole: RoleName,
    assignedVesselId: string | null,
    organizationId?: string | null,
  ) {
    const before = await this.findOne(
      reportId,
      entryId,
      userRole,
      assignedVesselId,
    );

    // Filter fields based on role
    const filteredData = this.filterFieldsByRole(updateEntryDto, userRole);

    // If admin is updating office fields, auto-sign
    const updateData: Record<string, unknown> = { ...filteredData };

    if (userRole === RoleName.ADMIN) {
      if (filteredData.companyAnalysis || filteredData.status) {
        updateData.officeSignUserId = userId;
        updateData.officeSignDate = new Date();
      }
    }

    // Handle date conversions
    if (filteredData.completionDate) {
      updateData.completionDate = new Date(String(filteredData.completionDate));
    }
    if (filteredData.officeSignDate) {
      updateData.officeSignDate = new Date(String(filteredData.officeSignDate));
    }

    const after = await this.prisma.inspectionEntry.update({
      where: { id: entryId },
      data: updateData,
      include: {
        officeSignUser: {
          select: { id: true, name: true },
        },
      },
    });

    // Determine the action type based on what changed
    let action = 'UPDATE';

    // Check for office signature added
    if (!before.officeSignUserId && after.officeSignUserId) {
      action = 'OFFICE_SIGN';
    }
    // Check for office signature removed
    else if (before.officeSignUserId && !after.officeSignUserId) {
      action = 'OFFICE_UNSIGN';
    }
    // Check for status change
    else if (before.status !== after.status) {
      action = 'STATUS_CHANGE';
    }

    // Log audit with organization context
    await this.auditService.log(
      'InspectionEntry',
      entryId,
      action,
      before,
      after,
      {
        userId,
        organizationId: organizationId ?? undefined,
      },
    );

    return after;
  }

  async remove(
    reportId: string,
    entryId: string,
    userId?: string,
    organizationId?: string | null,
  ) {
    const entry = await this.prisma.inspectionEntry.findFirst({
      where: { id: entryId, reportId },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    await this.prisma.inspectionEntry.delete({
      where: { id: entryId },
    });

    // Log audit with organization context
    await this.auditService.log(
      'InspectionEntry',
      entryId,
      'DELETE',
      entry,
      null,
      {
        userId,
        organizationId: organizationId ?? undefined,
      },
    );

    return { deleted: true };
  }
}
