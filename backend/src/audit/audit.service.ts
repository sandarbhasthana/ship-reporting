import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditContext {
  userId?: string;
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
    return this.prisma.auditLog.create({
      data: {
        entityType,
        entityId,
        action,
        before: before ? JSON.parse(JSON.stringify(before)) : null,
        after: after ? JSON.parse(JSON.stringify(after)) : null,
        userId: context.userId,
        ip: context.ip,
        userAgent: context.userAgent,
        requestId: context.requestId,
      },
    });
  }

  async findAll(options?: {
    entityType?: string;
    entityId?: string;
    userId?: string;
    skip?: number;
    take?: number;
  }) {
    const where: Record<string, unknown> = {};

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
        },
        orderBy: { createdAt: 'desc' },
        skip: options?.skip ?? 0,
        take: options?.take ?? 50,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total };
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

