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
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard, TenantGuard } from '../auth/guards';
import { CurrentUser, OrganizationId } from '../auth/decorators';
import { RoleName } from '@ship-reporting/prisma';

@Controller('users')
@UseGuards(TenantGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(RoleName.ADMIN)
  create(
    @Body() createUserDto: CreateUserDto,
    @OrganizationId() organizationId: string | null,
  ) {
    if (!organizationId) {
      throw new ForbiddenException(
        'Organization context required to create users',
      );
    }
    // Ensure user is created in admin's organization
    return this.usersService.create({
      ...createUserDto,
      organizationId,
    });
  }

  @Get()
  @Roles(RoleName.ADMIN)
  findAll(@OrganizationId() organizationId: string | null) {
    return this.usersService.findAll(organizationId);
  }

  @Get('me')
  getMe(@CurrentUser('id') userId: string) {
    return this.usersService.findOne(userId);
  }

  @Get('captain-activity')
  @Roles(RoleName.ADMIN)
  getCaptainActivity(@OrganizationId() organizationId: string | null) {
    return this.usersService.getCaptainActivity(organizationId);
  }

  @Get(':id')
  @Roles(RoleName.ADMIN)
  findOne(
    @Param('id') id: string,
    @OrganizationId() organizationId: string | null,
  ) {
    return this.usersService.findOne(id, organizationId);
  }

  @Patch(':id')
  @Roles(RoleName.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @OrganizationId() organizationId: string | null,
  ) {
    return this.usersService.update(id, updateUserDto, organizationId);
  }

  @Delete(':id')
  @Roles(RoleName.ADMIN)
  remove(
    @Param('id') id: string,
    @OrganizationId() organizationId: string | null,
  ) {
    return this.usersService.remove(id, organizationId);
  }

  @Delete(':id/hard')
  @Roles(RoleName.ADMIN)
  hardDelete(
    @Param('id') id: string,
    @OrganizationId() organizationId: string | null,
  ) {
    return this.usersService.hardDelete(id, organizationId);
  }
}
