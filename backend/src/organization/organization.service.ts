import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';
import { EmailService } from '../email/email.service';
import { RoleName } from '@ship-reporting/prisma';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OrganizationService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  async create(
    createOrganizationDto: CreateOrganizationDto,
    createdByUserId?: string,
  ) {
    const { adminPassword, email, owner, ...orgData } = createOrganizationDto;

    // Hash the admin password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    // Determine admin credentials
    const adminEmail =
      email || `admin@${orgData.name.toLowerCase().replace(/\s+/g, '')}.com`;
    const adminName = owner || `${orgData.name} Admin`;

    // Create organization and admin user in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create the organization
      const organization = await tx.organization.create({
        data: {
          ...orgData,
          email,
          owner,
        },
      });

      // Create the admin user for this organization
      await tx.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          name: adminName,
          role: RoleName.ADMIN,
          organizationId: organization.id,
        },
      });

      return organization;
    });

    // Log audit for organization creation
    await this.auditService.log(
      'Organization',
      result.id,
      'CREATE',
      null,
      result,
      { userId: createdByUserId, organizationId: result.id },
    );

    // Send welcome email to the admin (non-blocking)
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    this.emailService
      .sendWelcomeEmail({
        organizationName: orgData.name,
        adminName,
        adminEmail,
        temporaryPassword: adminPassword,
        loginUrl: `${frontendUrl}/login`,
      })
      .catch((err) => {
        console.error('Failed to send welcome email:', err);
      });

    return result;
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

  async update(
    id: string,
    updateOrganizationDto: UpdateOrganizationDto,
    updatedByUserId?: string,
  ) {
    // Check if organization exists and get before state
    const before = await this.findOne(id);

    const after = await this.prisma.organization.update({
      where: { id },
      data: updateOrganizationDto,
    });

    // Log audit for organization update
    await this.auditService.log('Organization', id, 'UPDATE', before, after, {
      userId: updatedByUserId,
      organizationId: id,
    });

    return after;
  }

  async remove(id: string, deletedByUserId?: string) {
    // Check if organization exists and get before state
    const before = await this.findOne(id);

    await this.prisma.organization.delete({
      where: { id },
    });

    // Log audit for organization deletion
    await this.auditService.log('Organization', id, 'DELETE', before, null, {
      userId: deletedByUserId,
      organizationId: id,
    });

    return { deleted: true, id };
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

  // Get platform analytics for SUPER_ADMIN dashboard
  async getAnalytics() {
    // Get all organizations with counts
    const organizations = await this.prisma.organization.findMany({
      include: {
        _count: {
          select: {
            vessels: true,
            users: true,
            inspectionReports: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate totals
    const totalOrganizations = organizations.length;
    const totalUsers = organizations.reduce(
      (sum, org) => sum + (org._count?.users || 0),
      0,
    );
    const totalVessels = organizations.reduce(
      (sum, org) => sum + (org._count?.vessels || 0),
      0,
    );
    const totalInspections = organizations.reduce(
      (sum, org) => sum + (org._count?.inspectionReports || 0),
      0,
    );

    // Organization distribution (users per org for pie chart)
    const userDistribution = organizations.map((org) => ({
      name: org.name,
      value: org._count?.users || 0,
    }));

    // Vessel distribution (vessels per org for pie chart)
    const vesselDistribution = organizations.map((org) => ({
      name: org.name,
      value: org._count?.vessels || 0,
    }));

    // Inspection distribution (inspections per org)
    const inspectionDistribution = organizations.map((org) => ({
      name: org.name,
      value: org._count?.inspectionReports || 0,
    }));

    // Organization growth over time (by month)
    const growthByMonth: Record<string, number> = {};
    organizations.forEach((org) => {
      const monthKey = org.createdAt.toISOString().slice(0, 7); // YYYY-MM
      growthByMonth[monthKey] = (growthByMonth[monthKey] || 0) + 1;
    });

    // Convert to cumulative growth array
    const sortedMonths = Object.keys(growthByMonth).sort();
    let cumulative = 0;
    const organizationGrowth = sortedMonths.map((month) => {
      cumulative += growthByMonth[month];
      return {
        month,
        count: cumulative,
      };
    });

    // Top organizations by activity (inspections)
    const topOrganizations = [...organizations]
      .sort(
        (a, b) =>
          (b._count?.inspectionReports || 0) -
          (a._count?.inspectionReports || 0),
      )
      .slice(0, 5)
      .map((org) => ({
        name: org.name,
        users: org._count?.users || 0,
        vessels: org._count?.vessels || 0,
        inspections: org._count?.inspectionReports || 0,
      }));

    return {
      summary: {
        totalOrganizations,
        totalUsers,
        totalVessels,
        totalInspections,
      },
      userDistribution,
      vesselDistribution,
      inspectionDistribution,
      organizationGrowth,
      topOrganizations,
    };
  }
}
