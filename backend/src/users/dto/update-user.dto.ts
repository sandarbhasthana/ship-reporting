import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { RoleName } from '@ship-reporting/prisma';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @IsEnum(RoleName)
  @IsOptional()
  role?: RoleName;

  @IsString()
  @IsOptional()
  organizationId?: string;

  @IsString()
  @IsOptional()
  assignedVesselId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  signatureImage?: string;
}

