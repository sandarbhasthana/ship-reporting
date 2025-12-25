import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { EntriesService } from './entries.service';
import { CreateEntryDto, UpdateEntryDto } from './dto';
import { Roles, CurrentUser, OrganizationId } from '../auth/decorators';
import { RolesGuard, TenantGuard } from '../auth/guards';
import { RoleName } from '@ship-reporting/prisma';

@ApiTags('Inspection Entries')
@ApiBearerAuth()
@Controller('inspections/:reportId/entries')
@UseGuards(TenantGuard, RolesGuard)
export class EntriesController {
  constructor(private readonly entriesService: EntriesService) {}

  @Post()
  @ApiOperation({ summary: 'Add entry to inspection report' })
  create(
    @Param('reportId') reportId: string,
    @Body() createEntryDto: CreateEntryDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: RoleName,
    @CurrentUser('assignedVesselId') assignedVesselId: string | null,
    @OrganizationId() organizationId: string | null,
  ) {
    return this.entriesService.create(
      reportId,
      createEntryDto,
      userId,
      userRole,
      assignedVesselId,
      organizationId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all entries for an inspection report' })
  findAll(
    @Param('reportId') reportId: string,
    @CurrentUser('role') userRole: RoleName,
    @CurrentUser('assignedVesselId') assignedVesselId: string | null,
  ) {
    return this.entriesService.findAll(reportId, userRole, assignedVesselId);
  }

  @Get(':entryId')
  @ApiOperation({ summary: 'Get entry by ID' })
  findOne(
    @Param('reportId') reportId: string,
    @Param('entryId') entryId: string,
    @CurrentUser('role') userRole: RoleName,
    @CurrentUser('assignedVesselId') assignedVesselId: string | null,
  ) {
    return this.entriesService.findOne(
      reportId,
      entryId,
      userRole,
      assignedVesselId,
    );
  }

  @Patch(':entryId')
  @ApiOperation({ summary: 'Update entry (field-level permissions apply)' })
  update(
    @Param('reportId') reportId: string,
    @Param('entryId') entryId: string,
    @Body() updateEntryDto: UpdateEntryDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: RoleName,
    @CurrentUser('assignedVesselId') assignedVesselId: string | null,
    @OrganizationId() organizationId: string | null,
  ) {
    return this.entriesService.update(
      reportId,
      entryId,
      updateEntryDto,
      userId,
      userRole,
      assignedVesselId,
      organizationId,
    );
  }

  @Delete(':entryId')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Delete entry (Admin only)' })
  remove(
    @Param('reportId') reportId: string,
    @Param('entryId') entryId: string,
    @CurrentUser('id') userId: string,
    @OrganizationId() organizationId: string | null,
  ) {
    return this.entriesService.remove(
      reportId,
      entryId,
      userId,
      organizationId,
    );
  }
}
