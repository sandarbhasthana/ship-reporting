import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Res,
  Header,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { InspectionsService } from './inspections.service';
import { PdfService } from './pdf.service';
import { CreateInspectionDto, UpdateInspectionDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard, TenantGuard } from '../auth/guards';
import { CurrentUser, OrganizationId } from '../auth/decorators';
import { RoleName } from '@ship-reporting/prisma';

@ApiTags('Inspections')
@ApiBearerAuth()
@Controller('inspections')
@UseGuards(TenantGuard, RolesGuard)
export class InspectionsController {
  constructor(
    private readonly inspectionsService: InspectionsService,
    private readonly pdfService: PdfService,
  ) {}

  @Post()
  @Roles(RoleName.CAPTAIN)
  @ApiOperation({ summary: 'Create a new inspection report (Captain only)' })
  create(
    @Body() createInspectionDto: CreateInspectionDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: RoleName,
    @CurrentUser('assignedVesselId') assignedVesselId: string | null,
    @OrganizationId() organizationId: string | null,
  ) {
    if (!organizationId) {
      throw new ForbiddenException(
        'Organization context required to create reports',
      );
    }
    return this.inspectionsService.create(
      createInspectionDto,
      userId,
      userRole,
      assignedVesselId,
      organizationId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all inspection reports (filtered by org)' })
  findAll(
    @OrganizationId() organizationId: string | null,
    @CurrentUser('role') userRole: RoleName,
    @CurrentUser('assignedVesselId') assignedVesselId: string | null,
  ) {
    return this.inspectionsService.findAll(
      organizationId,
      userRole,
      assignedVesselId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inspection report by ID' })
  findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: string | null,
    @CurrentUser('role') userRole: RoleName,
    @CurrentUser('assignedVesselId') assignedVesselId: string | null,
  ) {
    return this.inspectionsService.findOne(
      id,
      organizationId,
      userRole,
      assignedVesselId,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update inspection report' })
  update(
    @Param('id') id: string,
    @Body() updateInspectionDto: UpdateInspectionDto,
    @CurrentUser('id') userId: string,
    @OrganizationId() organizationId: string | null,
    @CurrentUser('role') userRole: RoleName,
    @CurrentUser('assignedVesselId') assignedVesselId: string | null,
  ) {
    return this.inspectionsService.update(
      id,
      updateInspectionDto,
      userId,
      organizationId,
      userRole,
      assignedVesselId,
    );
  }

  @Delete(':id')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Delete inspection report (Admin only)' })
  remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: string | null,
    @CurrentUser('id') userId: string,
  ) {
    return this.inspectionsService.remove(id, organizationId, userId);
  }

  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Download inspection report as PDF' })
  async downloadPdf(
    @Param('id') id: string,
    @OrganizationId() organizationId: string | null,
    @CurrentUser('role') userRole: RoleName,
    @CurrentUser('assignedVesselId') assignedVesselId: string | null,
    @Res() res: Response,
  ) {
    // Validate access and get report data
    const report = await this.inspectionsService.findOne(
      id,
      organizationId,
      userRole,
      assignedVesselId,
    );

    const pdfBuffer = await this.pdfService.generateInspectionPdf(id);

    // Generate filename: Inspection-report-{reportType}-{shipName}-{dateTime(ddmmyyyyhhmmss)}.pdf
    const now = new Date();
    const dateTime = [
      String(now.getDate()).padStart(2, '0'),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getFullYear()),
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0'),
    ].join('');

    // Sanitize for filename (remove special chars, replace spaces with hyphens)
    const sanitize = (str: string, toUpper = false) =>
      str
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        [toUpper ? 'toUpperCase' : 'toLowerCase']();

    const reportType = sanitize(report.inspectedBy || 'UNKNOWN', true); // Keep uppercase
    const shipName = sanitize(report.vessel?.name || 'unknown');

    const filename = `Inspection-report-${reportType}-${shipName}-${dateTime}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
