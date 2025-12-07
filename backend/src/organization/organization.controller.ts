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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RoleName } from '@ship-reporting/prisma';

@ApiTags('Organization')
@ApiBearerAuth()
@Controller('organization')
@UseGuards(RolesGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  @Roles(RoleName.ADMIN)
  create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationService.create(createOrganizationDto);
  }

  @Get()
  @Roles(RoleName.ADMIN)
  findAll() {
    return this.organizationService.findAll();
  }

  @Get('my')
  async getMy(@CurrentUser('organizationId') organizationId: string) {
    return this.organizationService.getByUser(organizationId);
  }

  @Get('current')
  async getCurrent(@CurrentUser('organizationId') organizationId: string) {
    return this.organizationService.getByUser(organizationId);
  }

  @Get(':id')
  @Roles(RoleName.ADMIN)
  findOne(@Param('id') id: string) {
    return this.organizationService.findOne(id);
  }

  @Patch(':id')
  @Roles(RoleName.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationService.update(id, updateOrganizationDto);
  }

  @Delete(':id')
  @Roles(RoleName.ADMIN)
  remove(@Param('id') id: string) {
    return this.organizationService.remove(id);
  }
}
