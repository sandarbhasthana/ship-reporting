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
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { InspectionsService } from './inspections.service';
import { PdfService } from './pdf.service';
import { CreateInspectionDto, UpdateInspectionDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleName } from '@ship-reporting/prisma';

@ApiTags('Inspections')
@ApiBearerAuth()
@Controller('inspections')
@UseGuards(RolesGuard)
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
  ) {
    return this.inspectionsService.create(
      createInspectionDto,
      userId,
      userRole,
      assignedVesselId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all inspection reports (filtered by role)' })
  findAll(
    @CurrentUser('role') userRole: RoleName,
    @CurrentUser('assignedVesselId') assignedVesselId: string | null,
  ) {
    return this.inspectionsService.findAll(userRole, assignedVesselId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inspection report by ID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('role') userRole: RoleName,
    @CurrentUser('assignedVesselId') assignedVesselId: string | null,
  ) {
    return this.inspectionsService.findOne(id, userRole, assignedVesselId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update inspection report' })
  update(
    @Param('id') id: string,
    @Body() updateInspectionDto: UpdateInspectionDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: RoleName,
    @CurrentUser('assignedVesselId') assignedVesselId: string | null,
  ) {
    return this.inspectionsService.update(
      id,
      updateInspectionDto,
      userId,
      userRole,
      assignedVesselId,
    );
  }

  @Delete(':id')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Delete inspection report (Admin only)' })
  remove(@Param('id') id: string) {
    return this.inspectionsService.remove(id);
  }

  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Download inspection report as PDF' })
  async downloadPdf(
    @Param('id') id: string,
    @CurrentUser('role') userRole: RoleName,
    @CurrentUser('assignedVesselId') assignedVesselId: string | null,
    @Res() res: Response,
  ) {
    // Validate access first (same logic as findOne)
    await this.inspectionsService.findOne(id, userRole, assignedVesselId);

    const pdfBuffer = await this.pdfService.generateInspectionPdf(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="inspection-report-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
