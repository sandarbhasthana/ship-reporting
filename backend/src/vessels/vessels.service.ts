import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateVesselDto, UpdateVesselDto } from './dto';

@Injectable()
export class VesselsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(
    createVesselDto: CreateVesselDto & { organizationId: string },
    createdByUserId?: string,
  ) {
    // Check if IMO number already exists (if provided)
    if (createVesselDto.imoNumber) {
      const existing = await this.prisma.vessel.findUnique({
        where: { imoNumber: createVesselDto.imoNumber },
      });
      if (existing) {
        throw new ConflictException(
          'Vessel with this IMO number already exists',
        );
      }
    }

    const vessel = await this.prisma.vessel.create({
      data: createVesselDto,
      include: {
        organization: true,
        captain: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Log audit for vessel creation
    await this.auditService.log('Vessel', vessel.id, 'CREATE', null, vessel, {
      userId: createdByUserId,
      organizationId: vessel.organizationId ?? undefined,
    });

    return vessel;
  }

  async findAll(
    organizationId: string | null,
    userId?: string,
    userRole?: string,
  ) {
    // If user is a CAPTAIN, only show their assigned vessel
    if (userRole === 'CAPTAIN' && userId) {
      // First get the user's assigned vessel ID
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { assignedVesselId: true },
      });

      if (!user?.assignedVesselId) {
        // Captain has no assigned vessel
        return [];
      }

      return this.prisma.vessel.findMany({
        where: { id: user.assignedVesselId },
        include: {
          organization: true,
          captain: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          _count: {
            select: {
              inspections: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    }

    // For ADMIN or SUPER_ADMIN, filter by organization context
    // SUPER_ADMIN without org header can see all vessels
    const where = organizationId ? { organizationId } : {};

    return this.prisma.vessel.findMany({
      where,
      include: {
        organization: true,
        captain: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            inspections: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, organizationId?: string | null) {
    const vessel = await this.prisma.vessel.findUnique({
      where: { id },
      include: {
        organization: true,
        captain: {
          select: {
            id: true,
            email: true,
            name: true,
            signatureImage: true,
          },
        },
        inspections: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!vessel) {
      throw new NotFoundException(`Vessel with ID ${id} not found`);
    }

    // Check organization access (skip for SUPER_ADMIN without org context)
    if (organizationId && vessel.organizationId !== organizationId) {
      throw new NotFoundException(`Vessel with ID ${id} not found`);
    }

    return vessel;
  }

  async update(
    id: string,
    updateVesselDto: UpdateVesselDto,
    organizationId?: string | null,
    updatedByUserId?: string,
  ) {
    const before = await this.findOne(id, organizationId);

    // Check IMO uniqueness if being updated
    if (updateVesselDto.imoNumber) {
      const existing = await this.prisma.vessel.findFirst({
        where: {
          imoNumber: updateVesselDto.imoNumber,
          NOT: { id },
        },
      });
      if (existing) {
        throw new ConflictException(
          'Vessel with this IMO number already exists',
        );
      }
    }

    const vessel = await this.prisma.vessel.update({
      where: { id },
      data: updateVesselDto,
      include: {
        organization: true,
        captain: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Log audit for vessel update
    await this.auditService.log('Vessel', id, 'UPDATE', before, vessel, {
      userId: updatedByUserId,
      organizationId: vessel.organizationId ?? undefined,
    });

    return vessel;
  }

  async remove(
    id: string,
    organizationId?: string | null,
    deletedByUserId?: string,
  ) {
    const before = await this.findOne(id, organizationId);

    await this.prisma.vessel.delete({ where: { id } });

    // Log audit for vessel deletion
    await this.auditService.log('Vessel', id, 'DELETE', before, null, {
      userId: deletedByUserId,
      organizationId: before.organizationId ?? undefined,
    });

    return { deleted: true, id };
  }

  // Assign a captain to a vessel
  async assignCaptain(
    vesselId: string,
    userId: string,
    organizationId?: string | null,
    assignedByUserId?: string,
  ) {
    // Verify vessel exists and belongs to the organization (throws if not found)
    const vessel = await this.findOne(vesselId, organizationId);

    // Verify the user belongs to the same organization
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, organizationId: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (organizationId && user.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Cannot assign captain from a different organization',
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { assignedVesselId: vesselId },
    });

    // Log audit for captain assignment
    await this.auditService.log(
      'Vessel',
      vesselId,
      'ASSIGN',
      { captain: null },
      { captain: { id: user.id, name: user.name, email: user.email } },
      {
        userId: assignedByUserId,
        organizationId: vessel.organizationId ?? undefined,
      },
    );

    return updatedUser;
  }

  // Remove captain from vessel
  async removeCaptain(
    vesselId: string,
    organizationId?: string | null,
    unassignedByUserId?: string,
  ) {
    const vessel = await this.findOne(vesselId, organizationId);

    if (vessel.captain) {
      const updatedUser = await this.prisma.user.update({
        where: { id: vessel.captain.id },
        data: { assignedVesselId: null },
      });

      // Log audit for captain unassignment
      await this.auditService.log(
        'Vessel',
        vesselId,
        'UNASSIGN',
        { captain: vessel.captain },
        { captain: null },
        {
          userId: unassignedByUserId,
          organizationId: vessel.organizationId ?? undefined,
        },
      );

      return updatedUser;
    }

    return null;
  }
}
