import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { VesselsService } from './vessels.service';
import { CreateVesselDto, UpdateVesselDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard, TenantGuard } from '../auth/guards';
import { CurrentUser, OrganizationId } from '../auth/decorators';
import { RoleName } from '@ship-reporting/prisma';

@ApiTags('Vessels')
@ApiBearerAuth()
@Controller('vessels')
@UseGuards(TenantGuard, RolesGuard)
export class VesselsController {
  constructor(private readonly vesselsService: VesselsService) {}

  @Post()
  @Roles(RoleName.ADMIN)
  create(
    @Body() createVesselDto: CreateVesselDto,
    @OrganizationId() organizationId: string | null,
  ) {
    if (!organizationId) {
      throw new ForbiddenException(
        'Organization context required to create vessels',
      );
    }
    // Ensure vessel is created in user's organization
    return this.vesselsService.create({
      ...createVesselDto,
      organizationId,
    });
  }

  @Get()
  findAll(
    @OrganizationId() organizationId: string | null,
    @CurrentUser('id') userId?: string,
    @CurrentUser('role') userRole?: string,
  ) {
    return this.vesselsService.findAll(organizationId, userId, userRole);
  }

  @Get('my-vessel')
  getMyVessel(@CurrentUser('assignedVesselId') vesselId: string) {
    if (!vesselId) {
      return null;
    }
    return this.vesselsService.findOne(vesselId);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: string | null,
  ) {
    return this.vesselsService.findOne(id, organizationId);
  }

  @Patch(':id')
  @Roles(RoleName.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateVesselDto: UpdateVesselDto,
    @OrganizationId() organizationId: string | null,
  ) {
    return this.vesselsService.update(id, updateVesselDto, organizationId);
  }

  @Delete(':id')
  @Roles(RoleName.ADMIN)
  remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: string | null,
  ) {
    return this.vesselsService.remove(id, organizationId);
  }

  @Post(':id/assign-captain/:userId')
  @Roles(RoleName.ADMIN)
  assignCaptain(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @OrganizationId() organizationId: string | null,
  ) {
    return this.vesselsService.assignCaptain(id, userId, organizationId);
  }

  @Delete(':id/captain')
  @Roles(RoleName.ADMIN)
  removeCaptain(
    @Param('id') id: string,
    @OrganizationId() organizationId: string | null,
  ) {
    return this.vesselsService.removeCaptain(id, organizationId);
  }
}
