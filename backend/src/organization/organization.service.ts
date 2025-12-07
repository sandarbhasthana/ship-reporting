import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  async create(createOrganizationDto: CreateOrganizationDto) {
    return this.prisma.organization.create({
      data: createOrganizationDto,
    });
  }

  async findAll() {
    return this.prisma.organization.findMany({
      include: {
        _count: {
          select: {
            vessels: true,
            users: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        vessels: true,
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return organization;
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    // Check if organization exists
    await this.findOne(id);

    return this.prisma.organization.update({
      where: { id },
      data: updateOrganizationDto,
    });
  }

  async remove(id: string) {
    // Check if organization exists
    await this.findOne(id);

    return this.prisma.organization.delete({
      where: { id },
    });
  }

  // Get organization by user's organizationId
  async getByUser(organizationId: string | null) {
    if (!organizationId) {
      return null;
    }

    return this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
  }
}
