import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInspectionDto, UpdateInspectionDto } from './dto';
import { RoleName } from '@ship-reporting/prisma';

@Injectable()
export class InspectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createInspectionDto: CreateInspectionDto,
    userId: string,
    userRole: RoleName,
    assignedVesselId: string | null,
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

    // Get vessel's default shipFileNo if not provided
    const vessel = await this.prisma.vessel.findUnique({
      where: { id: vesselId },
      select: { shipFileNo: true, organizationId: true },
    });

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
      const signUserId = entry.officeSignUserId as string | undefined;
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

    return this.prisma.inspectionReport.create({
      data: {
        vesselId,
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
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        entries: true,
      },
    });
  }

  async findAll(userRole: RoleName, assignedVesselId: string | null) {
    // Captains can only see reports for their vessel
    const where =
      userRole === RoleName.CAPTAIN && assignedVesselId
        ? { vesselId: assignedVesselId }
        : {};

    return this.prisma.inspectionReport.findMany({
      where,
      include: {
        vessel: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: { select: { entries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(
    id: string,
    userRole: RoleName,
    assignedVesselId: string | null,
  ) {
    const report = await this.prisma.inspectionReport.findUnique({
      where: { id },
      include: {
        vessel: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        entries: {
          orderBy: { srNo: 'asc' },
          include: {
            officeSignUser: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!report) {
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
    userRole: RoleName,
    assignedVesselId: string | null,
  ) {
    // First verify access
    await this.findOne(id, userRole, assignedVesselId);

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
          const signUserId = entry.officeSignUserId as string | undefined;
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

    return this.prisma.inspectionReport.update({
      where: { id },
      data: {
        ...reportData,
        inspectionDate: inspectionDate ? new Date(inspectionDate) : undefined,
      },
      include: {
        vessel: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        entries: true,
      },
    });
  }

  async remove(id: string) {
    const report = await this.prisma.inspectionReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException('Inspection report not found');
    }

    return this.prisma.inspectionReport.delete({
      where: { id },
    });
  }
}
