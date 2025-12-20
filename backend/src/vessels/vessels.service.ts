import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVesselDto, UpdateVesselDto } from './dto';

@Injectable()
export class VesselsService {
  constructor(private prisma: PrismaService) {}

  async create(createVesselDto: CreateVesselDto & { organizationId: string }) {
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

    return this.prisma.vessel.create({
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
  ) {
    await this.findOne(id, organizationId);

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

    return this.prisma.vessel.update({
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
  }

  async remove(id: string, organizationId?: string | null) {
    await this.findOne(id, organizationId);
    return this.prisma.vessel.delete({ where: { id } });
  }

  // Assign a captain to a vessel
  async assignCaptain(
    vesselId: string,
    userId: string,
    organizationId?: string | null,
  ) {
    // Verify vessel exists and belongs to the organization (throws if not found)
    await this.findOne(vesselId, organizationId);

    // Verify the user belongs to the same organization
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (organizationId && user.organizationId !== organizationId) {
      throw new ForbiddenException(
        'Cannot assign captain from a different organization',
      );
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { assignedVesselId: vesselId },
    });
  }

  // Remove captain from vessel
  async removeCaptain(vesselId: string, organizationId?: string | null) {
    const vessel = await this.findOne(vesselId, organizationId);

    if (vessel.captain) {
      return this.prisma.user.update({
        where: { id: vessel.captain.id },
        data: { assignedVesselId: null },
      });
    }

    return null;
  }
}
