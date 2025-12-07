import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RoleName } from '@ship-reporting/prisma';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('audit-logs')
@UseGuards(RolesGuard)
@Roles(RoleName.ADMIN)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List audit logs (Admin only)' })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  findAll(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.auditService.findAll({
      entityType,
      entityId,
      userId,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Get('entity')
  @ApiOperation({ summary: 'Get audit history for a specific entity' })
  @ApiQuery({ name: 'entityType', required: true })
  @ApiQuery({ name: 'entityId', required: true })
  findByEntity(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
  ) {
    return this.auditService.findByEntity(entityType, entityId);
  }
}

