import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { VesselsService } from './vessels.service';
import { CreateVesselDto, UpdateVesselDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleName } from '@ship-reporting/prisma';

@ApiTags('Vessels')
@ApiBearerAuth()
@Controller('vessels')
@UseGuards(RolesGuard)
export class VesselsController {
  constructor(private readonly vesselsService: VesselsService) {}

  @Post()
  @Roles(RoleName.ADMIN)
  create(@Body() createVesselDto: CreateVesselDto) {
    return this.vesselsService.create(createVesselDto);
  }

  @Get()
  findAll(
    @Query('organizationId') organizationId?: string,
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
  findOne(@Param('id') id: string) {
    return this.vesselsService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleName.ADMIN)
  update(@Param('id') id: string, @Body() updateVesselDto: UpdateVesselDto) {
    return this.vesselsService.update(id, updateVesselDto);
  }

  @Delete(':id')
  @Roles(RoleName.ADMIN)
  remove(@Param('id') id: string) {
    return this.vesselsService.remove(id);
  }

  @Post(':id/assign-captain/:userId')
  @Roles(RoleName.ADMIN)
  assignCaptain(@Param('id') id: string, @Param('userId') userId: string) {
    return this.vesselsService.assignCaptain(id, userId);
  }

  @Delete(':id/captain')
  @Roles(RoleName.ADMIN)
  removeCaptain(@Param('id') id: string) {
    return this.vesselsService.removeCaptain(id);
  }
}
