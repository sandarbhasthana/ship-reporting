import { Injectable } from '@nestjs/common';
import { Prisma } from '@ship-reporting/prisma';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditContext {
  userId?: string;
  organizationId?: string;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    entityType: string,
    entityId: string,
    action: string,
    before: unknown,
    after: unknown,
    context: AuditContext = {},
  ) {
    // Safely convert to JSON-compatible format for Prisma Json type
    const beforeJson = before
      ? (JSON.parse(JSON.stringify(before)) as Prisma.InputJsonValue)
      : Prisma.JsonNull;
    const afterJson = after
      ? (JSON.parse(JSON.stringify(after)) as Prisma.InputJsonValue)
      : Prisma.JsonNull;

    return this.prisma.auditLog.create({
      data: {
        entityType,
        entityId,
        action,
        before: beforeJson,
        after: afterJson,
        userId: context.userId,
        organizationId: context.organizationId,
        ip: context.ip,
        userAgent: context.userAgent,
        requestId: context.requestId,
      },
    });
  }

  async findAll(options?: {
    organizationId?: string | null;
    entityType?: string;
    entityId?: string;
    userId?: string;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.AuditLogWhereInput = {};

    // Filter by organization (SUPER_ADMIN without org header can see all)
    if (options?.organizationId) where.organizationId = options.organizationId;
    if (options?.entityType) where.entityType = options.entityType;
    if (options?.entityId) where.entityId = options.entityId;
    if (options?.userId) where.userId = options.userId;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          organization: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: options?.skip ?? 0,
        take: options?.take ?? 50,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total };
  }

  async findByEntity(
    entityType: string,
    entityId: string,
    organizationId?: string | null,
  ) {
    const where: Prisma.AuditLogWhereInput = { entityType, entityId };

    // Filter by organization (SUPER_ADMIN without org header can see all)
    if (organizationId) where.organizationId = organizationId;

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
