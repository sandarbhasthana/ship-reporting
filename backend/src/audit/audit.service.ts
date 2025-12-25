import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@ship-reporting/prisma';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditContext {
  userId?: string;
  organizationId?: string | null; // null for platform-level audits (e.g., org deletion)
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

export interface AuditExportOptions {
  organizationId?: string | null;
  entityType?: string;
  action?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly retentionDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Default retention: 90 days, configurable via environment variable
    this.retentionDays = this.configService.get<number>(
      'AUDIT_LOG_RETENTION_DAYS',
      90,
    );
  }

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
    action?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.AuditLogWhereInput = {};

    // Filter by organization (SUPER_ADMIN without org header can see all)
    if (options?.organizationId) where.organizationId = options.organizationId;
    if (options?.entityType) where.entityType = options.entityType;
    if (options?.entityId) where.entityId = options.entityId;
    if (options?.action) where.action = options.action;
    if (options?.userId) where.userId = options.userId;

    // Date range filter
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

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

  /**
   * Scheduled job to clean up old audit logs
   * Runs daily at 2:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldLogs() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    try {
      const result = await this.prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(
        `Audit log cleanup completed: deleted ${result.count} records older than ${this.retentionDays} days`,
      );

      return result;
    } catch (error) {
      this.logger.error('Audit log cleanup failed', error);
      throw error;
    }
  }

  /**
   * Export audit logs as CSV data
   */
  async exportToCSV(options: AuditExportOptions): Promise<string> {
    const where: Prisma.AuditLogWhereInput = {};

    if (options.organizationId) where.organizationId = options.organizationId;
    if (options.entityType) where.entityType = options.entityType;
    if (options.action) where.action = options.action;
    if (options.userId) where.userId = options.userId;

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true },
        },
        organization: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10000, // Limit export to 10,000 records
    });

    // CSV Header
    const headers = [
      'ID',
      'Timestamp',
      'User',
      'User Email',
      'Organization',
      'Entity Type',
      'Entity ID',
      'Action',
      'IP Address',
      'User Agent',
      'Before',
      'After',
    ];

    // CSV Rows
    const rows = logs.map((log) => [
      log.id,
      log.createdAt.toISOString(),
      log.user?.name || 'System',
      log.user?.email || '',
      log.organization?.name || '',
      log.entityType,
      log.entityId,
      log.action,
      log.ip || '',
      log.userAgent || '',
      log.before ? JSON.stringify(log.before) : '',
      log.after ? JSON.stringify(log.after) : '',
    ]);

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => escapeCSV(String(cell))).join(','),
      ),
    ].join('\n');

    return csvContent;
  }

  /**
   * Get audit log statistics
   */
  async getStats(organizationId?: string | null) {
    const where: Prisma.AuditLogWhereInput = {};
    if (organizationId) where.organizationId = organizationId;

    const [total, byAction, byEntityType, recentActivity] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.groupBy({
        by: ['entityType'],
        where,
        _count: { entityType: true },
        orderBy: { _count: { entityType: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
    ]);

    return {
      total,
      recentActivity,
      byAction: byAction.map((a) => ({
        action: a.action,
        count: a._count.action,
      })),
      byEntityType: byEntityType.map((e) => ({
        entityType: e.entityType,
        count: e._count.entityType,
      })),
    };
  }

  // ============ PLATFORM AUDIT LOGS (SUPER_ADMIN only) ============

  // Platform-level entity types that SUPER_ADMIN should see
  private readonly platformEntityTypes = [
    'Organization',
    'User', // Only for SUPER_ADMIN actions like creating org admins
    'Auth', // Login/logout events for super admin portal
  ];

  // Platform-level actions
  private readonly platformActions = [
    'LOGIN',
    'LOGOUT',
    'LOGIN_FAILED',
    'CREATE',
    'UPDATE',
    'DELETE',
  ];

  /**
   * Find platform-level audit logs for SUPER_ADMIN
   * Shows: Organization CRUD, Super Admin logins, platform-wide user management
   */
  async findPlatformLogs(options?: {
    entityType?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
  }) {
    const where: Prisma.AuditLogWhereInput = {
      // Platform logs are either:
      // 1. Organization entity type (org create/update/delete)
      // 2. Auth events with no organizationId (super admin login)
      // 3. User actions where organizationId is null (super admin managing users)
      OR: [
        { entityType: 'Organization' },
        { entityType: 'Auth', organizationId: null },
        { entityType: 'User', organizationId: null },
      ],
    };

    // Apply additional filters
    if (options?.entityType) {
      where.entityType = options.entityType;
      // Remove OR clause when specific entityType is selected
      delete where.OR;
    }
    if (options?.action) where.action = options.action;

    // Date range filter
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

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

  /**
   * Get platform audit log statistics for SUPER_ADMIN
   */
  async getPlatformStats() {
    const where: Prisma.AuditLogWhereInput = {
      OR: [
        { entityType: 'Organization' },
        { entityType: 'Auth', organizationId: null },
        { entityType: 'User', organizationId: null },
      ],
    };

    const [total, byAction, byEntityType, recentActivity] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.groupBy({
        by: ['entityType'],
        where,
        _count: { entityType: true },
        orderBy: { _count: { entityType: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
    ]);

    return {
      total,
      recentActivity,
      byAction: byAction.map((a) => ({
        action: a.action,
        count: a._count.action,
      })),
      byEntityType: byEntityType.map((e) => ({
        entityType: e.entityType,
        count: e._count.entityType,
      })),
    };
  }

  /**
   * Export platform audit logs as CSV for SUPER_ADMIN
   */
  async exportPlatformLogsToCSV(options: {
    entityType?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<string> {
    const where: Prisma.AuditLogWhereInput = {
      OR: [
        { entityType: 'Organization' },
        { entityType: 'Auth', organizationId: null },
        { entityType: 'User', organizationId: null },
      ],
    };

    if (options.entityType) {
      where.entityType = options.entityType;
      delete where.OR;
    }
    if (options.action) where.action = options.action;

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true },
        },
        organization: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    const headers = [
      'ID',
      'Timestamp',
      'User',
      'User Email',
      'Entity Type',
      'Entity ID',
      'Action',
      'IP Address',
      'Before',
      'After',
    ];

    const rows = logs.map((log) => [
      log.id,
      log.createdAt.toISOString(),
      log.user?.name || 'System',
      log.user?.email || '',
      log.entityType,
      log.entityId,
      log.action,
      log.ip || '',
      log.before ? JSON.stringify(log.before) : '',
      log.after ? JSON.stringify(log.after) : '',
    ]);

    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    return [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => escapeCSV(String(cell))).join(','),
      ),
    ].join('\n');
  }
}
