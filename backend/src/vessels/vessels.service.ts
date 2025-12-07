import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVesselDto, UpdateVesselDto } from './dto';

@Injectable()
export class VesselsService {
  constructor(private prisma: PrismaService) {}

  async create(createVesselDto: CreateVesselDto) {
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

  async findAll(organizationId?: string, userId?: string, userRole?: string) {
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

    // For ADMIN or other roles, show all vessels (optionally filtered by org)
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

  async findOne(id: string) {
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

    return vessel;
  }

  async update(id: string, updateVesselDto: UpdateVesselDto) {
    await this.findOne(id);

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

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.vessel.delete({ where: { id } });
  }

  // Assign a captain to a vessel
  async assignCaptain(vesselId: string, userId: string) {
    await this.findOne(vesselId);

    return this.prisma.user.update({
      where: { id: userId },
      data: { assignedVesselId: vesselId },
    });
  }

  // Remove captain from vessel
  async removeCaptain(vesselId: string) {
    const vessel = await this.findOne(vesselId);

    if (vessel.captain) {
      return this.prisma.user.update({
        where: { id: vessel.captain.id },
        data: { assignedVesselId: null },
      });
    }

    return null;
  }
}
