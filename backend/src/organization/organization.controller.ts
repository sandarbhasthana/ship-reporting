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
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';
import { Roles, CurrentUser, OrganizationId } from '../auth/decorators';
import { RolesGuard, TenantGuard } from '../auth/guards';
import { RoleName } from '@ship-reporting/prisma';

@ApiTags('Organization')
@ApiBearerAuth()
@Controller('organization')
@UseGuards(TenantGuard, RolesGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  @Roles(RoleName.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create organization (Super Admin only)' })
  create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationService.create(createOrganizationDto);
  }

  @Get()
  @Roles(RoleName.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all organizations (Super Admin only)' })
  findAll() {
    return this.organizationService.findAll();
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user organization' })
  async getMy(@CurrentUser('organizationId') organizationId: string) {
    return this.organizationService.getByUser(organizationId);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current organization context' })
  async getCurrent(@OrganizationId() organizationId: string | null) {
    return this.organizationService.getByUser(organizationId);
  }

  @Get(':id')
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @ApiOperation({ summary: 'Get organization by ID' })
  findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: string | null,
    @CurrentUser('role') userRole: RoleName,
  ) {
    // ADMIN can only view their own organization
    if (userRole === RoleName.ADMIN && organizationId !== id) {
      return this.organizationService.findOne(organizationId!);
    }
    return this.organizationService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleName.SUPER_ADMIN, RoleName.ADMIN)
  @ApiOperation({ summary: 'Update organization' })
  update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
    @OrganizationId() organizationId: string | null,
    @CurrentUser('role') userRole: RoleName,
  ) {
    // ADMIN can only update their own organization
    const targetId =
      userRole === RoleName.ADMIN && organizationId ? organizationId : id;
    return this.organizationService.update(targetId, updateOrganizationDto);
  }

  @Delete(':id')
  @Roles(RoleName.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete organization (Super Admin only)' })
  remove(@Param('id') id: string) {
    return this.organizationService.remove(id);
  }
}
