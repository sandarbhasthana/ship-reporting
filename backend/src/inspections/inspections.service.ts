import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateInspectionDto, UpdateInspectionDto } from './dto';
import { RoleName } from '@ship-reporting/prisma';

@Injectable()
export class InspectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(
    createInspectionDto: CreateInspectionDto,
    userId: string,
    userRole: RoleName,
    assignedVesselId: string | null,
    organizationId: string,
  ) {
    // Determine vessel ID
    let vesselId = createInspectionDto.vesselId;

    // For Captains, use their assigned vessel
    if (userRole === RoleName.CAPTAIN) {
      if (!assignedVesselId) {
        throw new ForbiddenException(
          'Captain must be assigned to a vessel to create reports',
        );
      }
      vesselId = assignedVesselId;
    }

    if (!vesselId) {
      throw new ForbiddenException('Vessel ID is required');
    }

    // Get vessel and verify it belongs to the user's organization
    const vessel = await this.prisma.vessel.findUnique({
      where: { id: vesselId },
      select: { shipFileNo: true, organizationId: true },
    });

    if (!vessel) {
      throw new NotFoundException('Vessel not found');
    }

    // Verify vessel belongs to user's organization
    if (vessel.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Vessel does not belong to your organization',
      );
    }

    // Get organization's default formNo if not provided
    let formNo = createInspectionDto.formNo;
    if (!formNo && vessel?.organizationId) {
      const org = await this.prisma.organization.findUnique({
        where: { id: vessel.organizationId },
        select: { defaultFormNo: true },
      });
      formNo = org?.defaultFormNo ?? undefined;
    }

    // Prepare entries data
    const entriesData = createInspectionDto.entries?.map((entry) => {
      const signUserId = entry.officeSignUserId;
      return {
        srNo: entry.srNo,
        deficiency: entry.deficiency,
        mastersCauseAnalysis: entry.mastersCauseAnalysis,
        correctiveAction: entry.correctiveAction,
        preventiveAction: entry.preventiveAction,
        completionDate: entry.completionDate
          ? new Date(entry.completionDate)
          : undefined,
        companyAnalysis: entry.companyAnalysis,
        status: entry.status,
        officeSignUserId: signUserId,
        officeSignDate: entry.officeSignDate
          ? new Date(entry.officeSignDate)
          : undefined,
      };
    });

    const report = await this.prisma.inspectionReport.create({
      data: {
        vesselId,
        organizationId, // Add organization to report
        createdById: userId,
        title: createInspectionDto.title ?? 'THIRD PARTY DEFICIENCY SUMMARY',
        shipFileNo: createInspectionDto.shipFileNo ?? vessel?.shipFileNo,
        officeFileNo: createInspectionDto.officeFileNo,
        revisionNo: createInspectionDto.revisionNo,
        formNo,
        applicableFomSections: createInspectionDto.applicableFomSections,
        inspectedBy: createInspectionDto.inspectedBy,
        inspectionDate: createInspectionDto.inspectionDate
          ? new Date(createInspectionDto.inspectionDate)
          : undefined,
        entries: entriesData?.length ? { create: entriesData } : undefined,
      },
      include: {
        vessel: true,
        organization: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        entries: true,
      },
    });

    // Log audit with organization context
    await this.auditService.log(
      'InspectionReport',
      report.id,
      'CREATE',
      null,
      report,
      { userId, organizationId },
    );

    return report;
  }

  async findAll(
    organizationId: string | null,
    userRole: RoleName,
    assignedVesselId: string | null,
  ) {
    // Build where clause with organization filter
    const where: { organizationId?: string; vesselId?: string } = {};

    // SUPER_ADMIN without org header can see all
    // Other users are filtered by their organization
    if (organizationId) {
      where.organizationId = organizationId;
    }

    // Captains can only see reports for their vessel
    if (userRole === RoleName.CAPTAIN && assignedVesselId) {
      where.vesselId = assignedVesselId;
    }

    return this.prisma.inspectionReport.findMany({
      where,
      include: {
        vessel: true,
        organization: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        entries: {
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(
    id: string,
    organizationId: string | null,
    userRole: RoleName,
    assignedVesselId: string | null,
  ) {
    const report = await this.prisma.inspectionReport.findUnique({
      where: { id },
      include: {
        vessel: true,
        organization: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        entries: {
          orderBy: { srNo: 'asc' },
          include: {
            officeSignUser: {
              select: { id: true, name: true, signatureImage: true },
            },
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Inspection report not found');
    }

    // Check organization access (skip for SUPER_ADMIN without org context)
    if (organizationId && report.organizationId !== organizationId) {
      throw new NotFoundException('Inspection report not found');
    }

    // Captains can only see their vessel's reports
    if (userRole === RoleName.CAPTAIN && report.vesselId !== assignedVesselId) {
      throw new ForbiddenException('You do not have access to this report');
    }

    return report;
  }

  async update(
    id: string,
    updateInspectionDto: UpdateInspectionDto,
    userId: string,
    organizationId: string | null,
    userRole: RoleName,
    assignedVesselId: string | null,
  ) {
    // First verify access and get before state
    const before = await this.findOne(
      id,
      organizationId,
      userRole,
      assignedVesselId,
    );

    // Destructure entries and vesselId from the rest of the DTO
    // vesselId should not be updated after creation
    const {
      entries,
      inspectionDate,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      vesselId: _vesselId,
      ...reportData
    } = updateInspectionDto;

    // Handle entries update if provided
    if (entries && entries.length > 0) {
      // Delete existing entries and recreate
      await this.prisma.inspectionEntry.deleteMany({
        where: { reportId: id },
      });

      await this.prisma.inspectionEntry.createMany({
        data: entries.map((entry) => {
          const signUserId = entry.officeSignUserId;
          return {
            reportId: id,
            srNo: entry.srNo ?? '',
            deficiency: entry.deficiency ?? '',
            mastersCauseAnalysis: entry.mastersCauseAnalysis,
            correctiveAction: entry.correctiveAction,
            preventiveAction: entry.preventiveAction,
            completionDate: entry.completionDate
              ? new Date(entry.completionDate)
              : undefined,
            companyAnalysis: entry.companyAnalysis,
            status: entry.status,
            officeSignUserId: signUserId,
            officeSignDate: entry.officeSignDate
              ? new Date(entry.officeSignDate)
              : undefined,
          };
        }),
      });
    }

    const after = await this.prisma.inspectionReport.update({
      where: { id },
      data: {
        ...reportData,
        inspectionDate: inspectionDate ? new Date(inspectionDate) : undefined,
      },
      include: {
        vessel: true,
        organization: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        entries: true,
      },
    });

    // Log audit with organization context
    await this.auditService.log(
      'InspectionReport',
      id,
      'UPDATE',
      before,
      after,
      { userId, organizationId: organizationId || undefined },
    );

    return after;
  }

  async remove(id: string, organizationId: string | null, userId?: string) {
    const report = await this.prisma.inspectionReport.findUnique({
      where: { id },
      include: {
        vessel: { select: { id: true, name: true } },
        entries: true,
      },
    });

    if (!report) {
      throw new NotFoundException('Inspection report not found');
    }

    // Check organization access (skip for SUPER_ADMIN without org context)
    if (organizationId && report.organizationId !== organizationId) {
      throw new NotFoundException('Inspection report not found');
    }

    await this.prisma.inspectionReport.delete({
      where: { id },
    });

    // Log audit for deletion
    await this.auditService.log(
      'InspectionReport',
      id,
      'DELETE',
      report,
      null,
      { userId, organizationId: organizationId ?? undefined },
    );

    return { deleted: true, id };
  }
}
