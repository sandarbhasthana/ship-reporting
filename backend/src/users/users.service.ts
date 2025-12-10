import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@ship-reporting/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { password, ...rest } = createUserDto;

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        ...rest,
        passwordHash,
      },
      include: {
        organization: true,
        assignedVessel: true,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async findAll(organizationId?: string) {
    const where = organizationId ? { organizationId } : {};

    const users = await this.prisma.user.findMany({
      where,
      include: {
        organization: true,
        assignedVessel: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return users.map(({ passwordHash, ...user }) => user);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: true,
        assignedVessel: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    const { password, ...rest } = updateUserDto;

    const data: Prisma.UserUpdateInput = { ...rest };

    // If password is being updated, hash it
    if (password) {
      const saltRounds = 10;
      data.passwordHash = await bcrypt.hash(password, saltRounds);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        organization: true,
        assignedVessel: true,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  async remove(id: string) {
    await this.findOne(id);

    // Soft delete by setting isActive to false
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id } });
  }

  /**
   * Get captain activity for dashboard
   * Returns captains with their last activity from audit logs
   */
  async getCaptainActivity() {
    // Get all captains
    const captains = await this.prisma.user.findMany({
      where: { role: 'CAPTAIN' },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        assignedVessel: {
          select: { name: true },
        },
      },
    });

    // Get last activity for each captain from audit logs
    const captainActivity = await Promise.all(
      captains.map(async (captain) => {
        const lastLog = await this.prisma.auditLog.findFirst({
          where: { userId: captain.id },
          orderBy: { createdAt: 'desc' },
          select: {
            entityType: true,
            entityId: true,
            action: true,
            createdAt: true,
            after: true,
          },
        });

        // Get report title if the entity is an InspectionReport or InspectionEntry
        let reportTitle: string | null = null;
        let reportId: string | null | undefined = null;

        if (lastLog) {
          if (lastLog.entityType === 'InspectionReport') {
            const report = await this.prisma.inspectionReport.findUnique({
              where: { id: lastLog.entityId },
              select: { id: true, title: true },
            });
            reportTitle = report?.title || 'Unknown Report';
            reportId = report?.id;
          } else if (lastLog.entityType === 'InspectionEntry') {
            // Get the report from the entry
            const entry = await this.prisma.inspectionEntry.findUnique({
              where: { id: lastLog.entityId },
              select: {
                report: {
                  select: { id: true, title: true },
                },
              },
            });
            reportTitle = entry?.report?.title || 'Unknown Report';
            reportId = entry?.report?.id;
          }
        }

        return {
          id: captain.id,
          name: captain.name || captain.email,
          vessel: captain.assignedVessel?.name || null,
          isActive: captain.isActive,
          lastActivity: lastLog
            ? {
                action: lastLog.action,
                entityType: lastLog.entityType,
                reportTitle,
                reportId,
                dateTime: lastLog.createdAt,
              }
            : null,
        };
      }),
    );

    return captainActivity;
  }
}
